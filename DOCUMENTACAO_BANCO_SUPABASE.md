# Documentação do Banco de Dados (Supabase PostgreSQL)

Este documento detalha o funcionamento do banco de dados do projeto **Clínica PSI**. O sistema utiliza **exclusivamente o Supabase (PostgreSQL na nuvem)** como único banco de dados — sem SQLite, sem `localStorage` e sem dados fixos no front-end.

---

## 1. Arquitetura de Conexão (Por que 3 arquivos?)

Navegadores web e aplicativos React Native falam o protocolo **HTTP**, enquanto o banco de dados PostgreSQL do Supabase fala o protocolo **TCP binário (porta 5432)** e exige uma senha secreta (`DATABASE_URL`).

Para manter a senha segura no arquivo `.env` e permitir a comunicação, o banco é dividido em 3 partes simples:

```text
[ Telas do App (App.js) ]
          │
          ▼  (chama funções async/await)
[ Cliente HTTP (src/banco/bancoDados.js) ]
          │
          ▼  (requisições HTTP: GET, POST, PUT, DELETE em http://127.0.0.1:3333)
[ Servidor Node.js (src/banco/servidor.js) ]
          │
          ▼  (comandos SQL via driver 'pg' usando DATABASE_URL do .env)
[ Banco de Dados Supabase (PostgreSQL na Nuvem) ]
```

---

## 2. Configuração do Ambiente (`.env`)

O arquivo `.env` na raiz do projeto guarda as configurações do servidor e a URL de conexão direta com o pooler do Supabase:

```env
# Endereço e porta onde o servidor Node.js local escuta o aplicativo
HOST=127.0.0.1
PORT=3333
CORS_ORIGINS=http://localhost:8081

# Conexão exclusiva com o Banco PostgreSQL do Supabase
DATABASE_URL=postgresql://postgres.<PROJETO>:<SENHA>@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

> **Segurança:** O arquivo `.env` está listado no `.gitignore` para que a senha do banco nunca fique exposta publicamente no GitHub.

---

## 3. Estrutura das Tabelas no Supabase (SQL)

Ao iniciar o arquivo `src/banco/servidor.js`, a função `inicializarBanco()` garante que as duas tabelas do sistema existam no Supabase:

### 3.1. Tabela `pacientes`
```sql
CREATE TABLE IF NOT EXISTS pacientes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  servico TEXT NOT NULL,
  inicio TEXT NOT NULL,
  descricao TEXT NOT NULL
);
```
- `id SERIAL PRIMARY KEY`: Identificador único gerado e incrementado automaticamente pelo próprio PostgreSQL (`1, 2, 3...`).
- `nome`, `servico`, `inicio`, `descricao`: Campos de texto obrigatórios (`NOT NULL`) da ficha do paciente.

### 3.2. Tabela `secoes` (Agenda)
```sql
CREATE TABLE IF NOT EXISTS secoes (
  id SERIAL PRIMARY KEY,
  paciente TEXT NOT NULL,
  servico TEXT NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  duracao TEXT NOT NULL,
  observacoes TEXT DEFAULT ''
);
```
- Guarda cada sessão agendada na clínica, com nome do paciente, serviço, data, horário, duração e observações.

---

## 4. O Servidor e as Consultas SQL (`src/banco/servidor.js`)

O servidor utiliza a biblioteca oficial **`pg` (`node-postgres`)** para manter um *Pool* de conexões criptografadas (`SSL`) com o Supabase:

```javascript
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

### As 4 Operações do CRUD em SQL

| Operação | Método HTTP e Rota | Comando SQL Executado no Supabase |
| :--- | :--- | :--- |
| **1. Listar (Read)** | `GET /pacientes` | `SELECT * FROM pacientes ORDER BY id ASC` |
| **2. Criar (Create)** | `POST /pacientes` | `INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES ($1, $2, $3, $4) RETURNING *` |
| **3. Editar (Update)** | `PUT /pacientes/:id` | `UPDATE pacientes SET nome = $1, servico = $2, inicio = $3, descricao = $4 WHERE id = $5 RETURNING *` |
| **4. Apagar (Delete)** | `DELETE /pacientes/:id` | `DELETE FROM pacientes WHERE id = $1` |

