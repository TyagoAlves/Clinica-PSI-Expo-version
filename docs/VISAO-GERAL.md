# Clínica Psi — Visão geral: antes × agora

> Documento para o time (Tyago, Yago, Kelven). Resume o que existia no projeto, o que existe agora e **onde está cada coisa**.
> Detalhes completos de cada mudança: [`MUDANCAS.md`](MUDANCAS.md) · Como rodar: [`DEV-SETUP.md`](DEV-SETUP.md) · Tarefas: [`BACKLOG-TIME.md`](BACKLOG-TIME.md)

> ⚠️ **Precisa de aprovação do grupo e do cliente:** a premissa original *"nada é enviado para servidores"* foi
> substituída por **sincronização com um servidor central**. Ver [seção 4](#4-️-mudança-de-requisito-que-precisa-de-aprovação).

---

## 1. Estado anterior (baseline)

**Arquitetura:** app Expo/React Native **standalone, local-only**, sem backend. Persistência apenas em SQLite no dispositivo.

| Componente | Arquivo | Situação / problema |
|---|---|---|
| Telas (Login, Cadastro 1/2, Painel) | `clinica/src/screens/*.tsx` | Fiéis aos mocks do Penpot |
| Autenticação | `clinica/src/services/auth.ts` | "Hash" = `hash_${senha}_${salt}` → **senha em texto puro** no banco; verificação com `passwordHash.includes(password)` → **bypass por substring** |
| Login | `clinica/src/screens/LoginScreen.tsx` | **Auto-registro** de qualquer credencial quando a tabela `users` estava vazia |
| Persistência | `clinica/src/database/` (`migrate.ts`, `UserRepo`, `ClinicRepo`, `PatientRepo`) | SQLite local, schema v1 com PK `INTEGER AUTOINCREMENT`; no web, um adapter que fazia parse de SQL por string sobre `localStorage` |
| Formulário de paciente | `clinica/src/componentes/NovoPacienteModal.tsx` | 12 campos coletados, **3 persistidos** (o resto concatenado em `notes`) |
| Multi-tenancy | `clinica/src/screens/PainelScreen.tsx` | `clinicId: 1` hardcoded; `listAll()` **sem filtro por tenant** |
| Sessão | — | Inexistente; nenhum vínculo usuário ↔ clínica; drawer com dados hardcoded |
| Navegação | `clinica/App.tsx` | "Rota A" (`useState`) + barra de debug que **contornava a autenticação** |
| Documentação | `Guias de Front…/` **e** `clinica/Tela 1..6` | Conteúdo duplicado |
| Protótipo | `Clinica-PSI-Expo-version/` | Repo separado, parado no GUIA_02 |
| Tipagem | `clinica/App.tsx` | 1 erro de TS (`minHeight: '100vh'`) |

---

## 2. Estado atual

**Arquitetura:** **monorepo** com cliente mobile **offline-first** e **API REST** com sincronização bidirecional.

```
app/ (Expo SDK 52)                           api/ (Node 24 + Express 5)
 SQLite local (source of truth da UI)  ⇄  POST /api/v1/sync  ⇄  SQLite (node:sqlite)
 SecureStore (session token)                   Bearer token · isolamento por clínica
 SyncProvider (push/pull, LWW)                 AES-256-GCM at rest · audit log
```

### 2.1 Cliente mobile — `app/`

| Responsabilidade | Implementação | Arquivo |
|---|---|---|
| **Gerência de sessão** | Context Provider; token opaco em `expo-secure-store` (Keystore/Keychain); revalidação via `GET /me`; handler global de 401 | `app/src/auth/AuthProvider.tsx` |
| **HTTP client** | `fetch` tipado com `AbortController` (timeout), header `Authorization`, normalização de erros (`ApiError.isNetwork`) | `app/src/services/api.ts` |
| **DTOs compartilhados** | Espelho dos tipos de domínio da API | `app/src/services/apiTypes.ts` |
| **Config de ambiente** | Base URL por plataforma (`10.0.2.2` no emulador Android), override via `EXPO_PUBLIC_API_URL` | `app/src/config/api.ts` |
| **Camada de persistência** | *Repository pattern* genérico (`SyncTableRepo<T,F>`): upsert, *soft delete*, *dirty flag*, *observer* (`subscribe`) | `app/src/database/repositories/SyncTableRepo.ts`, `types.ts`, `SyncStateRepo.ts` |
| **Migrações locais** | `PRAGMA user_version`; v2 descarta o schema inseguro e adota PK UUID; v3 cria `services`/`evolutions` | `app/src/database/migrate.ts` |
| **DI dos repositórios** | Context Provider + `wipe()` no logout | `app/src/database/DatabaseProvider.tsx` |
| **Sync engine** | Push das linhas `dirty` + pull incremental por cursor `rev`, paginado (`hasMore`); conflito = **Last-Write-Wins**; debounce; gatilhos `NetInfo`, `AppState` e intervalo de 60 s | `app/src/sync/SyncProvider.tsx` |
| **Navegação** | Stack navigator próprio + `BackHandler` do Android; roteamento condicionado ao estado de auth | `app/src/navigation/AppNav.tsx`, `app/App.tsx` |
| **Hooks de dados** | `useLocalList` (query reativa), `useCatalogs` (serviços e membros) | `app/src/hooks/useClinicData.ts` |
| **Mapper form ↔ domínio** | DTO do formulário ↔ `PatientFields` | `app/src/services/patientForm.ts` |
| Login / Cadastro | Integrados à API; auto-registro removido | `app/src/screens/LoginScreen.tsx`, `CadastroPasso1Screen.tsx`, `CadastroPasso2Screen.tsx` |
| Painel | Filtro por tenant, busca client-side, agregação por serviço, feed de evoluções, indicador de sync | `app/src/screens/PainelScreen.tsx` |
| 🆕 Lista de pacientes | Busca + filtro por status | `app/src/screens/PacientesScreen.tsx` |
| 🆕 Detalhe do paciente | Leitura, edição, *soft delete* em cascata das evoluções | `app/src/screens/PacienteScreen.tsx` |
| 🆕 Prontuário | CRUD de evoluções | `app/src/componentes/EvolucaoModal.tsx` |
| Formulário de paciente | Modo create/edit, validação, catálogos dinâmicos | `app/src/componentes/NovoPacienteModal.tsx` |
| Drawer / AppBar | Ligados à sessão e à navegação | `app/src/componentes/AppMenu.tsx`, `TopBar.tsx`, `AppDrawer.tsx` |
| Diagnóstico | Health check da API, estado do sync, dados locais | `app/src/componentes/DatabaseDebugModal.tsx` |

### 2.2 Backend — `api/` (novo)

Arquitetura em camadas: **routes → services → repositories → db**.

| Responsabilidade | Implementação | Arquivo |
|---|---|---|
| Bootstrap / composition root | Carrega env, abre o DB, injeta repositórios, *graceful shutdown*, seed de serviços | `api/src/server.ts`, `api/src/app.ts` |
| Configuração | Validação de env com zod (fail-fast) | `api/src/config/env.ts` |
| **Roteamento REST** | `/auth`, `/me`, `/clinics`, `/patients`, `/evolutions`, `/services`, `/sync`, `/audit` | `api/src/routes/index.ts` |
| **Validação de entrada** | Schemas zod (mesmas mensagens da UI), paginação | `api/src/routes/schemas.ts` |
| **AuthN** | Middleware Bearer; sessões opacas guardadas como SHA-256 do token (revogáveis) | `api/src/middleware/auth.ts`, `api/src/services/auth.ts` |
| **Hash de senha** | PBKDF2-HMAC-SHA256, 210 mil iterações, comparação com `timingSafeEqual` | `api/src/services/password.ts` |
| **Rate limiting** | 5 falhas por (IP + e-mail) em 15 min → 429 com `Retry-After` | `api/src/security/loginRateLimiter.ts` |
| **Criptografia em repouso** | AES-256-GCM por campo, *key id* no prefixo, **rotação de chave** | `api/src/security/fieldCipher.ts`, `api/scripts/rotate-key.ts` |
| **AuthZ / multi-tenancy** | Isolamento por `clinicId` (403/404 sem vazar a existência do ID); admin = dono ou role `admin` | `api/src/services/clinic.ts`, `records.ts` |
| **Regras de negócio** | CRUD de pacientes, serviços e evoluções; autoria das evoluções | `api/src/services/records.ts` |
| **Sincronização** | Push com LWW, *tombstones*, rejeição cross-tenant, pull paginado sobre contador de revisão global | `api/src/services/sync.ts` |
| **Auditoria (LGPD)** | Trilha *append-only* de acesso e escrita, sem payload clínico | `api/src/services/audit.ts` |
| **Data access** | Repositório genérico sobre `node:sqlite`, transações, mapeamento de colunas cifradas | `api/src/repositories/sqlite.ts`, `types.ts` |
| **Schema / migrações** | Versionadas (`schema_migrations`) | `api/src/db/migrations.ts`, `connection.ts` |
| Logging / headers | Request log sem body; `no-store`, `nosniff`, `no-referrer` | `api/src/middleware/http.ts` |
| **Testes** | 38 testes (vitest + supertest, DB em memória) | `api/test/*.test.ts` |
| **Teste de carga** | autocannon com verificação de integridade | `api/scripts/load-test.ts` |
| Contrato | Documentação dos endpoints | `api/API.md` |

### 2.3 Repositório, CI e tooling

| Item | Arquivo |
|---|---|
| Monorepo git (histórico do `clinica` importado via `git subtree`) — **local, ainda sem push** | `.git/` (raiz) |
| CI GitHub Actions (API: typecheck, testes, build, carga · app: typecheck) | `.github/workflows/ci.yml` |
| Ignore de segredos/artefatos (`.env`, `api/data`, `node_modules`) | `.gitignore` |
| Índice do projeto | `README.md` |
| Documentação técnica | `docs/DEV-SETUP.md`, `docs/BACKLOG-TIME.md`, `docs/MUDANCAS.md`, `docs/VISAO-GERAL.md` |
| Specs de UI (deduplicadas) | `docs/guias/Tela 1..6/` |
| Automação do emulador (ADB + uiautomator), screenshot, logcat | `tools/ui.mjs`, `tools/*.ps1` |

---

## 3. Resumo

**De:** app monolítico local-only, com credenciais em plaintext, auth bypassável, sem tenancy, perda de dados no formulário e docs duplicados.

**Para:** monorepo com cliente **offline-first** + API REST com **authN/authZ**, **multi-tenancy**, **criptografia em repouso com rotação de chave**, **audit log**, **sync incremental com LWW**, testes automatizados e CI.

---

## 4. ⚠️ Mudança de requisito que precisa de aprovação

A premissa **local-only** dos guias ("O sistema guarda tudo apenas local. Nada é enviado para servidores.") foi
substituída por **persistência centralizada com sincronização**. O texto do rodapé foi trocado para:
*"Os dados ficam neste aparelho e são sincronizados com segurança com o servidor da clínica."*

Antes de seguir (e antes de publicar no GitHub), precisamos:
1. **Aprovação do grupo** sobre a arquitetura.
2. **Aprovação do cliente (Marcos Luz)**: dado de saúde é dado sensível pela **LGPD** (hospedagem, consentimento, controlador/operador).
3. **Validação visual** das telas criadas sem mock (Pacientes, Detalhe, Prontuário).

---

## Apêndice — versão simplificada (para quem não é da área)

Pense no projeto como uma **escola** onde a psicóloga guarda as fichas dos alunos (pacientes).

- **Antes:** era só um **caderno solto no celular**. A senha ficava escrita do jeito que era, qualquer pessoa conseguia entrar, metade da ficha do paciente era jogada fora e, se o celular sumisse, sumia tudo.
- **Agora:** o celular continua com o caderno (funciona **sem internet**), mas, quando tem internet, ele **copia tudo para um armário trancado na secretaria** (o servidor). Esse armário tem:
  - um **porteiro**, que só deixa entrar quem tem crachá (login);
  - **cadeado** nas informações secretas do paciente (criptografia);
  - um **caderninho** que anota quem mexeu em quê (auditoria, exigida pela LGPD).
- **Telas novas:** lista de pacientes, página de cada paciente e o **prontuário**, que é o diário de cada sessão.
- **Organização:** as pastas repetidas viraram uma só, e o projeto inteiro ficou numa estrutura única (`app/`, `api/`, `docs/`, `tools/`).

---

## Atualização — telas do Tyago integradas (branch `Dev`)

As telas 7 a 10 que o Tyago fez (estáticas, com dados de exemplo) foram integradas ao `app/` **com o mesmo visual**
e ligadas aos dados reais (SQLite do aparelho + sincronização com a API). Detalhes em [`MUDANCAS.md` §11](MUDANCAS.md).

| Tela (guia) | Arquivo | O que faz agora |
|---|---|---|
| Pacientes (GUIA_11) | `app/src/screens/PacientesScreen.tsx` | Layout do mock + busca, filtros e contador reais |
| Agenda (GUIA_12) | `app/src/screens/AgendaScreen.tsx`, `app/src/componentes/SessaoModal.tsx` | Sessões por dia: agendar, editar, mudar situação, excluir; funciona offline |
| Serviços (GUIA_13) | `app/src/screens/ServicosScreen.tsx`, `app/src/componentes/ServicoModal.tsx` | Catálogo real: toggle ativo/inativo, duração, preço, pacientes por serviço |
| Configurações (Guia 14) | `app/src/screens/ConfiguracoesScreen.tsx`, `ClinicaModal.tsx`, `PerfilModal.tsx` | Editar clínica, perfil e senha (API), exportar dados, apagar dados do aparelho |
| Componentes do Tyago | `app/src/componentes/AppToolbar.tsx`, `EmptyHero.tsx`, `art/Ilustracoes.tsx` | Copiados fielmente (SVGs do Penpot intactos) |
| Backend novo | `api/src/db/migrations.ts` (v3), `api/src/services/records.ts`, `sync.ts` | Sessões (`appointments`), serviços completos, perfil e troca de senha · 45 testes |

⚠️ Partes sem mock (lista/modal da Agenda, modal de Serviço) e textos que mudaram por causa da sincronização
("apenas localmente", "não pode ser desfeita") precisam da validação do Tyago — lista em `MUDANCAS.md` §11.3.
