# 5. A API

> **Para quem é este documento:** para quem quer entender o que é uma API, como a nossa foi construída,
> o que ela faz e como usá-la. Começa do zero e vai aumentando aos poucos.
>
> Antes: [4. Banco de dados](04-BANCO-DE-DADOS.md) · Depois: [6. CSS](06-CSS.md) · Lista técnica de rotas: [`api/API.md`](../api/API.md)

---

## 5.1. O que é uma API?

**API** quer dizer *Application Programming Interface* ("interface de programação de aplicações").
Em palavras simples: **é um programa que recebe pedidos de outros programas e devolve respostas**.

### A comparação do restaurante

| Restaurante | Nosso projeto |
|---|---|
| O cliente, sentado no salão | O **app** no celular |
| O **garçom** | A **API** |
| O cardápio (o que dá para pedir) | As **rotas** da API |
| A cozinha e a despensa | O **banco de dados** (Supabase) |

O cliente **não entra na cozinha**. Ele faz o pedido ao garçom, que:
1. confere se o pedido faz sentido ("esse prato existe?");
2. confere se o cliente pode pedir ("você tem reserva?");
3. vai à cozinha, pega o prato e traz de volta.

A nossa API faz exatamente isso com os dados da clínica.

### Por que precisamos de uma API?

1. **Segurança da senha do banco.** Para entrar no banco é preciso uma senha. Se ela ficasse no app, qualquer um
   poderia tirá-la de dentro do app e acessar os dados de todas as clínicas. A senha fica só na API.
2. **Regras num lugar só.** "Uma clínica não pode ver a outra", "o nome do paciente é obrigatório",
   "a queixa é guardada embaralhada"... Tudo isso fica na API. Se amanhã existir um site além do app,
   ele usa a mesma API e segue as mesmas regras.
3. **O app fica mais simples.** Ele só pede e mostra. Quem pensa nas regras é a API.

---

## 5.2. Como um pedido funciona (HTTP)

App e API conversam pela internet usando o **HTTP**, o mesmo "idioma" que o navegador usa para abrir sites.
Todo pedido tem 4 partes:

### 1) O endereço (URL)

```text
http://10.0.2.2:3333/api/v1/clinics/123/patients
└─┬─┘  └───┬───┘ └┬─┘ └─┬──┘ └──────────┬────────┘
protocolo  computador porta versão   rota (o que você quer)
```

- **Computador:** onde a API está rodando. No emulador, `10.0.2.2` quer dizer "o computador onde o emulador está".
- **Porta:** um "número de apartamento". A nossa API mora na porta **3333**.
- **`/api/v1`:** todas as rotas começam assim (`v1` = versão 1).
- **Rota:** o que você quer. `/clinics/123/patients` = "os pacientes da clínica 123".

### 2) O método (o verbo)

| Método | Significa | Exemplo |
|---|---|---|
| `GET` | **Buscar** | Ver a lista de pacientes |
| `POST` | **Criar** | Cadastrar um paciente novo |
| `PATCH` | **Alterar** uma parte | Mudar só o serviço do paciente |
| `DELETE` | **Apagar** | Excluir uma sessão |

### 3) O corpo (os dados), em JSON

Quando o app cria ou altera algo, ele manda os dados em **JSON**, um formato de texto simples:

```json
{
  "name": "Maria da Silva",
  "service": "Psicoterapia",
  "treatmentStart": "10/03/2026",
  "complaint": "Ansiedade no trabalho"
}
```

### 4) Os cabeçalhos (informações extras)

O mais importante é o **token do login**, que prova quem está pedindo:

```text
Authorization: Bearer 8Kq3vX...
```

("Bearer" quer dizer "portador": "quem porta esta pulseira já fez login".)

### A resposta

A API responde com um **código de status** (um número) e, quase sempre, um JSON.

| Código | Significa | Quando acontece |
|---|---|---|
| **200** | Deu certo | Buscou ou alterou |
| **201** | Criado | Cadastrou algo novo |
| **204** | Deu certo, sem nada para mostrar | Apagou |
| **400** | Pedido com erro | Faltou o nome, data inválida... |
| **401** | Não está logado | Sem token, ou o login venceu |
| **403** | Proibido | Tentou mexer em dados de outra clínica |
| **404** | Não encontrado | O paciente não existe |
| **409** | Conflito | E-mail já cadastrado |
| **429** | Muitas tentativas | Errou a senha 5 vezes em 15 minutos |

