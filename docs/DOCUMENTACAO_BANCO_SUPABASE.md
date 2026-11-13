# Documentação do Banco de Dados (Supabase PostgreSQL)

Este documento explica como o **Clínica Psi** guarda e lê os dados. O sistema usa **somente o Supabase (PostgreSQL na nuvem)** como banco de dados: o celular não guarda pacientes, só o token do login.

---

## 1. Arquitetura da conexão (por que 3 partes?)

O app (React Native) fala **HTTP**. O PostgreSQL do Supabase fala outro protocolo (**TCP na porta 5432**) e exige uma senha secreta (`DATABASE_URL`). Por isso existe uma API no meio, que guarda a senha e conversa com o banco:

```text
[ Telas do app (app/src/telas) ]
          │
          ▼  chamam funções async/await
[ Cliente HTTP (app/src/banco/bancoDados.ts) ]
          │
          ▼  requisições HTTP (GET, POST, PATCH, DELETE) com o token do login
[ API Node.js (api/) — porta 3333 ]
          │
          ▼  comandos SQL usando a DATABASE_URL do api/.env
[ Banco de dados Supabase (PostgreSQL na nuvem) ]
```

| Parte | Onde fica | O que faz |
| :--- | :--- | :--- |
| **Telas** | `app/src/telas/*.tsx` | Mostram os dados e chamam as funções do `bancoDados.ts` |
| **Cliente HTTP** | `app/src/banco/bancoDados.ts` | 5 funções de CRUD + o hook `useDados` |
| **API** | `api/src/` | Confere o login, valida os dados e executa o SQL |
| **Banco** | Supabase | Guarda as tabelas |

---

## 2. Configuração do ambiente (`api/.env`)

O arquivo `api/.env` guarda a configuração da API e a conexão com o Supabase:

```env
# Endereço e porta onde a API escuta o app
HOST=127.0.0.1
PORT=3333

# Conexão com o banco PostgreSQL do Supabase (Connect → Session pooler)
DATABASE_URL=postgresql://postgres.<PROJETO>:<SENHA>@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# Chave que cifra os campos clínicos (gerada com: npm run gen:key)
DATA_ENCRYPTION_KEY=...
```

> **Segurança:** o `.env` está no `.gitignore`, então a senha do banco nunca vai para o GitHub. Modelo sem senhas: `api/.env.example`.

---

## 3. As tabelas no Supabase

A API cria as tabelas sozinha na primeira vez que sobe (arquivo `api/src/db/migrations.ts`). São 7:

| Tabela | O que guarda |
| :--- | :--- |
| `users` | Quem usa o sistema: nome, e-mail, senha (só o *hash*), CRP |
| `clinics` | Dados da clínica: nome, unidade, CNPJ, telefone, endereço, sigla |
| `patients` | Pacientes: nome, telefone, nascimento, serviço, situação, profissional… |
| `services` | Serviços da clínica: nome, descrição, duração, preço, ativo |
| `appointments` | Sessões da agenda: paciente, data, horário, duração, situação |
| `evolutions` | Prontuário: data da sessão, texto da evolução, autor |
| `sessions` | Logins ativos (o token de cada aparelho) |

> As tabelas `audit_log` e `meta` e a coluna `rev` ainda existem no banco, mas sobraram de funções que foram retiradas (auditoria e modo offline). A API não usa mais.

### 3.1. Exemplo: tabela `patients`
Versão resumida (faltam alguns campos cifrados, como `document_enc` e `notes_enc`):
```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,                 -- identificador único (UUID)
  clinic_id TEXT NOT NULL REFERENCES clinics(id),  -- de qual clínica é o paciente
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  service TEXT,
  treatment_start DATE,
  status TEXT NOT NULL DEFAULT 'Em tratamento'
    CHECK (status IN ('Em tratamento', 'Pausado', 'Alta')),
  professional TEXT,
  complaint_enc TEXT,                  -- queixa principal (cifrada)
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ               -- preenchida quando o paciente é apagado
);
```
- **`REFERENCES clinics(id)`**: liga cada paciente a uma clínica. Cada clínica só vê os próprios pacientes.
- **`CHECK (status IN …)`**: o banco recusa uma situação que não esteja na lista.
- **`deleted_at`**: apagar não remove a linha, só marca a data (*exclusão lógica*). Assim dá para recuperar.

### 3.2. Exemplo: tabela `appointments` (agenda)
```sql
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),  -- a sessão aponta para o paciente
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration_min INTEGER NOT NULL,
  service TEXT,
  status TEXT NOT NULL DEFAULT 'Agendada'
    CHECK (status IN ('Agendada', 'Realizada', 'Cancelada', 'Faltou')),
  notes_enc TEXT                       -- observações (cifradas)
);
```
- **`patient_id REFERENCES patients(id)`**: o banco não deixa criar sessão para um paciente que não existe.
- **`DATE` e `TIME`**: tipos de data de verdade; o banco recusa "31/02" e ordena a agenda corretamente.

---

## 4. A API e as consultas SQL (`api/`)

A API é dividida em camadas, cada uma com um papel:

```text
routes  → recebe a requisição HTTP e valida os dados  (api/src/routes)
services → regras do negócio e checagem da clínica     (api/src/services)
repositories → monta e executa o SQL                   (api/src/repositories/postgres.ts)
```

