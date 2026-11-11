# Guia 15 — O banco volta a ser SQLite (na API) — Node.js + Express

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Base:** [Guia 14 (Configurações)](../Tela%2010/Guia%2014%20%28Configura%C3%A7%C3%B5es%29.md) (última tela do app) e [`docs/MUDANCAS.md`](../../MUDANCAS.md) §12 (a ida ao Supabase — este guia é o caminho de volta)
**Objetivo desta fase:** trazer a persistência da API de volta ao **SQLite local** (arquivo `api/clinica.db`, via `better-sqlite3`), mantendo intactos a criptografia AES-256-GCM dos campos clínicos, o cursor de sincronização (`rev`), o contrato REST (`api/API.md`) e **sem tocar em nenhuma tela do app**.
**Quem usa este guia:** Yago e Kelven (backend). O Tyago só precisa saber que **nada muda no app** — ele continua falando REST com a mesma API.

> 📌 Este guia documenta trabalho **já aplicado** ao projeto (11/11/2026). Ele serve para entender a arquitetura, reproduzir a validação e fazer as próximas migrações do banco seguindo o mesmo padrão.

---

## 0. Regras da fase

- **SQLite é o banco da API, ponto.** Não existe `DATABASE_URL`, não existe dependência `postgres` nem `@electric-sql/pglite` no `package.json`.
- **O app não muda**: continua online (lê/grava direto na API via REST). A troca de banco é 100% server-side.
- **Contrato REST é sagrado**: rotas, formatos de data (DD/MM/AAAA, AAAA-MM-DD, HH:MM, ISO-8601) e respostas seguem exatamente o `api/API.md`.
- **Criptografia continua igual**: campos `*_enc` são cifrados com AES-256-GCM antes de tocar o banco (chave no `.env`, rotação com `npm run rotate-key`).
- **Migrações são versionadas e só avançam**: nunca edite uma migração aplicada — crie outra com `version + 1` (ver §3).
- **Testes rodam no mesmo banco de produção**: SQLite em memória, mesmo adaptador, mesmas migrações. Nada de "banco de mentira" nos testes.

---

## 1. O que estava quebrado (e por quê)

A migração anterior (Supabase → SQLite) tinha ficado **pela metade**, com arquivos duplicados e um adaptador incompleto. Erros reais, na ordem em que apareciam:

| # | Erro | Causa |
|---|---|---|
| 1 | `SqliteError: table users has no column named crp` (HTTP 500 no primeiro cadastro) | O `schema.ts` antigo criava um schema "ingênuo" que **não batia** com o que os repositórios esperavam (o schema das migrações PostgreSQL: colunas `crp`, `document_enc`, `rev`, tabelas `evolutions`, `appointments`, `meta`…). A tabela `sessions` tinha até uma **colisão de conceitos**: era de agendamentos, mas o código gravava nela os tokens de login |
| 2 | `db.tx is not a function` (explodiria no primeiro sync) | O adaptador antigo **não implementava `tx` nem `exec`** da interface `Db` — só `query` |
| 3 | `initSchema(db)` com argumento que a função não recebia | Assinatura quebrada; o `tsx` não faz typecheck, então o erro passava despercebido no `npm run dev` |
| 4 | Três conexões SQLite concorrentes e nenhuma usada de verdade | `api/src/db.ts`, `api/src/db.t` (extensão errada — nem compilava) e `api/src/db/db.ts`, todas com `node:sqlite`, enquanto o servidor usava outra (`better-sqlite3`) |
| 5 | Contagem errada em `DELETE … RETURNING 1` | O adaptador simulava `RETURNING` com `SELECT * FROM t ORDER BY rowid DESC LIMIT 1` — frágil e errado para DELETE |
| 6 | `SQLite3 can only bind numbers, strings, bigints, buffers, and null` | Os repositórios passavam `true/false` (boolean) e `Date` — o postgres.js aceita, o better-sqlite3 não |
| 7 | `Transaction function cannot return a promise` | O better-sqlite3 **proíbe** funções async dentro de `db.transaction()` — e os repositórios são async |