Quando dá erro, a resposta sempre explica em português:

```json
{ "error": { "code": "validation_error", "message": "Informe o nome." } }
```

O app mostra essa `message` direto na tela.

---

## 5.3. Como fazer uma API (o básico)

Antes de olhar a nossa, veja a **menor API possível**, feita com **Node.js** e **Express**:

```javascript
import express from 'express';     // 1. pega a biblioteca Express

const app = express();             // 2. cria a API
app.use(express.json());           // 3. ensina a API a ler JSON

// 4. cria uma rota: quando alguém pedir GET /ola, responde com uma mensagem
app.get('/ola', (req, res) => {
  res.json({ mensagem: 'Olá, mundo!' });
});

app.listen(3000);                  // 5. começa a "ouvir" pedidos na porta 3000
```

Rodando isso, ao abrir `http://localhost:3000/ola` no navegador, aparece `{"mensagem":"Olá, mundo!"}`.

- **`req`** (*request*, "pedido"): tudo o que chegou (endereço, corpo, cabeçalhos).
- **`res`** (*response*, "resposta"): o que a API devolve.

**A nossa API é isso, só que com mais rotas e com regras de segurança.** Na nossa, a rota mais simples é quase igual:

```typescript
// api/src/routes/index.ts
r.get('/ping', (_req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});
```

Ligue a API e abra `http://127.0.0.1:3333/api/v1/ping` no navegador para ver.

---

## 5.4. Como a nossa API foi feita

### As ferramentas

| Ferramenta | Para quê |
|---|---|
| **Node.js** | Roda o código da API no computador |
| **TypeScript** | A linguagem (JavaScript com tipos) |
| **Express** | Cria as rotas, como no exemplo acima |
| **zod** | Confere se os dados que chegam estão certos (o "fiscal" do formulário) |
| **postgres** (postgres.js) | Conversa com o banco PostgreSQL do Supabase |
| **vitest** + **supertest** | Testes automáticos: fingem ser o app e conferem as respostas |
| **PGlite** | Um PostgreSQL de mentira, só para os testes (não mexe no Supabase) |

### As camadas (quem faz o quê)

A API é dividida em **camadas**, como uma cozinha profissional em que cada pessoa tem uma função:

```text
   Pedido chega
        │
        ▼
┌───────────────┐  O PORTEIRO: confere o token. Sem login? Responde 401 e para aqui.
│  middleware/  │
└───────┬───────┘
        ▼
┌───────────────┐  O ATENDENTE: entende o pedido e confere o formulário (zod).
│    routes/    │  Falta o nome? Responde 400 e para aqui.
└───────┬───────┘
        ▼
┌───────────────┐  O GERENTE: aplica as regras. "Esse paciente é da sua clínica?"
│   services/   │  Não é? Responde 403 ou 404 e para aqui.
└───────┬───────┘
        ▼
┌───────────────┐  O ESTOQUISTA: monta o comando SQL, embaralha os campos sensíveis
│ repositories/ │  e fala com o banco.
└───────┬───────┘
        ▼
    Supabase
```

**Por que separar?** Cada arquivo fica pequeno e com uma função só. Se a regra de "clínica" mudar,
mexe-se só em `services/`. Se trocar de banco, mexe-se só em `repositories/`.

### Os arquivos principais

