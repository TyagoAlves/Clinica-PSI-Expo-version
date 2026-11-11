# Guia 16 — Reestruturação e limpeza do projeto (o caso dos "dois Expo")

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Base:** [`GUIA_15_BANCO_SQLITE_API.md`](GUIA_15_BANCO_SQLITE_API.md) (a volta ao SQLite — este guia é a "faxina" que veio junto)
**Objetivo desta fase:** tirar do projeto tudo que a migração pela metada deixou para trás — dependências duplicadas, arquivos órfãos, configurações quebradas e textos desatualizados — e deixar claro **onde cada coisa mora**.
**Quem usa este guia:** o time todo. É curto e evita que o episódio se repita.

> 📌 Este guia documenta trabalho **já aplicado** ao projeto (11/11/2026). Nada foi commitado — tudo está no working tree da branch `claude`, aguardando decisão de branch/commit.

---

## 0. Regras da fase

- **Um `node_modules` por pasta com papel definido**: `app/` é o app Expo (precisa de `expo`); `api/` é backend Node (não precisa). Comando do Expo só roda dentro de `app/`.
- **Nada de arquivo "de teste" solto**: script de debug vira script nomeado (`npm run …`) ou é apagado.
- **Configuração herda do propósito**: `tsconfig` da API é de API; se um dia o app precisar de tsconfig próprio, ele estende `expo/tsconfig.base` — **nunca o contrário**.
- **Documentação segue o escopo real**: README e textos do app falam do banco que existe (SQLite), não do que existia.

---

## 1. O que aconteceu (o incidente)

Na hora de testar, **comandos do Expo foram executados dentro de `api/`** (a pasta do backend). Consequências em cadeia:

| Sintoma | Causa | Efeito |
|---|---|---|
| `api/node_modules` gigante (com `@expo/cli`, `metro`, `react-native`, babel…) | `expo@58` instalado em `api/package.json` | Centenas de MB inúteis — era o "segundo Expo" |
| `api/tsconfig.json` com `"extends": "expo/tsconfig.base"` | Veio junto com o pacote | Config de **React Native** aplicada numa API Node (JSX, tipos de RN…) |
| `typescript ~6.0.3` na API (era `~5.7.0`) | Upgrade arrastado pelo install | Mudança de major sem motivo |
| `react-dom` e `@types/react` na API | Idem | Dependências de UI num processo de servidor |
| `api/.expo/`, `package-lock.json` solto na raiz, `api/env` (arquivo sem ponto, com placeholder de chave) | Execuções do Expo na pasta errada | Lixo em três lugares |
| `api/check.ts` (debug de 3 linhas) | Teste manual do banco | Script solto no lugar errado |
| `db:reset` apagava a pasta `data/` | Legado do SQLite original da API | Não apagava o banco de verdade (`clinica.db`) |

> 💡 **Como evitar de novo:** antes de rodar `npx expo …` ou `npm install <pacote>`, confira o prompt do terminal — ele mostra a pasta. O `expo` (e só ele) mora em `app/`.

---

## 2. `api/package.json` — antes × depois

| | Antes | Depois |
|---|---|---|
| `dependencies` | `better-sqlite3`, `cors`, **`expo`**, `express`, **`postgres`**, **`react-dom`**, `zod` | `better-sqlite3`, `cors`, `express`, `zod` |
| `devDependencies` | …, **`@electric-sql/pglite`**, **`@types/react`**, `typescript ~6.0.3` | …, `typescript ~5.7.0` (restaurado) |
| Scripts | `db:reset` apagava `data/` | `db:reset` apaga `clinica.db`(+`-wal`/`-shm`); **novo `db:inspect`** |

Saíram: `expo` (UI na API), `postgres` (não há mais PostgreSQL), `@electric-sql/pglite` (testes agora usam o SQLite real em memória), `react-dom`/`@types/react` (idem expo).
Depois do `npm install`, o `api/node_modules` ficou **sem expo, sem react-dom** — só backend.

## 3. `api/tsconfig.json` restaurado

Removido o `"extends": "expo/tsconfig.base"` e devolvido o conteúdo da branch (`target ES2022`, `module NodeNext`, `strict`, `verbatimModuleSyntax`…). O `tsconfig.build.json` (que estende o `tsconfig.json` para o build `dist/`) não precisou mudar.

## 4. Arquivos removidos