---

## 2. A arquitetura nova da camada de banco

Tudo vive em `api/src/db/` + `api/src/repositories/`:

```
api/src/
├── db/
│   ├── types.ts        ← interface Db (o contrato de TODO mundo)
│   ├── sqlite.ts       ← adaptador better-sqlite3 que implementa Db
│   └── migrations.ts   ← schema versionado (tabela schema_migrations)
└── repositories/
    └── sqlite.ts       ← implementação SQLite dos repositórios (renomeada de postgres.ts)
```

| Arquivo | Papel | Regra |
|---|---|---|
| `db/types.ts` | Interface `Db`: `query` / `exec` / `tx` / `close` | Services, rotas e repositórios **só conhecem ela**. Trocar de banco = escrever outro adaptador, zero mudança fora de `db/` |
| `db/sqlite.ts` | Abre o banco, traduz o dialeto e executa | Único arquivo que fala com o better-sqlite3 |
| `db/migrations.ts` | Schema + função `migrate(db)` | Aplicada automaticamente no boot da API |
| `repositories/sqlite.ts` | Usuários, clínicas, pacientes, evoluções, agenda, sync, auditoria | SQL num dialeto "postgres-compatível" (ver §4.1) — mesmo código serviria para PostgreSQL |

### 2.1 A interface `Db` (`api/src/db/types.ts`)

```ts
export type Row = Record<string, unknown>;

export interface Db {
  /** Consulta parametrizada ($1, $2… no dialeto postgres-compatível). Devolve as linhas. */
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Executa SQL com vários comandos, sem parâmetros (migrações/reset). */
  exec(text: string): Promise<void>;
  /** Executa `fn` numa transação; desfaz tudo se lançar erro. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
```

O `server.ts` liga tudo (a única sequência de boot):

```ts
const env = loadEnv();
const db = createSqliteDb(env.DATABASE_PATH); // 'clinica.db' por padrão (api/.env)
await migrate(db);                            // aplica migrações pendentes
const repos = createSqliteRepositories(db, createFieldCipher(...));
```

---

## 3. O schema e as migrações (`api/src/db/migrations.ts`)

### 3.1 Como funciona

- Existe uma tabela `schema_migrations(version, name, applied_at)`.
- No boot, `migrate(db)` lê a última versão aplicada e roda **em transação** cada migração pendente (DDL + registro da versão).
- Para mudar o schema: adicione `{ version: N + 1, name: '...', sql: '...' }` no array `MIGRATIONS`. **Nunca edite uma migração já aplicada.**

### 3.2 Decisões do schema (versão 1 — `schema_inicial_sqlite`)

Espelha o schema da fase PostgreSQL (commit `a8cad3b`) com as adaptações para SQLite:

| Tema | Decisão | Por quê |
|---|---|---|
| Datas | `TEXT` ISO-8601 (`"2026-11-15"`, `"2026-11-11T01:23:34.041Z"`) | Texto ISO **compara e ordena igual a data real** (`ORDER BY session_date DESC`, filtros `date >= ?` da agenda funcionam). A API continua expondo DD/MM/AAAA etc. como sempre |
| Campos sensíveis | Colunas `*_enc` (`document_enc`, `complaint_enc`, `notes_enc`…) | Cifradas com AES-256-GCM antes de gravar — o banco "vazado" não vaza dado clínico legível |
| Sessions | `token_hash` PRIMARY KEY (SHA-256 do token) | Tokens de login, não agendamentos. Vazamento do banco não vaza sessões ativas |
| `rev` em cada entidade | `INTEGER NOT NULL` + tabela `meta(key, value)` | Cursor da sincronização (`/sync`). Cada `save()` incrementa o contador global dentro de transação |
| FK circular | `clinics.owner_user_id → users` e `users.clinic_id → clinics` | O SQLite valida FK **só ao gravar dados** (DML), não na criação — as duas tabelas podem referenciar-se mutuamente no mesmo script |
| `audit_log.id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Equivalente ao `BIGSERIAL` do PostgreSQL |

Tabelas criadas: `clinics`, `users`, `sessions`, `patients`, `services`, `evolutions`, `appointments`, `audit_log`, `meta`, `schema_migrations` (+ índices de clínica/rev, nome e datas).

> ⚠️ **O banco antigo foi descartado.** O `clinica.db` que existia tinha o schema errado e estava **vazio** (0 linhas em todas as tabelas, conferido com `npm run db:inspect` antes de apagar). Nenhum dado foi perdido.

---

## 4. O adaptador (`api/src/db/sqlite.ts`) — as 5 decisões

### 4.1 Dialeto postgres-compatível → SQLite

Os repositórios escrevem SQL com `$1`, `ILIKE`, `::timestamptz`, `RETURNING`, `NOW()` (porque nasceram na fase PostgreSQL). Em vez de reescrever ~500 linhas de repositório, o adaptador **traduz na entrada**:

```ts
function translate(sql: string): string {
  return sql
    .replace(/\bILIKE\s+(\$\d+)/gi, "LIKE $1 ESCAPE '\\'") // repositório escapa \% e \_
    .replace(/\$(\d+)/g, '?')                              // $n → ?
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/::\w+/g, '');                                // casts não existem no SQLite
}
```

Bônus: o mesmo `repositories/sqlite.ts` rodaria em PostgreSQL trocando só o adaptador.

### 4.2 `RETURNING` nativo (adeus, simulação)

O better-sqlite3 roda sobre SQLite ≥ 3.35, onde `INSERT/UPDATE/DELETE … RETURNING` **já existe**. A propriedade `stmt.reader` diz se o statement devolve linhas:

```ts
const stmt = prepare(translate(sql));
if (stmt.reader) return stmt.all(...) as T[];  // SELECT/PRAGMA ou escrita com RETURNING
stmt.run(...); return [];                     // escrita comum
```

Isso resolve de uma vez: `UPDATE meta … RETURNING value` (contador do sync) e `DELETE … RETURNING 1` (contagem de sessões revogadas/expiradas) — ambos agora executam o SQL real, sem gambiarra com `rowid`.

### 4.3 Fila de execução (mutex) para transações async

O better-sqlite3 é **síncrono** e proíbe funções async em `db.transaction()`. Mas a interface `Db` é async (os repositórios usam `await` entre queries). Solução:

- Toda operação (`query`/`exec`/`tx`) entra numa **fila de promises** — nada executa em paralelo na mesma conexão;
- `tx` faz `BEGIN IMMEDIATE` → roda a função (await incluído) → `COMMIT`, ou `ROLLBACK` se ela lançar erro;
- Como a fila só avança quando a transação termina, **nenhuma query de outra requisição cai no meio** de um `BEGIN…COMMIT`.

### 4.4 Conversão de parâmetros (`normParam`)

```ts
function normParam(p: unknown): unknown {
  if (typeof p === 'boolean') return p ? 1 : 0;   // true/false → 1/0
  if (p instanceof Date) return p.toISOString();  // Date → texto ISO
  return p;
}
```

É a tradução dos **tipos que o postgres.js aceita e o better-sqlite3 não** (erro nº 6 da §1).

### 4.5 Cache de prepared statements

`Map<string, Statement>` — no load-test são centenas de queries/s; preparar de novo a cada chamada é desperdício.

Outras configurações do banco: `journal_mode = WAL` (escritas não bloqueiam leituras), `foreign_keys = ON`, `busy_timeout = 5000` ms.

---

## 5. Testes: o mesmo banco de produção (`api/test/db.ts`)

Antes os testes rodavam em **PGlite** (PostgreSQL em WASM) — ou seja, testavam um caminho que não era o de produção. Agora:

```ts
export async function createTestDb(): Promise<Db> {
  const db = createSqliteDb(':memory:'); // SQLite em memória
  await migrate(db);                      // mesmas migrações do servidor
  return db;
}
```

- `test/helpers.ts` → `makeApp()` usa `createTestDb()` + `createSqliteRepositories()`;
- `resetDb(db)` zera as tabelas entre testes (ordem respeita as FKs; reseta `sqlite_sequence` do `audit_log` e o `rev` do `meta`);
- `scripts/load-test.ts` idem — teste de carga em memória, sem tocar no `clinica.db`.

**Resultado:** 50/50 testes passando (mesmos testes da fase PostgreSQL — nenhum teste precisou mudar de comportamento, só a infraestrutura de banco).

---

## 6. Como rodar e validar (passo a passo)

```powershell
cd C:\Users\tyago\Clinica-PSI-Expo-version\api