Pacientes, serviços, evoluções e sessões usam **o mesmo código de SQL** (`PgRecordRepository`). Cada tabela só
descreve suas colunas (nome no app, nome no banco, se é cifrada, se é data), e o repositório monta o SQL a partir
dessa lista. Por isso a tabela abaixo vale para as quatro.

### As 4 operações do CRUD

| Operação | Método HTTP e rota (exemplo: pacientes) | SQL executado no Supabase |
| :--- | :--- | :--- |
| **1. Listar** | `GET /api/v1/clinics/:clinica/patients` | `SELECT * FROM patients WHERE clinic_id = $1 AND deleted_at IS NULL ORDER BY … LIMIT … OFFSET …` |
| **2. Criar** | `POST /api/v1/clinics/:clinica/patients` | `INSERT INTO patients (…) VALUES ($1, $2, …)` com um `id` novo |
| **3. Editar** | `PATCH /api/v1/patients/:id` | o mesmo `INSERT`, com `ON CONFLICT (id) DO UPDATE SET …`: como o `id` já existe, a linha é atualizada |
| **4. Apagar** | `DELETE /api/v1/patients/:id` | grava `deleted_at` com a data de agora |

As outras tabelas seguem o mesmo padrão: `/services`, `/appointments` (agenda) e `/evolutions` (prontuário).

#### Destaques para explicar na apresentação
1. **Proteção contra SQL Injection (`$1, $2…`)**: os valores nunca são colados dentro do texto do SQL. Eles vão separados, e o PostgreSQL trata cada um como dado, não como comando.
2. **Login (token)**: toda rota, menos login e cadastro, exige o cabeçalho `Authorization: Bearer <token>`. Sem token válido a API responde **401**.
3. **Uma clínica não vê a outra**: a API confere se o paciente pertence à clínica de quem está logado antes de ler ou gravar.
4. **Campos clínicos cifrados**: documento (CPF/RG), endereço, responsável, queixa, observações e o texto das evoluções são gravados cifrados (AES-256). Quem abrir o banco direto vê só `v1:…`.
5. **RLS ligado no Supabase**: todas as tabelas têm *Row Level Security* sem regras. Isso bloqueia a API automática do Supabase; só a nossa API acessa os dados.

---

## 5. O cliente de comunicação (`app/src/banco/bancoDados.ts`)

É o único arquivo do app que fala com o banco. Tem as funções do CRUD:

| Função | O que faz |
| :--- | :--- |
| **`buscarDados(caminho)`** | `GET` — busca uma lista (ex.: todos os pacientes da clínica) |
| **`buscarUm(caminho)`** | `GET` — busca um item só (ex.: um paciente) |
| **`criarNoBanco(caminho, item)`** | `POST` — cria e devolve o registro salvo, já com o `id` |
| **`atualizarNoBanco(caminho, campos)`** | `PATCH` — salva só os campos alterados |
| **`apagarNoBanco(caminho)`** | `DELETE` — apaga o registro |

Os caminhos ficam juntos no objeto `rotas`, para não espalhar endereços pelo código:

```typescript
rotas.pacientes(clinica.id)          // '/api/v1/clinics/<id>/patients'
rotas.paciente(id)                   // '/api/v1/patients/<id>'
rotas.sessoes(clinica.id, { de: hoje, ate: hoje })   // sessões de hoje
rotas.evolucoesDoPaciente(id)        // prontuário do paciente
```

Depois de criar, editar ou apagar, o arquivo chama `avisarMudanca()`: todas as listas abertas recarregam sozinhas do banco.
O mesmo acontece no botão "Atualizar agora", ao voltar a internet e a cada 1 minuto (`app/src/conexao/ConexaoProvider.tsx`).

---

## 6. Como as telas usam o banco

### Mostrar uma lista: o hook `useDados`
```typescript
// Busca ao abrir a tela e recarrega quando algo muda
const { itens: pacientes } = useDados<Paciente>(rotas.pacientes(clinic.id));

// Atalhos prontos para as listas mais usadas
const { itens: pacientes } = usePacientes();
const { itens: servicos } = useServicos();
```

### Criar, editar e apagar
```typescript
// Novo paciente (tela Pacientes)
await criarNoBanco(rotas.pacientes(clinic.id), dadosDoFormulario);

// Ativar/desativar um serviço (tela Serviços)
await atualizarNoBanco(rotas.servico(servico.id), { active: !servico.active });

// Excluir uma sessão (Agenda)
await apagarNoBanco(rotas.sessao(sessao.id));
```

Se der erro (sem internet, dado inválido), a função lança o erro com a mensagem da API, e o formulário mostra essa mensagem na tela.

---

## 7. Como executar o projeto

Mantenha dois terminais abertos:

1. **Terminal 1 — API conectada ao Supabase (porta 3333):**
   ```powershell
   cd api
   npm install
   npm run dev
   ```
   Mensagem esperada: `[api] clinica-api ouvindo em http://127.0.0.1:3333 … banco PostgreSQL aws-1-us-east-1.pooler.supabase.com:5432`.

2. **Terminal 2 — App Expo (porta 8081):**
   ```powershell
   cd app
   npm install
   npx expo start --android
   ```
   No emulador Android, o app acessa a API pelo endereço `10.0.2.2:3333` (é o "localhost" do computador visto de dentro do emulador).
