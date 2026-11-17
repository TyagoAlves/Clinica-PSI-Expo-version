# Documentação do Banco de Dados (SQLite Local)

Este documento detalha o funcionamento do banco de dados do projeto **Clínica PSI**. O sistema utiliza **exclusivamente o SQLite** como banco de dados relacional leve e embutido — sem necessidade de conexões com a internet, sem dependência de serviços externos em nuvem e com persistência automática no arquivo local `data/clinica.db`.

---

## 1. Arquitetura de Conexão (Por que 3 arquivos?)

Navegadores web e aplicativos React Native executam no cliente e realizam requisições através do protocolo **HTTP**. Por sua vez, o banco de dados SQLite armazena os dados diretamente em um arquivo binário no disco local do servidor.

A arquitetura organiza-se em 3 partes simples e desacopladas:

```text
[ Telas do App (App.js) ]
          │
          ▼  (chama funções async/await: buscarDados, criarRegistro, etc.)
[ Cliente HTTP (src/banco/bancoDados.js) ]
          │
          ▼  (requisições HTTP: GET, POST, PUT, DELETE em http://127.0.0.1:3333)
[ Servidor Node.js (src/banco/servidor.js) ]
          │
          ▼  (consultas SQL via driver 'better-sqlite3')
[ Arquivo de Banco de Dados SQLite (data/clinica.db) ]
```

---

## 2. Configuração do Ambiente (`.env`)

O arquivo `.env` na raiz do projeto guarda as configurações do servidor e o caminho do arquivo do banco:

```env
# Endereço e porta onde o servidor Node.js local escuta o aplicativo
HOST=127.0.0.1
PORT=3333
CORS_ORIGINS=http://localhost:8081

# Caminho do arquivo de banco de dados SQLite
DB_PATH=./data/clinica.db
```

> **Nota:** O arquivo `clinica.db` e a pasta `data/` estão listados no `.gitignore` para manter o versionamento do Git limpo e leve.

---

## 3. Estrutura das Tabelas no SQLite (SQL)

Ao iniciar o arquivo `src/banco/servidor.js`, a função `inicializarBanco()` garante que as duas tabelas do sistema existam automaticamente:

### 3.1. Tabela `pacientes`
```sql
CREATE TABLE IF NOT EXISTS pacientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  servico TEXT NOT NULL,
  inicio TEXT NOT NULL,
  descricao TEXT NOT NULL
);
```
- `id INTEGER PRIMARY KEY AUTOINCREMENT`: Identificador numérico gerado e incrementado automaticamente pelo SQLite (`1, 2, 3...`).
- `nome`, `servico`, `inicio`, `descricao`: Campos de texto obrigatórios (`NOT NULL`) da ficha clínica.

### 3.2. Tabela `secoes` (Agenda)
```sql
CREATE TABLE IF NOT EXISTS secoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paciente TEXT NOT NULL,
  servico TEXT NOT NULL,
  data TEXT NOT NULL,
  horario TEXT NOT NULL,
  duracao TEXT NOT NULL,
  observacoes TEXT DEFAULT ''
);
```
- Registra cada sessão agendada com paciente, serviço, data, horário, duração e observações opcionais.

---

## 4. O Servidor e as Consultas SQL (`src/banco/servidor.js`)

O servidor utiliza a biblioteca **`better-sqlite3`**, que é a solução mais rápida, estável e moderna do ecossistema Node.js para SQLite:

```javascript
const Database = require('better-sqlite3');
const db = new Database(path.resolve(__dirname, '../../', DB_PATH));
db.pragma('journal_mode = WAL');
```

- **Modo WAL (`Write-Ahead Logging`)**: Garante que leituras e escritas aconteçam de forma concorrente sem travar o banco de dados.

### As 4 Operações do CRUD em SQL

| Operação | Método HTTP e Rota | Comando SQL Executado no SQLite |
| :--- | :--- | :--- |
| **1. Listar (Read)** | `GET /pacientes` | `SELECT * FROM pacientes ORDER BY id ASC` |
| **2. Criar (Create)** | `POST /pacientes` | `INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES (?, ?, ?, ?) RETURNING *` |
| **3. Editar (Update)** | `PUT /pacientes/:id` | `UPDATE pacientes SET nome = ?, servico = ?, inicio = ?, descricao = ? WHERE id = ? RETURNING *` |
| **4. Apagar (Delete)** | `DELETE /pacientes/:id` | `DELETE FROM pacientes WHERE id = ?` |

*(As rotas `/secoes` executam os mesmos comandos na tabela `secoes`).*

#### Pontos Importantes para a Apresentação:
1. **Prepared Statements com `?` (Proteção contra SQL Injection)**:
   Os valores nunca são concatenados diretamente na consulta SQL. Usamos marcadores `?` e os valores são passados de forma higienizada pelo driver.
2. **Cláusula `RETURNING *`**:
   No `INSERT` e no `UPDATE`, o SQLite devolve na mesma hora a linha recém-salva com o seu `id`, permitindo que o aplicativo sincronize a interface imediatamente.
3. **Leitura de JSON com `for await`**:
   A função `lerCorpoJson` consome a stream de dados HTTP de forma limpa, moderna e assíncrona.

---

## 5. O Cliente de Comunicação (`src/banco/bancoDados.js`)

O arquivo `src/banco/bancoDados.js` é a ponte de comunicação do aplicativo:

- **`buscarDados(tabela)`**: Faz requisição `GET` para listar os registros.
- **`criarRegistro(tabela, item)`**: Faz requisição `POST` com os dados do novo item em JSON.
- **`atualizarRegistro(tabela, id, item)`**: Faz requisição `PUT` para editar um registro pelo ID.
- **`apagarRegistro(tabela, id)`**: Faz requisição `DELETE` para remover um registro pelo ID.

---

## 6. Como Executar o Projeto com o SQLite

Para rodar o projeto localmente:

1. **Terminal 1 — Inicia o servidor SQLite (Porta 3333):**
   ```powershell
   npm run servidor
   ```
   *(Você verá a mensagem: `Banco de Dados SQLite inicializado com sucesso em: ./data/clinica.db` seguido de `Servidor SQLite rodando com sucesso em http://127.0.0.1:3333`).*

2. **Terminal 2 — Inicia a interface do aplicativo Expo (Porta 8081):**
   ```powershell
   npm run web
   ```