*(As rotas `/secoes` executam exatamente os mesmos 4 comandos SQL na tabela `secoes`).*

#### Destaques importantes para explicar em aula:
1. **Proteção contra SQL Injection (`$1, $2, $3...`)**:
   Nunca concatenamos variáveis direto na string SQL. Usamos parâmetros numerados (`$1, $2`) e passamos os valores em um vetor separado `[nome, servico, ...]`. O PostgreSQL trata os dados com segurança.
2. **Cláusula `RETURNING *`**:
   No `INSERT` e no `UPDATE`, o comando `RETURNING *` faz o Supabase devolver imediatamente a linha completa já salva (incluindo o `id` gerado pelo banco), permitindo atualizar a tela do aplicativo na mesma hora.

---

## 5. O Cliente de Comunicação (`src/banco/bancoDados.js`)

O arquivo `src/banco/bancoDados.js` contém apenas as 4 funções que fazem requisições `fetch` ao servidor conectado ao Supabase:

- **`buscarDadosSupabase(tabela)`**: Faz um `GET` em `http://127.0.0.1:3333/pacientes` (ou `secoes`) e retorna a lista vinda do Supabase.
- **`criarNoSupabase(tabela, item)`**: Envia um `POST` com os dados preenchidos no formulário e devolve o registro criado no Supabase.
- **`atualizarNoSupabase(tabela, id, item)`**: Envia um `PUT` para `/${tabela}/${id}` com os novos dados editados.
- **`apagarNoSupabase(tabela, id)`**: Envia um `DELETE` para `/${tabela}/${id}` removendo o registro do Supabase.

---

## 6. Integração com o Estado do React (`App.js`)

No `App.js`, os estados começam vazios (`useState([])`) e são preenchidos exclusivamente pelo Supabase:

```javascript
// Estados alimentados exclusivamente pelo banco Supabase
const [pacientes, setPacientes] = useState([]);
const [secoes, setSecoes] = useState([]);

// Carrega os pacientes e seções direto do Supabase ao iniciar o app
useEffect(() => {
  async function carregarDoSupabase() {
    const listaPacientes = await buscarDadosSupabase('pacientes');
    setPacientes(listaPacientes);

    const listaSecoes = await buscarDadosSupabase('secoes');
    setSecoes(listaSecoes);
  }
  carregarDoSupabase();
}, []);
```

- Quando o usuário **cadastra**, `adicionarPaciente` aguarda o `INSERT` no Supabase (`await criarNoSupabase(...)`) e adiciona o registro retornado na lista.
- Quando o usuário **edita**, `salvarEdicaoPaciente` aguarda o `UPDATE` no Supabase (`await atualizarNoSupabase(...)`) e atualiza o item na lista com `.map()`.
- Quando o usuário **apaga**, `apagarPaciente` aguarda o `DELETE` no Supabase (`await apagarNoSupabase(...)`) e remove o item da tela com `.filter()`.

---

## 7. Como Executar o Projeto com o Supabase

Como o **Supabase** é o único banco do sistema, mantenha dois terminais abertos na raiz do projeto:

1. **Terminal 1 — Inicia o servidor conectado ao Supabase (Porta 3333):**
   ```powershell
   npm run servidor
   ```
   *(Você verá a mensagem: `Banco Supabase inicializado e sincronizado com sucesso!` seguida de `Servidor conectado ao Supabase rodando em http://127.0.0.1:3333`).*

2. **Terminal 2 — Inicia a interface do aplicativo Expo (Porta 8081):**
   ```powershell
   npm run web
   ```