npm install          # primeira vez
npm run dev          # sobe e cria/migra api/clinica.db automaticamente
```

Checklist de validação (tudo verde em 11/11/2026):

| Passo | Comando | Resultado esperado |
|---|---|---|
| Tipos | `npm run typecheck` | 0 erros |
| Testes | `npm test` | 6 arquivos, **50/50** |
| Banco | `npm run db:inspect` | Lista tabelas/contagens + `rev de sincronização` |
| Carga | `npm run load-test` | 0 erros; "pacientes gravados" = "syncs respondidos com 200" |
| Smoke HTTP | registro → clínica → paciente → evolução → agenda → sync → busca → login | Todos 201/200 |

O smoke test da validação (rodado com `Invoke-RestMethod` contra `http://127.0.0.1:3333`):

1. `POST /api/v1/auth/register` → **201** (usuário + token)
2. `POST /api/v1/clinics` → **201** (CNPJ normalizado p/ dígitos)
3. `GET /api/v1/clinics/:id/services` → catálogo padrão (Acompanhamento, Avaliação, Psicoterapia)
4. `POST /api/v1/clinics/:id/patients` → **201** (`complaint` cifrado em `complaint_enc`, `rev` atribuído)
5. `POST /api/v1/patients/:id/evolutions` → **201** (conteúdo do prontuário cifrado)
6. `POST /api/v1/clinics/:id/appointments` → **201** (data/hora ISO no banco, formatos antigos na resposta)
7. `POST /api/v1/sync` com `lastPulledRev: 0` → **200** (paciente + evolução + agenda, `rev` atual)
8. `GET …/patients?search=maria` → **200** (`ILIKE` traduzido para `LIKE … ESCAPE`)
9. `POST /api/v1/auth/login` → **200** (token novo)

Load test (5s, 10 conexões): **940 requisições, 0 erros, 470 syncs = 470 pacientes gravados** (integridade confirmada).

---

## 7. Checklist final desta fase

- [x] API sobe com `clinica.db` local (WAL, FKs ligadas, busy_timeout)
- [x] Migrações versionadas aplicadas no boot (`schema_migrations`)
- [x] `RETURNING` nativo — sem simulação
- [x] Transações async seguras (fila + `BEGIN IMMEDIATE`)
- [x] Booleans/`Date` convertidos antes de ligar parâmetros
- [x] Criptografia e cursor de sync (`rev`) idênticos à fase anterior
- [x] Contrato REST inalterado — app não precisou mudar
- [x] Testes e load-test no mesmo SQLite de produção (em memória)
- [x] 50/50 testes, smoke HTTP completo, teste de carga sem erros

**Próximos passos sugeridos:** backup periódico do `clinica.db` (copiar o arquivo com a API parada, ou usar `VACUUM INTO`); migração `version: 2` quando surgir novo campo; validar com o cliente a política de retenção da `audit_log` (LGPD).

---

| ◀ Anterior | Todos os guias | Próximo ▶ |
| :--- | :---: | ---: |
| [Guia 14 — Configurações](../Tela%2010/Guia%2014%20%28Configura%C3%A7%C3%B5es%29.md) | [Índice](../README.md) | [Guia 16 — Reestruturação e limpeza](GUIA_16_REESTRUTURACAO_LIMPEZA.md) |