| Arquivo | O que faz |
|---|---|
| `api/src/server.ts` | **Liga** a API: lê o `.env`, conecta no banco e começa a ouvir na porta 3333 |
| `api/src/app.ts` | **Monta** a API: junta segurança, leitura de JSON, rotas e tratamento de erros |
| `api/src/config/env.ts` | Lê o arquivo `.env` e confere se nada está faltando |
| `api/src/routes/index.ts` | **Todas as rotas** (o cardápio inteiro num arquivo só) |
| `api/src/routes/schemas.ts` | As regras de cada formulário (o que é obrigatório, tamanho máximo, formato) |
| `api/src/middleware/auth.ts` | O porteiro: lê o token e descobre quem é o usuário |
| `api/src/services/auth.ts` | Cadastro (cria o usuário **e** a clínica dele), login e logout |
| `api/src/services/password.ts` | Transforma a senha em hash e confere no login |
| `api/src/services/clinic.ts` | Regra da clínica ("é a sua clínica?") e a sigla da clínica |
| `api/src/services/records.ts` | Regras de pacientes e de sessões da agenda |
| `api/src/repositories/postgres.ts` | Todo o SQL |
| `api/src/security/fieldCipher.ts` | Embaralha e desembaralha os campos sensíveis |
| `api/src/security/loginRateLimiter.ts` | Bloqueia quem erra a senha 5 vezes |
| `api/src/db/migrations.ts` | Cria as tabelas no banco |
| `api/scripts/criar-conta.ts` | O comando `npm run criar-conta`, que cria uma conta (o app não tem tela de cadastro) |

---

## 5.5. Acompanhando um pedido de ponta a ponta: "cadastrar paciente"

Vamos seguir o que acontece quando a psicóloga toca em **Salvar** no formulário de novo paciente.

**1. O app manda o pedido** (`app/src/telas/PacientesScreen.tsx` → `app/src/banco/bancoDados.ts`):

```typescript
await criarNoBanco(rotas.pacientes(clinic!.id), campos);
// campos = { name, service, treatmentStart, complaint }, vindos do formulário (PacienteModal)
// vira: POST /api/v1/clinics/<id-da-clinica>/patients   com o token no cabeçalho
```

**2. O porteiro confere o login** (`middleware/auth.ts`): pega o token do cabeçalho, procura no banco e descobre
quem é o usuário. Se não achar, responde **401**.

**3. O atendente confere o formulário** (`routes/index.ts` + `routes/schemas.ts`):

```typescript
r.post('/clinics/:clinicId/patients', authed, async (req, res) => {
  const fields = parseBody(PatientSchema, req);   // confere nome, serviço, início, descrição
  res.status(201).json(await patients.create(actorOf(req), uuidParam(req, 'clinicId'), fields));
});
```

- `authed` = "só para quem está logado" (é o porteiro do passo 2).
- `parseBody(PatientSchema, req)` = confere o formulário. Só o nome é obrigatório. Se a data de início não existir
  (por exemplo, 31/02/2026), responde **400** com a mensagem "Início do tratamento inválido (DD/MM/AAAA)." e para aqui.

**4. O gerente aplica a regra** (`services/records.ts`):

```typescript
async create(actor, clinicId, fields) {
  assertClinicAccess(actor.user, clinicId);   // a clínica do pedido é a do usuário? Se não: 403
  return this.insert(actor, clinicId, fields); // cria o id, as datas e manda gravar
}
```

**5. O estoquista grava** (`repositories/postgres.ts`): embaralha a descrição (queixa principal), monta o
`INSERT` com `$1, $2...` e manda para o Supabase.

**6. A resposta volta:** status **201** com o paciente salvo (já com o `id` novo) em JSON.

**7. O app atualiza:** o `bancoDados.ts` chama `avisarMudanca()` e todas as listas abertas recarregam.

---

## 5.6. Login e token: como a API sabe quem é você

```text
 1. App:  POST /auth/login  { email, senha }
 2. API:  confere a senha (compara os hashes)
 3. API:  cria um token aleatório e guarda no banco só o hash dele (tabela sessions)
 4. API:  devolve o token para o app
 5. App:  guarda o token no SecureStore (o cofre do celular)
 6. App:  em todo pedido seguinte, manda  Authorization: Bearer <token>
 7. Sair: POST /auth/logout  → a API apaga a sessão; o token deixa de valer na hora
```

**Detalhes de segurança:**
- O token é um código aleatório de 32 bytes: impossível de adivinhar.
- O banco guarda só o **hash** do token. Mesmo quem visse a tabela `sessions` não conseguiria usar os tokens.
- O login vence depois de **30 dias** (ajustável em `SESSION_TTL_DAYS` no `.env`).
- Errou a senha 5 vezes em 15 minutos? A API responde **429** e manda esperar.

