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
2. **Regras num lugar só.** "Uma clínica não pode ver a outra", "o telefone precisa ter 10 ou 11 números",
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
| `PATCH` | **Alterar** uma parte | Mudar só o telefone |
| `DELETE` | **Apagar** | Excluir uma sessão |

### 3) O corpo (os dados), em JSON

Quando o app cria ou altera algo, ele manda os dados em **JSON**, um formato de texto simples:

```json
{
  "name": "Maria da Silva",
  "phone": "61900000000",
  "service": "Psicoterapia"
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
| **400** | Pedido com erro | Faltou o nome, telefone inválido... |
| **401** | Não está logado | Sem token, ou o login venceu |
| **403** | Proibido | Tentou mexer em dados de outra clínica |
| **404** | Não encontrado | O paciente não existe |
| **409** | Conflito | E-mail já cadastrado, serviço com nome repetido |
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
| `api/src/services/auth.ts` | Cadastro, login, logout e troca de senha |
| `api/src/services/password.ts` | Transforma a senha em hash e confere no login |
| `api/src/services/clinic.ts` | Regras da clínica ("é a sua clínica?") |
| `api/src/services/records.ts` | Regras de pacientes, serviços, evoluções e sessões |
| `api/src/repositories/postgres.ts` | Todo o SQL |
| `api/src/security/fieldCipher.ts` | Embaralha e desembaralha os campos sensíveis |
| `api/src/security/loginRateLimiter.ts` | Bloqueia quem erra a senha 5 vezes |
| `api/src/db/migrations.ts` | Cria as tabelas no banco |

---

## 5.5. Acompanhando um pedido de ponta a ponta: "cadastrar paciente"

Vamos seguir o que acontece quando a psicóloga toca em **Salvar** no formulário de novo paciente.

**1. O app manda o pedido** (`app/src/telas/PacientesScreen.tsx` → `app/src/banco/bancoDados.ts`):

```typescript
await criarNoBanco(rotas.pacientes(clinic.id), dadosDoFormulario);
// vira: POST /api/v1/clinics/<id-da-clinica>/patients   com o token no cabeçalho
```

**2. O porteiro confere o login** (`middleware/auth.ts`): pega o token do cabeçalho, procura no banco e descobre
quem é o usuário. Se não achar, responde **401**.

**3. O atendente confere o formulário** (`routes/index.ts` + `routes/schemas.ts`):

```typescript
r.post('/clinics/:clinicId/patients', authed, async (req, res) => {
  const fields = parseBody(CreatePatientSchema, req);   // confere nome, telefone, serviço...
  res.status(201).json(await patients.create(actorOf(req), uuidParam(req, 'clinicId'), fields));
});
```

- `authed` = "só para quem está logado" (é o porteiro do passo 2).
- `parseBody(CreatePatientSchema, req)` = confere o formulário. Se o telefone estiver errado, responde **400**
  com a mensagem "Informe um telefone válido" (por exemplo), e para aqui.

**4. O gerente aplica a regra** (`services/records.ts`):

```typescript
async create(actor, clinicId, fields) {
  assertClinicAccess(actor.user, clinicId);   // a clínica do pedido é a do usuário? Se não: 403
  return this.insert(actor, clinicId, fields); // cria o id, as datas e manda gravar
}
```

**5. O estoquista grava** (`repositories/postgres.ts`): embaralha a queixa, o endereço e o CPF, monta o
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
- Trocou a senha? Todos os **outros** aparelhos são desconectados.

---

## 5.7. O que a nossa API faz (o cardápio)

### Sem login
| Pedido | Para quê |
|---|---|
| `GET /health` | "Você está ligada?" (teste rápido) |
| `POST /api/v1/auth/register` | Criar conta |
| `POST /api/v1/auth/login` | Entrar |

### Com login
| Assunto | Pedidos |
|---|---|
| **Conta** | Ver meus dados (`GET /me`), editar (`PATCH /me`), trocar senha, sair |
| **Clínica** | Criar (cadastro passo 2), ver, editar, listar os profissionais |
| **Pacientes** | Listar, criar, ver um, editar, apagar |
| **Evoluções (prontuário)** | Listar do paciente, listar as últimas da clínica, criar, ver, editar, apagar |
| **Serviços** | Listar, criar, editar (inclusive ativar/desativar), apagar |
| **Agenda** | Listar por período ou por paciente, criar, ver, editar, apagar |

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

O PowerShell tem o comando `Invoke-RestMethod`, que faz pedidos HTTP. Exemplo completo: entrar e listar os pacientes.

```powershell
# 1. Fazer login (troque pelo seu e-mail e senha)
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3333/api/v1/auth/login `
  -ContentType 'application/json' `
  -Body '{"email":"ana@clinica.com.br","password":"minhasenha"}'

# 2. Guardar o token e o id da clínica que vieram na resposta
$token   = $login.token
$clinica = $login.clinic.id

# 3. Listar os pacientes, mandando o token
$pacientes = Invoke-RestMethod -Uri "http://127.0.0.1:3333/api/v1/clinics/$clinica/patients" `
  -Headers @{ Authorization = "Bearer $token" }
$pacientes.items | Select-Object name, phone, status
```

> O acento grave `` ` `` no fim da linha diz ao PowerShell que o comando continua na linha de baixo.

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

Na pasta `api/test/` há **40 testes**. Cada teste finge ser o app, faz pedidos e confere as respostas. Por exemplo:
- "login com a senha errada responde 401";
- "uma clínica não consegue ver o paciente de outra";
- "a queixa fica embaralhada no banco, mas volta legível pela API".

```powershell
cd api
npm test
```

Os testes usam o **PGlite**, um PostgreSQL de mentira que roda na memória. Por isso são rápidos e **nunca mexem
nos dados reais do Supabase**.

---

## 5.10. Como adicionar uma rota nova (passo a passo)

Suponha que a clínica queira um pedido novo. O caminho é sempre o mesmo, de cima para baixo nas camadas:

1. **Formulário** (se o pedido recebe dados): descreva os campos em `api/src/routes/schemas.ts`.
2. **Regra**: escreva a função no service certo (`api/src/services/...`), conferindo a clínica do usuário.
3. **Banco** (se precisar de algo novo): adicione no repositório (`api/src/repositories/postgres.ts`)
   e, se for uma coluna nova, crie uma **migração nova** no fim de `api/src/db/migrations.ts`
   (nunca altere uma migração que já rodou).
4. **Rota**: ligue tudo em `api/src/routes/index.ts`, com `authed` se precisar de login.
5. **Teste**: crie um teste em `api/test/` e rode `npm test`.
6. **App**: adicione o endereço em `rotas` (`app/src/banco/bancoDados.ts`) e use nas telas.
7. **Documentação**: acrescente a rota em `api/API.md`.
