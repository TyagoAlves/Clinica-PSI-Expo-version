# 4. Banco de dados e Supabase

> **Para quem é este documento:** para quem quer entender **onde e como** os dados do app ficam guardados.
> Não precisa saber programar.
>
> Antes: [3. Conceitos de código](03-CONCEITOS-DE-CODIGO.md) · Depois: [5. API](05-API.md)

---

## 4.1. O que é um banco de dados?

Um **banco de dados** é um programa feito para **guardar informações de forma organizada** e encontrá-las rápido.

A melhor comparação é uma **planilha do Excel**:

| Planilha | Banco de dados |
|---|---|
| O arquivo inteiro | O **banco** |
| Cada aba (Pacientes, Agenda...) | Uma **tabela** |
| Cada coluna (Nome, Telefone...) | Uma **coluna** (ou campo) |
| Cada linha (um paciente) | Uma **linha** (ou registro) |

Exemplo da tabela de pacientes:

| id | name | phone | status |
|---|---|---|---|
| `a1b2…` | Maria da Silva | 61900000000 | Em tratamento |
| `c3d4…` | João Souza | 61988887777 | Pausado |

**Por que não usar uma planilha mesmo?** Porque o banco de dados:
- aguenta milhões de linhas sem ficar lento;
- deixa várias pessoas usarem ao mesmo tempo sem bagunçar;
- **recusa dados errados** (por exemplo, uma data "31/02");
- controla quem pode ver o quê.

---

## 4.2. PostgreSQL e SQL

Existem vários "tipos" de banco de dados. O nosso é o **PostgreSQL** (fala-se "póstgres"), um dos mais usados no
mundo, gratuito e muito confiável.

Para conversar com ele, usa-se o **SQL** ("ésse-quê-éle"), uma língua feita só para isso. Ela é quase inglês:

```sql
-- Buscar (ler) os pacientes da clínica 123 que não foram apagados
SELECT * FROM patients WHERE clinic_id = '123' AND deleted_at IS NULL;

-- Criar (inserir) um paciente
INSERT INTO patients (id, clinic_id, name, phone) VALUES ('a1b2', '123', 'Maria da Silva', '61900000000');

-- Alterar (atualizar) o telefone
UPDATE patients SET phone = '61911112222' WHERE id = 'a1b2';
```

| Palavra do SQL | Tradução |
|---|---|
| `SELECT` | selecione (busque) |
| `*` | todas as colunas |
| `FROM` | da tabela |
| `WHERE` | onde (só as linhas que...) |
| `INSERT INTO ... VALUES` | insira na tabela ... os valores |
| `UPDATE ... SET` | atualize ... trocando |
| `CREATE TABLE` | crie uma tabela |

> No nosso projeto, **ninguém escreve SQL à mão no dia a dia**: a API monta esses comandos sozinha.
> Mas é bom reconhecer, porque eles aparecem no código e nos logs.

---

## 4.3. O que é o Supabase?

Para o banco funcionar, ele precisa ficar ligado **24 horas** num computador ligado à internet (um **servidor**).
Manter um servidor dá trabalho. O **Supabase** é um serviço que **hospeda o PostgreSQL para nós, na nuvem**:

