# Clínica Psi — Prontuário psicológico (SQLite)

App mobile (Expo / React Native) para psicólogos e clínicas: pacientes, prontuário, agenda e serviços.
O app fala com uma API Node.js, que guarda tudo num **banco SQLite local** (arquivo `api/clinica.db`).

> [!NOTE]
> 📚 **Veja os guias** — o passo a passo do projeto (todas as telas do app e a fase SQLite da API) está em
> [`docs/guias/`](docs/guias/): comece pelo [índice dos guias](docs/guias/README.md) ou pule direto para o
> [Guia 15 — o banco volta a ser SQLite](docs/guias/Fase%20SQLite/GUIA_15_BANCO_SQLITE_API.md) e o
> [Guia 16 — reestruturação e limpeza](docs/guias/Fase%20SQLite/GUIA_16_REESTRUTURACAO_LIMPEZA.md).

## Escopo atual: SQLite local

- Persistência **SQLite via better-sqlite3** — arquivo `clinica.db` dentro de `api/`, modo WAL, FKs ligadas.
- **Sem Supabase/PostgreSQL**: não existe `DATABASE_URL` e não há dependências `postgres`/`pglite`.
- Campos clínicos sensíveis continuam cifrados com AES-256-GCM (chave no `.env`; gere com `npm run gen:key`).
- Migrações versionadas em [`api/src/db/migrations.ts`](api/src/db/migrations.ts), aplicadas automaticamente ao subir a API.
- A camada de banco é a interface `Db` ([`api/src/db/types.ts`](api/src/db/types.ts)); o adaptador
  [`api/src/db/sqlite.ts`](api/src/db/sqlite.ts) traduz o dialeto postgres-compatível dos repositórios
  (`$1`, `ILIKE`, `::cast`, `RETURNING`) para SQLite, com transações e cache de statements.
- Testes e teste de carga rodam em **SQLite em memória** — o mesmo caminho de código da produção.

## Estrutura

| Pasta | O que é |
|---|---|
| [`app/`](app) | App mobile — Expo SDK 55, React Native 0.83, TypeScript (online: lê/grava via API) |
| [`api/`](api) | API REST — Node.js 20+, Express 5, TypeScript, **SQLite (better-sqlite3)**. Contrato em [`api/API.md`](api/API.md) |
| [`api/src/db/`](api/src/db) | Núcleo do banco: interface `Db` (`types.ts`), adaptador SQLite (`sqlite.ts`) e migrações versionadas (`migrations.ts`) |
| [`api/src/repositories/`](api/src/repositories) | Implementação SQLite dos repositórios (usuários, clínicas, pacientes, agenda, sincronização) |
| [`docs/`](docs) | Histórico do projeto: visão geral, ambiente, backlog e registro de mudanças (inclui a fase anterior com Supabase) |
| [`docs/guias/`](docs/guias) | Guias e mocks do Penpot por tela (`Tela 1` … `Tela 10`) + fase SQLite do backend ([`GUIA_15`](docs/guias/Fase%20SQLite/GUIA_15_BANCO_SQLITE_API.md) e [`GUIA_16`](docs/guias/Fase%20SQLite/GUIA_16_REESTRUTURACAO_LIMPEZA.md)) |
| [`docs/screenshots/`](docs/screenshots) | Capturas do app no emulador |
| [`tools/`](tools) | Scripts: emulador, screenshot, logcat e automação da interface (`ui.mjs`) |

## Subir o projeto (3 terminais)

```powershell
# 1. API com SQLite
#    Primeira vez: copie api\.env.example para api\.env e gere a chave de
#    criptografia com "npm run gen:key", colando o resultado em DATA_ENCRYPTION_KEY.
#    O banco api\clinica.db é criado (e migrado) automaticamente no primeiro start.
cd C:\Users\tyago\Clinica-PSI-Expo-version\api; npm install; npm run dev

# 2. Emulador Android
powershell -ExecutionPolicy Bypass -File C:\Users\tyago\Clinica-PSI-Expo-version\tools\emulador.ps1

# 3. App
cd C:\Users\tyago\Clinica-PSI-Expo-version\app; npm install; npx expo start --android
```

Se o app não carregar no emulador (IP da rede mudou), use `adb reverse tcp:8081 tcp:8081` e abra `exp://127.0.0.1:8081`.

## Scripts úteis da API (`cd api`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe a API em modo watch (aplica migrações pendentes) |
| `npm run db:inspect` | Mostra as tabelas do `clinica.db`, contagem de linhas e o `rev` da sincronização |
| `npm run db:reset` | Apaga o `clinica.db` (é recriado vazio no próximo start) |
| `npm run gen:key` | Gera a chave AES-256 para o `.env` |
| `npm run rotate-key` | Re-cifra os dados com uma chave nova (ver `api/scripts/rotate-key.ts`) |

## Validar

```powershell
cd C:\Users\tyago\Clinica-PSI-Expo-version\api; npm run typecheck; npm test; npm run load-test
cd C:\Users\tyago\Clinica-PSI-Expo-version\app; npm run typecheck
```

## Time

- **Tyago** — front-end/mobile e contato com o cliente
- **Yago** — back-end e arquitetura
- **Kelven** — back-end, testes e integração