| Arquivo | Por que saiu |
|---|---|
| `api/src/db.ts`, `api/src/db.t`, `api/src/db/db.ts` | Três conexões `node:sqlite` concorrentes, nenhuma usada pelo servidor (que usava `better-sqlite3`). A conexão agora é uma só: `db/sqlite.ts` |
| `api/src/db/schema.ts` | O schema "ingênuo" que não batia com os repositórios (causa do erro nº 1 do [GUIA_15](GUIA_15_BANCO_SQLITE_API.md)). Substituído pelas migrações versionadas |
| `api/src/db/connection.ts` | Continha o adaptador PostgreSQL (`postgres.js`) e a interface `Db` — a interface migrou para `db/types.ts`, o adaptador saiu junto com o PostgreSQL |
| `api/src/repositories/postgres.ts` | **Renomeado** para `repositories/sqlite.ts` (as classes `Pg*Repository` viraram `Sqlite*Repository`, `createPostgresRepositories` virou `createSqliteRepositories`) — o nome agora diz a verdade |
| `api/test/pgliteDb.ts` | Testes rodam em SQLite em memória (`api/test/db.ts`) |
| `api/env`, `api/.expo/`, `package-lock.json` (raiz) | Lixo do incidente do Expo na pasta errada |
| `api/check.ts` | Virou script oficial: `api/scripts/inspect-db.ts` |
| `api/clinica.db` + `-wal` + `-shm` | Schema errado e **vazio** (0 linhas, conferido) — recriado pelas migrações no primeiro boot |

## 5. Scripts novos e corrigidos da API

| Comando | O que faz |
|---|---|
| `npm run db:inspect` | (novo, herdeiro do `check.ts`) Lista tabelas do `clinica.db`, contagem de linhas e o `rev` da sincronização |
| `npm run db:reset` | (corrigido) Apaga `clinica.db`/`-wal`/`-shm` — o banco é recriado vazio no próximo `npm run dev` |
| `npm run rotate-key` | (corrigido) Re-cifra os dados com chave nova — antes usava `DATABASE_URL` (não existe mais), agora abre o SQLite do `.env` |

## 6. Configuração e texto alinhados ao SQLite

- **`api/.env`** — saiu `DATABASE_URL`; entrou `DATABASE_PATH=clinica.db` (comentado que é relativo a `api/`). A chave AES existente foi **preservada** (trocar = perder os dados cifrados).
- **`api/.env.example`** — reescrito para o setup SQLite (sem Supabase).
- **`.gitignore` (raiz e `api/`)** — agora ignoram `clinica.db`, `clinica.db-wal`, `clinica.db-shm` (banco de dev nunca vai para o git). O da raiz também estava com **encoding corrompido** (acentos viraram `Ǧ`) e ignorava uma pasta `Clinica-PSI-Expo-version/` que não existe mais — corrigidos.
- **`README.md`** — reescrito com escopo SQLite: sem Supabase, caminhos reais (`C:\Users\tyago\Clinica-PSI-Expo-version`), seção "Escopo atual: SQLite local", tabela de scripts úteis e `docs/` marcado como histórico.
- **App (textos)** — a tela de Configurações dizia ao usuário "Dados no servidor (Supabase)" em dois lugares → agora "SQLite". Comentários que citavam Supabase em 6 arquivos foram atualizados.

## 7. Estado do git (importante)

- **Nada foi commitado nem enviado** — todas as mudanças estão no working tree da branch `claude`, como pedido.
- Renomeações foram feitas no sistema de arquivos (ex.: `postgres.ts` → `sqlite.ts`); o git detecta o rename na hora do commit (histórico preservado).
- **Sugestão para o commit:** criar a branch `sqlite` a partir daqui e commitar nela, mantendo `claude`/`main` intactos até o time validar. Exemplo:

```powershell
cd C:\Users\tyago\Clinica-PSI-Expo-version
git switch -c sqlite   # nova branch
git add -A
git commit -m "feat: API volta a usar SQLite local (better-sqlite3, migrações versionadas)"
```

## 8. Checklist final desta fase

- [x] Expo existe em **um** lugar só: `app/` (SDK 55)
- [x] `api/package.json` sem pacotes de UI e sem PostgreSQL
- [x] `api/tsconfig.json` restaurado (sem `extends` do Expo)
- [x] Zero arquivos órfãos/duplicados na camada de banco
- [x] `db:inspect` e `db:reset` funcionando
- [x] `.gitignore` cobrindo o banco local (e sem mojibake)
- [x] README com o escopo real do projeto
- [x] App sem nenhum texto/comentário citando Supabase
- [x] Working tree limpo para revisão: `git status` mostra exatamente o delta desta fase

**Regra de ouro que este guia deixa:** cada pasta tem um papel (`app/` = Expo, `api/` = Node) e os comandos respeitam isso. Se um `npm install` trouxer algo que não combina com o papel da pasta, pare e confira onde o terminal está.

---

| ◀ Anterior | Todos os guias | Próximo ▶ |
| :--- | :---: | ---: |
| [Guia 15 — SQLite na API](GUIA_15_BANCO_SQLITE_API.md) | [Índice](../README.md) | — |