- a gente cria um projeto no site [supabase.com](https://supabase.com);
- o Supabase liga um PostgreSQL só nosso e dá um **endereço com senha** para acessar;
- ele tem um painel no navegador para **ver as tabelas** como se fosse uma planilha;
- o plano gratuito é suficiente para o nosso projeto.

> O Supabase também oferece outras coisas (login pronto, uma API automática...). **Nós usamos só o banco
> PostgreSQL dele.** O login e a API são os nossos, feitos na pasta `api/`.

---

## 4.4. As tabelas do Clínica Psi

O nosso banco tem **7 tabelas**:

| Tabela | O que guarda | Em português |
|---|---|---|
| `users` | Quem usa o sistema: nome, e-mail, senha (só o hash), CRP | Usuários |
| `clinics` | Dados da clínica: nome, unidade, CNPJ, telefone, endereço, sigla | Clínicas |
| `sessions` | Os logins ativos (cada aparelho conectado tem um) | Sessões de login |
| `patients` | Pacientes: nome, telefone, nascimento, serviço, situação, queixa... | Pacientes |
| `services` | Serviços da clínica: nome, descrição, duração, preço, ativo | Serviços |
| `appointments` | Sessões da agenda: paciente, data, horário, duração, situação | Agenda |
| `evolutions` | Prontuário: data da consulta, texto da anotação, autor | Evoluções |

> ⚠️ **Cuidado com a palavra "sessão":** a tabela `sessions` guarda **logins**. As **consultas** da agenda
> ficam na tabela `appointments` ("compromissos", em inglês).

### Como as tabelas se ligam

```text
                 clinics (a clínica)
        ┌───────────┼──────────────┬───────────────┐
        ▼           ▼              ▼               ▼
      users     patients        services     (tudo tem clinic_id)
        │           │
        ▼           ├──────────────┐
    sessions        ▼              ▼
   (logins)    appointments    evolutions
               (agenda)        (prontuário)
```

- Todo paciente, serviço, sessão e evolução tem uma coluna **`clinic_id`**: "de qual clínica sou?".
  É assim que **uma clínica nunca vê os dados da outra**.
- Toda sessão da agenda e toda evolução tem uma coluna **`patient_id`**: "de qual paciente sou?".

### A tabela `patients` explicada (versão resumida)

```sql
CREATE TABLE patients (
  id TEXT PRIMARY KEY,                             -- identificador único do paciente
  clinic_id TEXT NOT NULL REFERENCES clinics(id),  -- de qual clínica ele é
  name TEXT NOT NULL,                              -- nome (obrigatório)
  phone TEXT,                                      -- telefone (só números)
  email TEXT,
  birth_date DATE,                                 -- data de nascimento
  service TEXT,                                    -- nome do serviço (ex.: Psicoterapia)
  status TEXT NOT NULL DEFAULT 'Em tratamento'
    CHECK (status IN ('Em tratamento', 'Pausado', 'Alta')),
  complaint_enc TEXT,                              -- queixa principal (embaralhada)
  created_at TIMESTAMPTZ NOT NULL,                 -- quando foi criado
  updated_at TIMESTAMPTZ NOT NULL,                 -- última alteração
  deleted_at TIMESTAMPTZ                           -- quando foi apagado (vazio = não foi)
);
```

Cada pedaço, em português:

| Trecho | O que significa |
|---|---|
| `TEXT`, `DATE`, `TIMESTAMPTZ` | O **tipo** da coluna: texto, data, data com hora |
| `PRIMARY KEY` | **Chave primária**: o "RG" da linha. Nunca se repete |
| `NOT NULL` | **Obrigatório**: o banco recusa a linha se faltar |
| `REFERENCES clinics(id)` | **Chave estrangeira**: tem que apontar para uma clínica que existe |
| `DEFAULT 'Em tratamento'` | **Valor padrão**: se não informar, fica esse |
| `CHECK (status IN (...))` | **Regra**: só aceita um desses valores |

---

## 4.5. Decisões importantes (e por quê)

### O `id` é um UUID

Cada registro tem um identificador como `3f2b8c1e-9a4d-4e2f-b7c1-0d9e8f7a6b5c`. Isso é um **UUID**: um código
aleatório tão grande que **nunca se repete**, nem entre clínicas diferentes. É melhor que 1, 2, 3...
porque ninguém consegue "adivinhar" o próximo número e espiar o paciente de outra clínica.

### Apagar não apaga de verdade (exclusão lógica)

Quando alguém exclui um paciente, a linha **não some**: a API só preenche a coluna `deleted_at` com a data e a hora.
As listas mostram só as linhas com `deleted_at` vazio. Isso se chama **exclusão lógica** (*soft delete*).

**Por quê?** Para dar para recuperar um paciente apagado por engano, e porque prontuário é um documento
que a clínica precisa guardar.

### Dados sensíveis ficam embaralhados (criptografia)

As colunas que terminam em **`_enc`** (de *encrypted*, "criptografado") guardam texto embaralhado:

| Coluna | O que é |
|---|---|
| `patients.document_enc` | CPF/RG |
| `patients.address_enc` | Endereço |
| `patients.guardian_enc` | Responsável |
| `patients.complaint_enc` | Queixa principal |
| `patients.notes_enc` | Observações |
| `evolutions.content_enc` | **O texto do prontuário** |
| `appointments.notes_enc` | Observações da sessão |

Quem abrir o banco direto no Supabase vê algo como `v1:k3J9...:Xw2...:pQ7...`. Só a nossa API, que tem a
**chave** (`DATA_ENCRYPTION_KEY`, no arquivo `.env`), consegue desembaralhar. O método usado se chama **AES-256-GCM**,
o mesmo tipo usado por bancos e governos.

> ⚠️ **Perder a chave = perder esses dados para sempre.** Guarde a chave num lugar seguro.

### A senha nunca é guardada

A tabela `users` **não tem a senha**. Ela tem um **hash** (`password_hash`): uma "impressão digital" da senha,
que não dá para transformar de volta. Na hora do login, a API calcula o hash da senha digitada e compara.

### Datas com tipo de data

Datas usam `DATE` (só o dia), horários usam `TIME` e "quando aconteceu" usa `TIMESTAMPTZ` (data + hora + fuso).
Assim o banco **recusa datas impossíveis** e ordena a agenda do jeito certo.

### Como cada dado fica guardado

| Dado | Como fica no banco | Exemplo |
|---|---|---|
| Telefone | só números | `61900000000` |
| CNPJ da clínica | só números | `11222333000181` |
| E-mail | minúsculo | `maria@email.com` |
| Preço do serviço | em **centavos** (número inteiro) | `15000` = R$ 150,00 |
| Duração | minutos | `50` |
| Ativo | verdadeiro ou falso | `true` |

> **Por que o preço em centavos?** Computadores erram contas com vírgula (0,1 + 0,2 dá 0,30000000000000004).
> Com números inteiros, isso não acontece.

---

## 4.6. Segurança do Supabase: o RLS

O Supabase oferece, para todo projeto, uma **API automática** que qualquer um com a "chave pública" pode usar.
Nós **não usamos** essa API, e não queremos que ninguém use.

Por isso, todas as tabelas estão com o **RLS** (*Row Level Security*, "segurança por linha") **ligado e sem nenhuma regra**.
Na prática: "ninguém pode ler nenhuma linha por essa API automática". Só a nossa API, que entra com a senha do
dono do banco, acessa os dados.

---

## 4.7. Como as tabelas foram criadas (migrações)

As tabelas **não foram criadas à mão** no Supabase. Elas estão escritas no arquivo
**`api/src/db/migrations.ts`**, como uma lista de passos numerados (as **migrações**):

1. **Migração 1** (`schema_inicial_postgres`): cria todas as tabelas e liga o RLS.
2. **Migração 2:** troca as datas, que eram texto, por tipos de data de verdade.

Quando a API liga, ela confere quais migrações já rodaram (fica anotado numa tabela de controle) e roda só as que faltam.
É como um caderno de obras: "passo 1 feito, passo 2 feito"; se aparecer um passo 3, só ele é executado.
**Vantagem:** qualquer pessoa que ligar a API num banco novo e vazio ganha todas as tabelas prontas, iguais às nossas.

---

## 4.8. Como criar um banco no Supabase do zero

Só é necessário se você quiser um banco **seu**, separado (por exemplo, para testar sem mexer nos dados do time).

1. Entre em [supabase.com](https://supabase.com) e crie uma conta (pode ser com o GitHub).
2. Clique em **New project**.
3. Preencha: nome do projeto, **senha do banco** (anote!) e a região (ex.: *East US* ou *South America*).
4. Espere alguns minutos até o projeto ficar pronto.
5. Clique no botão **Connect** (no topo da página do projeto).
6. Em **Connection string**, escolha **URI** e o modo **Session pooler**. Copie o endereço.
   Ele tem o formato:
   ```text
   postgresql://postgres.<projeto>:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
   ```
7. Cole no arquivo `api/.env`, na linha `DATABASE_URL=`, **trocando `[YOUR-PASSWORD]` pela senha do passo 3**.
8. Gere uma chave de criptografia nova (só porque o banco é novo):
   ```powershell
   cd api
   npm run gen:key
   ```
   Cole o resultado na linha `DATA_ENCRYPTION_KEY=` do `.env`.
9. Ligue a API (`npm run dev`). Ela cria as tabelas sozinha **e já liga o RLS** em todas elas
   (está no fim da migração 1, com comandos `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
10. No Supabase, abra o **Table Editor**: as 7 tabelas devem aparecer, vazias.

> **Por que "Session pooler"?** O Supabase oferece alguns jeitos de conectar. O *Session pooler* funciona
> em qualquer rede (inclusive as que não têm IPv6) e é o mais simples para a nossa API.

---

## 4.9. Como ver os dados no Supabase

1. Abra o projeto no site do Supabase.
2. No menu da esquerda, clique em **Table Editor**.
3. Escolha uma tabela (por exemplo, `patients`). Os dados aparecem como numa planilha.

Você vai notar:
- as colunas `_enc` mostram texto embaralhado (é a criptografia funcionando);
- pacientes "apagados" continuam lá, com `deleted_at` preenchido;
- os telefones aparecem só com números.

> ⚠️ **Evite editar dados direto no Table Editor.** A API confere regras (formato do telefone, a clínica certa,
> criptografia) que o editor do Supabase não confere. Prefira sempre mexer pelo app.

---

## 4.10. Como o app chega até o banco

O app **nunca** fala com o banco direto. O caminho completo de "abrir a lista de pacientes" é:

```text
1. Tela de Pacientes         →  pede: "quero os pacientes da clínica 123"
2. app/src/banco/bancoDados.ts →  manda pela internet: GET /api/v1/clinics/123/patients
3. API (api/src/routes)      →  confere o login e se a clínica 123 é da pessoa
4. API (api/src/repositories/postgres.ts) → monta o SQL:
       SELECT * FROM patients WHERE clinic_id = $1 AND deleted_at IS NULL ORDER BY ...
5. Supabase                  →  devolve as linhas
6. API                       →  desembaralha os campos _enc e devolve em JSON
7. Tela                      →  mostra a lista
```

### O que é aquele `$1`?

É uma **proteção contra SQL Injection**, um dos ataques mais comuns da internet.

Imagine que alguém digite, no campo de nome, um texto que é **um comando SQL** (por exemplo, um comando para
apagar a tabela). Se a API **colasse** esse texto no meio do SQL, o banco poderia executar o comando.

Por isso, a API manda o SQL com "buracos" (`$1`, `$2`...) e os valores **separados**. O PostgreSQL trata cada
valor sempre como **dado**, nunca como comando. Qualquer texto digitado vira só um nome esquisito, sem perigo.

### Um código só para 4 tabelas

Pacientes, serviços, sessões e evoluções funcionam igual (listar, buscar, criar, editar, apagar).
Então o arquivo `postgres.ts` tem **uma única peça de código** (`PgRecordRepository`) que serve para as quatro.
Cada tabela só descreve suas colunas numa lista, mais ou menos assim:

```typescript
// api/src/repositories/postgres.ts (resumido)
{ key: 'name',      column: 'name' },                          // nome no app → nome no banco
{ key: 'birthDate', column: 'birth_date', type: 'dateBr' },    // é uma data
{ key: 'complaint', column: 'complaint_enc', encrypted: true } // é embaralhado
```

E o código monta o SQL a partir dessa lista. Assim, para adicionar uma coluna nova, basta uma linha a mais.

### Criar e editar com um comando só

Para gravar, a API usa um único comando que serve tanto para **criar** quanto para **editar**:

```sql
INSERT INTO patients (...) VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...
```

Em português: "insira esta linha; **se já existir uma com este id**, atualize os campos em vez disso".
Esse truque é chamado de **upsert** (update + insert).

---

## 4.11. Sobras que você pode encontrar no banco

O projeto completo (antes de ser simplificado para a apresentação) tinha funções que foram retiradas.
Por isso, no Supabase ainda existem:

- a tabela **`audit_log`** (registrava quem acessou cada dado);
- a tabela **`meta`** (controle do modo offline);
- a coluna **`rev`** em várias tabelas (também do modo offline; hoje sempre vale 0).

A API atual **não usa** nada disso. Não foram apagadas para não mexer no banco que já está em uso.