### E como se cria uma conta?

O app **não tem tela de cadastro**: a tela de Login só tem e-mail, senha e "Entrar".
As contas são criadas por um comando, rodado **dentro da pasta `api/`**:

```powershell
cd api
npm run criar-conta -- "Ana Souza" ana@clinica.com.br minhasenha "Clínica Psi"
#                       nome        e-mail             senha      nome da clínica (opcional)
```

O comando cria o **usuário e a clínica dele juntos** (sem o nome da clínica, ela se chama "Clínica Psi")
no banco que está no `.env`. Depois, é só entrar no app com esse e-mail e senha.

> Os `--` depois de `criar-conta` são obrigatórios: eles avisam ao `npm` que o resto é para o nosso comando.
> A senha precisa de pelo menos 6 caracteres, e o nome só pode ter letras.

Por dentro, o comando usa a mesma função da rota `POST /auth/register` (o `register` de `services/auth.ts`),
que também cria o usuário **e** a clínica de uma vez.

---

## 5.7. O que a nossa API faz (o cardápio)

### Sem login
| Pedido | Para quê |
|---|---|
| `GET /health` | "Você está ligada?" (teste rápido) |
| `GET /api/v1/ping` | Outro teste rápido (responde `pong`) |
| `POST /api/v1/auth/register` | Criar conta: usuário **e** clínica juntos (`name`, `email`, `password` e, opcional, `clinicName`) |
| `POST /api/v1/auth/login` | Entrar |

### Com login
| Assunto | Pedidos |
|---|---|
| **Conta** | Ver meus dados e a minha clínica (`GET /me`), sair (`POST /auth/logout`) |
| **Pacientes** | Listar (com busca por nome), criar, ver um, editar, apagar |
| **Agenda** | Listar por período (`?from=` e `?to=`), criar, ver uma sessão, editar, apagar |

Os campos de cada um:

| | Campos |
|---|---|
| **Paciente** | `name` (nome completo, obrigatório), `service` (serviço), `treatmentStart` (início do tratamento, DD/MM/AAAA), `complaint` (descrição / queixa principal, guardada embaralhada) |
| **Sessão da agenda** | `patientId` (o paciente), `date` (AAAA-MM-DD), `time` (HH:MM), `durationMin` (duração em minutos), `service`, `notes` (observações, guardadas embaralhadas) |

> A clínica não é criada nem editada por rota própria: ela nasce junto com a conta.

A lista completa, com cada endereço e cada campo, está em [`api/API.md`](../api/API.md).

### Listas vêm em páginas

Uma clínica pode ter milhares de pacientes. Para não mandar tudo de uma vez, a API devolve as listas em
**páginas** (até 200 itens por vez):

```json
{ "items": [ ...pacientes... ], "total": 523, "nextOffset": 200 }
```

`nextOffset: 200` quer dizer "tem mais; peça de novo a partir do item 200". Quando vem `null`, acabou.
O `buscarDados` do app já faz isso sozinho e junta todas as páginas.

---

## 5.8. Como acessar a API

### 1) Pelo navegador (só pedidos `GET` sem login)

Com a API ligada (`npm run dev` na pasta `api/`), abra:

- `http://127.0.0.1:3333/health`
- `http://127.0.0.1:3333/api/v1/ping`

### 2) Pelo PowerShell (qualquer pedido)

O PowerShell tem o comando `Invoke-RestMethod`, que faz pedidos HTTP. Exemplo completo: entrar, cadastrar um
paciente e listar os pacientes. (Antes, crie uma conta com `npm run criar-conta`, como explicado na seção 5.6.)

```powershell
# 1. Fazer login (troque pelo seu e-mail e senha)
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3333/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"ana@clinica.com.br","password":"minhasenha"}'

# 2. Guardar o token e o id da clínica que vieram na resposta
$token   = $login.token
$clinica = $login.clinic.id

# 3. Cadastrar um paciente (só o "name" é obrigatório)
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3333/api/v1/clinics/$clinica/patients" `
  -Headers @{ Authorization = "Bearer $token" } `
  -ContentType 'application/json; charset=utf-8' `
  -Body '{"name":"Maria da Silva","service":"Psicoterapia","treatmentStart":"10/03/2026"}'

# 4. Listar os pacientes, mandando o token
$pacientes = Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/clinics/$clinica/patients" `
  -Headers @{ Authorization = "Bearer $token" }
$pacientes.items | Select-Object name, service, treatmentStart
```

> O acento grave `` ` `` no fim da linha diz ao PowerShell que o comando continua na linha de baixo.

> **Dica:** também dá para criar a conta pelo PowerShell, com a rota de cadastro (cria o usuário e a clínica):
> ```powershell
> Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3333/api/v1/auth/register `
>   -ContentType 'application/json' `
>   -Body '{"name":"Ana Souza","email":"ana@clinica.com.br","password":"minhasenha","clinicName":"Clinica Psi"}'
> ```
> (No exemplo, "Clinica" vai sem acento de propósito: o PowerShell antigo do Windows pode estragar acentos
> enviados assim. Para nomes com acento, prefira o `npm run criar-conta`.)

### 3) Por programas visuais (opcional)

Programas como **Postman**, **Insomnia** ou a extensão **Thunder Client** do VS Code deixam montar os pedidos
clicando: escolhe-se o método, cola-se o endereço, o JSON e o cabeçalho `Authorization`.

### 4) Pelo app

É o que acontece o tempo todo. Todo o caminho passa por dois arquivos:

- `app/src/api/endereco.ts`: **onde** a API está (`10.0.2.2:3333` no emulador, `localhost:3333` no computador).
- `app/src/api/cliente.ts`: a função `apiRequest`, que monta o pedido, coloca o token, espera no máximo 8 segundos
  e transforma qualquer erro numa mensagem em português.

E as telas usam as funções simples do `app/src/banco/bancoDados.ts` (`buscarDados`, `criarNoBanco`...).

---

## 5.9. Testes automáticos

Na pasta `api/test/` há **31 testes**, em 4 arquivos (`api.test.ts`, `agenda.test.ts`, `validation.test.ts`
e `unit.test.ts`). Cada teste finge ser o app, faz pedidos e confere as respostas. Por exemplo:
- "login com a senha errada responde 401";
- "uma clínica não consegue ver o paciente de outra";
- "a descrição do paciente e as observações da sessão ficam embaralhadas no banco, mas voltam legíveis pela API".

```powershell
cd api
npm test
```

Os testes usam o **PGlite**, um PostgreSQL de mentira que roda na memória. Por isso são rápidos e **nunca mexem
nos dados reais do Supabase**.

---

## 5.10. Como adicionar uma rota nova (passo a passo)

Suponha que a clínica queira um pedido novo. O caminho é sempre o mesmo, de cima para baixo nas camadas:

1. **Formulário** (se o pedido recebe dados): descreva os campos em `api/src/routes/schemas.ts`
   (use o `PatientSchema` ou o `AppointmentSchema` como modelo).
2. **Regra**: escreva a função no service certo (`api/src/services/records.ts`, nas classes `PatientService` ou
   `AppointmentService`), conferindo a clínica do usuário com `assertClinicAccess` (de `services/clinic.ts`).
3. **Banco** (se precisar de algo novo): adicione no repositório (`api/src/repositories/postgres.ts`; para um campo
   novo de paciente ou sessão, basta uma linha a mais na lista `PATIENTS` ou `APPOINTMENTS`).
   Se a coluna ainda não existir no banco, crie uma **migração nova** no fim de `api/src/db/migrations.ts`
   (nunca altere uma migração que já rodou). Lembre que várias colunas antigas já existem (veja a seção
   4.11 do [documento do banco](04-BANCO-DE-DADOS.md)).
4. **Rota**: ligue tudo em `api/src/routes/index.ts`, com `authed` se precisar de login.
5. **Teste**: crie um teste em `api/test/` (por exemplo, em `api.test.ts` para pacientes ou `agenda.test.ts`
   para a agenda) e rode `npm test`.
6. **App**: adicione o endereço em `rotas` (`app/src/banco/bancoDados.ts`) e use nas telas.
7. **Documentação**: acrescente a rota em `api/API.md`.
