# Clínica Psi — Registro completo de mudanças

> **Período:** 10/11/2026 · **Autor das mudanças:** Claude (assistente), a pedido do time
> **Pasta de trabalho:** `C:\dev\clinica-psi` · **Versionamento:** monorepo git na raiz com 2 commits estruturais
> (início + importação do histórico do `clinica`); **todas as alterações deste documento ainda não foram commitadas**.
>
> 📁 **Nomes de pasta:** o projeto foi reorganizado (ver [seção 10](#10-reorganização-das-pastas)).
> Neste documento, `app/` = antigo `clinica/` e `api/` = antiga `clinica-api/`.

---

## Sumário

1. [⚠️ O que mudou em relação ao plano original](#1-️-o-que-mudou-em-relação-ao-plano-original)
2. [Visão geral do que existe hoje](#2-visão-geral-do-que-existe-hoje)
3. [Ambiente de desenvolvimento](#3-ambiente-de-desenvolvimento)
4. [Backend — `api/` (novo)](#4-backend--api-novo)
5. [App mobile — `app/`](#5-app-mobile--app)
6. [Documentação e ferramentas criadas](#6-documentação-e-ferramentas-criadas)
7. [Como foi validado](#7-como-foi-validado)
8. [O que falta / o que deve mudar daqui pra frente](#8-o-que-falta--o-que-deve-mudar-daqui-pra-frente)
9. [Apêndice — lista de arquivos](#9-apêndice--lista-de-arquivos)
10. [Reorganização das pastas](#10-reorganização-das-pastas)
11. [Integração da branch `Dev` do Tyago (Telas 7 a 10)](#11-integração-da-branch-dev-do-tyago-telas-7-a-10)
12. [Migração para o Supabase (PostgreSQL)](#12-migração-para-o-supabase-postgresql--sqlite-removido-de-tudo)
13. [Formatação enquanto digita + padronização dos dados](#13-formatação-enquanto-digita--padronização-dos-dados-no-banco)

---

## 1. ⚠️ O que mudou em relação ao plano original

O plano original estava nos guias (hoje em `docs/guias/`, GUIA_01 a GUIA_10) e no código dos
dois repositórios. Abaixo, **tudo o que foi feito diferente do que estava acordado ali** — em ordem de impacto.

### 1.1 🔴 Os dados dos pacientes agora saem do celular e vão para um servidor

| | Plano original | Como está agora |
|---|---|---|
| Onde ficam os dados | **Só no aparelho.** Rodapé de todas as telas de entrada: *"O sistema guarda tudo apenas local. Nada é enviado para servidores."* (GUIA_01, regra repetida em todos os guias; `fetch/API` era "proibido nesta fase") | No aparelho **e** num servidor central (API Node.js). O app grava primeiro no celular e **sincroniza** com o servidor quando tem internet |
| Conta do usuário | Senha guardada no SQLite do celular | Conta criada **no servidor**; login e cadastro **precisam de internet** |
| Prontuário (evoluções) | Não existia | Texto clínico das sessões é enviado ao servidor (cifrado lá) |
| Texto do rodapé | "Nada é enviado para servidores." | **Trocado** para: *"Os dados ficam neste aparelho e são sincronizados com segurança com o servidor da clínica."* |

**Por que aconteceu:** a descrição do time (Yago e Kelven responsáveis por "servidor Node.js", "banco relacional",
"API REST", "sistema centralizado") pressupõe servidor. Quando perguntado, foi escolhido **"Offline-first + sync"**
(manter o SQLite local e sincronizar com a API) e **SQLite no servidor**.

**O que isso exige agora (não foi feito e não é decisão técnica):**
- ❗ **Validar com o cliente (Marcos Luz)** que é aceitável os dados clínicos irem para um servidor. Isso muda a
  promessa feita na interface e tem implicação de **LGPD** (dado de saúde = dado sensível): onde o servidor fica
  hospedado, quem é o controlador/operador, termo de consentimento, contrato.
- ❗ **Validar o novo texto do rodapé** (foi escrito por mim, não veio do Penpot).

### 1.2 🟠 Telas criadas sem mock do Penpot

A regra de ouro dos guias era *"cores, pesos e espaçamentos não são invenção — vêm do Penpot"*. Três telas foram
criadas **sem mock**, seguindo o visual das telas existentes:

- **Pacientes** (lista com busca e filtros por situação)
- **Detalhe do paciente** (dados + editar + excluir)
- **Prontuário** (evoluções) + modal **Nova evolução**

Também foram adicionados elementos visuais que não estavam nos mocks: selo **"pendente"**, botão **⟳** de
sincronização no Painel (substituiu o botão "💾 DB" de debug que já existia no código), texto de status
("Sincronizado às 18:46"), "Ver todos" e filtros em chips.

### 1.3 🟠 Removidos comportamentos que existiam no código

| Removido | Motivo |
|---|---|
| Login que **criava conta sozinho** quando o banco estava vazio | Falha de segurança (o GUIA_01 proíbe conta demo) |
| Barra de atalhos **"Login / Cad. 1 / Cad. 2 / Painel"** no rodapé do app | Permitia abrir o Painel sem login |
| Tabelas locais `users` e `clinics` e os dados de teste antigos do SQLite do celular | Guardavam a senha em texto puro; a migração local v2 **apaga** essas tabelas |
| Adaptador "WebStorage" que imitava SQL no navegador | Não suportava o novo esquema. **Efeito:** o app não roda mais no Expo Web (o alvo é Android/iOS) |
| Botão "Voltar" do passo 2 do cadastro voltando ao passo 1 | A conta já existe no servidor nessa hora; agora "Voltar" pergunta se quer **sair e concluir depois** |

### 1.4 🟡 Outras decisões tomadas por mim (dentro do pedido, mas vale saber)

- **Projeto copiado para `C:\dev\clinica-psi`** (fora do OneDrive). A pasta original no OneDrive ficou intacta, mas
  **está desatualizada** — o trabalho real está em `C:\dev`.
- **Navegação continua na "Rota A"** (estado próprio, sem React Navigation), agora com pilha e botão voltar do Android.
  O GUIA_03 recomendava migrar para a Rota B quando houvesse mais telas.
- **Logout apaga todos os dados clínicos do aparelho** (se houver alterações não enviadas, avisa antes).
- **Conflito de edição** entre dois aparelhos: vence a edição mais recente (pelo relógio do aparelho).
- **Auditoria:** só o criador da clínica ou um usuário "admin" pode ver o log.
- Campo **"Função"** do cadastro: se contém "admin", o usuário vira `admin`; senão `psychologist`.
- Atualizações de pacote **sem mudança de versão major**: `expo-sqlite` 15.0.6 → 15.1.4 (versão exigida pelo SDK 52),
  `newArchEnabled: true` no `app.json` (o Expo Go já roda assim), e instalados `expo-secure-store`, `expo-crypto`,
  `@react-native-community/netinfo` nas versões do SDK 52.

---

## 2. Visão geral do que existe hoje

```
 App Expo (app/)                                     API Node.js (api/)
 ┌───────────────────────────────┐   HTTP + Bearer token   ┌──────────────────────────────────┐
 │ Telas (Login, Cadastro 1 e 2, │ ── /auth, /me ────────▶ │ Express 5 + validação (zod)      │
 │ Painel, Pacientes, Detalhe,   │                         │ Senhas: PBKDF2 (210 mil iter.)   │
 │ Prontuário, Menu)             │ ── POST /sync ────────▶ │ Sessões com token revogável      │
 │                               │ ◀─ mudanças + cursor ── │ Isolamento por clínica           │
 │ SQLite no celular (cache)     │                         │ SQLite (node:sqlite)             │
 │ Token no SecureStore          │                         │ Campos clínicos AES-256-GCM      │
 │ Sincronização automática      │                         │ Auditoria LGPD                   │
 └───────────────────────────────┘                         └──────────────────────────────────┘
```

| Funcionalidade | App | API |
|---|:-:|:-:|
| Login / cadastro em 2 passos / logout | ✅ | ✅ |
| Painel (lista, busca, por serviço, últimos registros, status de sync) | ✅ | — |
| Novo paciente / editar / excluir | ✅ | ✅ |
| Lista de pacientes com filtros | ✅ | ✅ (paginada) |
| Prontuário (evoluções) | ✅ | ✅ |
| Catálogo de serviços | usa no formulário | ✅ CRUD |
| Profissionais da clínica | usa no formulário | ✅ |
| Funciona offline e sincroniza | ✅ | ✅ |
| Auditoria (quem acessou o quê) | — | ✅ |
| Agenda, Configurações, Termos LGPD | ❌ | ❌ |

---

## 3. Ambiente de desenvolvimento

| Item | O que foi feito |
|---|---|
| Diagnóstico | Windows 11, i7-13650HX, 16 GB, Node 24, sem Android SDK, só Java 8 |
| JDK 17 | Temurin 17 em `%LOCALAPPDATA%\Programs\Java\jdk-17.0.21+9` (`JAVA_HOME`) |
| Android SDK | Em **`C:\Android\Sdk`** (`ANDROID_HOME`): platform-tools (adb), emulator, platform 35, imagem x86_64 Google APIs. Instalado pelo novo "Android CLI" do Google com telemetria desligada; termos do SDK **aceitos pelo usuário** |
| Por que `C:\Android` | O app desktop do Claude grava em `AppData\Local` numa área virtualizada, invisível para outros programas |
| PATH do usuário | JDK, platform-tools, emulator, cmdline-tools |
| Emulador | AVD `ClinicaPsi_API35` (Pixel 6, Android 15, 3 GB RAM, aceleração WHPX) |
| App no emulador | Via **Expo Go** (sem build Gradle). Expo Go 2.32.19 instalado pelo Expo CLI |
| Pasta | Projeto copiado para `C:\dev\clinica-psi` |
| Emulador (ajuste de teste) | Desligada a escrita por caneta do Gboard (`stylus_handwriting_enabled 0`) — atrapalhava a automação |

---

## 4. Backend — `api/` (novo)

Criado do zero. **Não existia backend** em nenhum dos repositórios nem nos perfis do GitHub do time.

### 4.1 Stack
Node.js 24 · TypeScript 5.7 (strict) · Express 5 · zod · SQLite embutido (`node:sqlite`) · vitest + supertest ·
autocannon (carga) · tsx (dev com recarga automática).

### 4.2 Banco de dados (migrações versionadas em `src/db/migrations.ts`)

| Tabela | Conteúdo | Observação |
|---|---|---|
| `users` | nome, e-mail, hash+salt da senha, CRP, papel, clínica | e-mail único sem diferenciar maiúsculas |
| `clinics` | nome, unidade, responsável técnico, CNPJ, telefone, e-mail, endereço, sigla, dono | |
| `sessions` | **hash SHA-256** do token, usuário, validade | vazamento do banco não vaza sessões |
| `patients` | todos os campos do formulário | documento, endereço, responsável, queixa e observações **cifrados** |
| `services` | catálogo de serviços por clínica | |
| `evolutions` | prontuário: data, autor, texto | texto **cifrado** |
| `audit_log` | quem, quando, IP, ação, entidade | nunca guarda conteúdo clínico |
| `meta` | contador global `rev` | cursor da sincronização |

Todas as entidades sincronizáveis têm `id` UUID, `updatedAt`, `deletedAt` (exclusão lógica) e `rev`.

### 4.3 Segurança
- **Senha:** PBKDF2-SHA256, 210 mil iterações, salt aleatório, comparação em tempo constante.
- **Login:** mesma mensagem para e-mail inexistente e senha errada; **bloqueio por 15 min após 5 erros** (IP + e-mail).
- **Sessão:** token aleatório de 32 bytes, validade 30 dias (configurável), revogado no logout, limpeza automática.
- **Isolamento:** usuário só acessa a própria clínica (403/404); sync rejeita IDs de outra clínica.
- **Criptografia em repouso:** AES-256-GCM com **rotação de chave** (`DATA_ENCRYPTION_KEY`, `_KEY_ID`,
  `_OLD_KEYS`, `npm run rotate-key`).
- **Cabeçalhos:** `Cache-Control: no-store`, `nosniff`, `no-referrer`; log não grava corpo das requisições.

### 4.4 Endpoints (detalhes em `api/API.md`)

| Grupo | Rotas |
|---|---|
| Saúde | `GET /health`, `GET /api/v1/ping` |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me` |
| Clínica | `POST /clinics`, `GET/PATCH /clinics/:id`, `GET /clinics/:id/members`, `GET /clinics/:id/audit` |
| Pacientes | `GET/POST /clinics/:id/patients`, `GET/PATCH/DELETE /patients/:id` |
| Evoluções | `GET/POST /patients/:id/evolutions`, `GET/PATCH/DELETE /evolutions/:id` |
| Serviços | `GET/POST /clinics/:id/services`, `PATCH/DELETE /services/:id` |
| Sincronização | `POST /sync` (push + pull paginado com `hasMore`) |

Listagens são **paginadas** (`limit`, `offset`, `search`) e retornam `{ items, total, nextOffset }`.

### 4.5 Regras de negócio
- Mesmas validações e **mensagens** das telas (nome, e-mail, senha ≥ 6, CRP, CNPJ).
- Paciente: nome, telefone e serviço obrigatórios; datas em DD/MM/AAAA; situação ∈ {Em tratamento, Pausado, Alta}.
- Clínica nova nasce com os serviços **Psicoterapia, Avaliação, Acompanhamento**; sigla derivada do nome.
- Sync: edição mais recente vence; exclusão vence edição antiga; autor da evolução preservado.

### 4.6 Qualidade
- **38 testes automatizados** (unitários, API, sync, funcionalidades).
- **Teste de carga** `npm run load-test`: 4.250 requisições, 0 erros, 2.130/2.130 gravações confirmadas.
- **CI** pronto em `.github/workflows/ci.yml` (typecheck, testes, build, carga).
- `git init` na branch `main`, **sem commits**; `.env` e `data/` ignorados.

---

## 5. App mobile — `app/`

### 5.1 Problemas que existiam e foram corrigidos

| Problema encontrado | Correção |
|---|---|
| Senha salva em **texto puro** (`hash_<senha>_<salt>`) | App não guarda senha; só o servidor guarda o hash |
| Login aceitava senha que fosse **trecho** do "hash" | Verificação real no servidor |
| Login **criava conta sozinho** com banco vazio | Removido |
| Sem sessão: clínica não ligada ao usuário, paciente sempre na clínica `1`, menu fixo "Ana Souza" | Sessão real (token no SecureStore); dados reais no menu |
| Formulário de paciente **descartava** a maioria dos campos | Todos os campos salvos e sincronizados |
| Painel listava pacientes **de todas as clínicas** | Filtra pela clínica da sessão |
| Data de início fixa "08/11/2026" e profissionais fixos | Data de hoje; profissionais reais |
| Erro de tipagem `minHeight: '100vh'` | Corrigido; `tsc` limpo |
| Depois de sair, abria o Cadastro em vez do Login | Corrigido |

### 5.2 Arquitetura nova no app
- `src/auth/AuthProvider.tsx` — sessão (login, cadastro, criar clínica, logout, expiração).
- `src/services/api.ts` + `apiTypes.ts` — cliente HTTP tipado com timeout e tratamento de "sem conexão".
- `src/config/api.ts` — endereço da API (`10.0.2.2` no emulador; `EXPO_PUBLIC_API_URL` para celular físico).
- `src/database/` — SQLite local v3 (pacientes, serviços, evoluções, estado do sync) com repositório genérico.
- `src/sync/SyncProvider.tsx` — sincroniza ao entrar, ao voltar a internet, ao reabrir o app, após cada
  alteração e a cada 60 s; mostra pendências; baixa a lista de profissionais.
- `src/navigation/AppNav.tsx` — pilha de telas pós-login com botão voltar do Android.

### 5.3 Telas
| Tela | Situação |
|---|---|
| Login | lógica trocada para a API; visual igual ao mock |
| Cadastro 1 e 2 | cria conta e clínica no servidor; passo 2 salva **todos** os campos (unidade, responsável, e-mail, sigla) |
| Painel | busca funcional, abre paciente, "Ver todos", "Últimos registros" e "Pacientes por serviço" com dados reais, status de sync |
| Modal Novo/Editar paciente | modo edição, validações de data/e-mail, serviços e profissionais reais |
| Menu lateral | dados reais da clínica/usuário; Painel e Pacientes navegam; demais mostram "Em breve" |
| **Pacientes** (nova) | busca, filtros por situação com contagem, selo pendente |
| **Detalhe do paciente** (nova) | dados, editar, excluir |
| **Prontuário / Nova evolução** (nova) | criar, ler, editar, excluir evoluções |
| Modal de diagnóstico (⟳) | mostra sessão, conexão com a API, sincronização e dados no aparelho |

---

## 6. Documentação e ferramentas criadas

| Arquivo | Para quê |
|---|---|
| `docs/DEV-SETUP.md` | Como subir API, emulador e app; inspeção e problemas conhecidos |
| `docs/BACKLOG-TIME.md` | Estado atual + tarefas por pessoa (Tyago, Yago, Kelven) |
| `api/API.md` | Contrato completo da API |
| `docs/MUDANCAS.md` | Este documento |
| `README.md` (raiz) | Índice do projeto e comandos rápidos |
| `tools/emulador.ps1` | Sobe o emulador |
| `tools/screenshot.ps1` | Captura a tela do emulador |
| `tools/logcat.ps1` | Logs do app (JS + crashes) |
| `tools/ui.mjs` | Automação: listar elementos, tocar, digitar, screenshot |
| `docs/screenshots/` | Capturas dos testes |

---

## 7. Como foi validado

Tudo testado no emulador Android 15, com a API local:

1. Login com conta inexistente → **recusado** ✅
2. Cadastro em 2 passos → Painel sincronizado ✅
3. Novo paciente → chegou ao servidor com UUID do aparelho ✅
4. **Modo avião** → paciente fica "pendente"; rede volta → sincroniza sozinho ✅
5. Sair → token revogado e dados do aparelho apagados; entrar de novo → dados baixados ✅
6. Detalhe → nova evolução → chegou **cifrada** no servidor, com autora e registro na auditoria ✅
7. Editar situação para "Pausado" ✅ · Voltar do Android ✅ · Menu → Pacientes → filtro ✅
8. Serviço criado direto na API aparece no seletor do app ✅

Mais: 38 testes da API, teste de carga, `tsc --noEmit` limpo no app e na API.

**Não testado:** iPhone/iOS, celular físico, Expo Web (deixou de funcionar, ver 1.3), dois aparelhos ao mesmo tempo
(o conflito foi testado só na API).

---

## 8. O que falta / o que deve mudar daqui pra frente

### 8.1 🔴 Decisões que precisam ser tomadas antes de seguir

1. **Aprovação do cliente para dados no servidor** (seção 1.1). Sem isso, toda a parte de sincronização pode ter
   que voltar atrás. Junto: texto do rodapé, termo de consentimento e onde o servidor será hospedado.
2. **Aprovação visual das telas sem mock** (Pacientes, Detalhe, Prontuário). Idealmente desenhar no Penpot e ajustar.
3. **Commits e repositórios:** decidir se as mudanças do app entram numa branch nova do `clinica` (HighestCoder) e
   criar o repositório no GitHub para o monorepo e fazer o primeiro push. As alterações ainda não foram commitadas.

### 8.2 🟠 Funcionalidades que faltam (prometidas pelas telas/guias)

| Funcionalidade | Onde aparece hoje | O que falta |
|---|---|---|
| **Agenda / Sessões de hoje** | Card do Painel, botão "Abrir agenda", item do menu | Modelo de sessão (data, hora, paciente, profissional, status), API, sync, telas |
| **Serviços (gerenciar)** | Item do menu | Tela para criar/renomear/remover (a API já tem tudo) |
| **Configurações** | Item do menu; passo 2 diz "dá para ajustar depois em Configurações" | Tela para editar clínica (API pronta), perfil e troca de senha (API não tem) |
| **Termos LGPD** | Hero do Painel; passo 2 fala em "termos" | Geração, assinatura e registro de consentimento |
| **Vários profissionais** | "Profissional responsável" | Convite de novos usuários para a clínica; papéis restringindo ações |
| **Fichas/documentos** | Passo 2 fala em "cabeçalho das fichas" | Exportar/imprimir ficha ou prontuário (PDF) |

### 8.3 🟡 Técnico — backend (Yago / Kelven)

- **Banco de produção:** decidir Postgres (basta implementar as interfaces de `src/repositories/types.ts`).
- **Hospedagem + HTTPS obrigatório** (proxy reverso, `TRUST_PROXY=true`), backup do banco.
- **Guarda da chave de criptografia** em cofre/variável do servidor; perder a chave = perder os dados.
- **Rate limit e sessões** hoje em memória/SQLite → Redis/Postgres se houver mais de uma instância.
- **Retenção e exclusão de dados** (LGPD): por quanto tempo guardar prontuário, auditoria e como atender pedido de exclusão.
- **Troca/recuperação de senha** (não existe).
- Testes de conflito com **dois aparelhos** e testes de integração app ↔ API no CI.
- Validações extras: CPF com dígito verificador, nascimento no futuro, telefone BR.

### 8.4 🟡 Técnico — app (Tyago)

- **Criptografia do banco no celular** (SQLCipher) — exige *development build*, não roda no Expo Go.
- **Login offline** não existe: sem internet, só quem já está logado usa o app.
- Migrar a navegação para **React Navigation (Rota B)** quando entrarem Agenda/Serviços/Configurações.
- **Máscaras** (telefone, CPF, data) e seletor de data nativo; seletores com lista em vez de "toque para alternar".
- Testes automatizados do app (Jest + Testing Library) — hoje não existem.
- Expo Web parou de funcionar (decidir se é necessário; exige configurar o SQLite WASM).
- Testes de usabilidade com o cliente (roteiro: cadastro, paciente offline, prontuário, sincronização).
- Paginação/virtualização da lista no app para clínicas com muitos pacientes.

### 8.5 Ordem sugerida
1. Decisões da 8.1 → 2. Commits/repositórios → 3. Hospedagem + Postgres + HTTPS → 4. Configurações e Serviços
(API pronta, só falta tela) → 5. Agenda → 6. Convites/papéis → 7. Termos LGPD e documentos.

---

## 9. Apêndice — lista de arquivos

### `api/` (tudo novo)
```
src/app.ts · src/server.ts · src/config/env.ts
src/db/connection.ts · src/db/migrations.ts
src/domain/types.ts
src/middleware/auth.ts · src/middleware/http.ts
src/repositories/types.ts · src/repositories/sqlite.ts
src/routes/index.ts · src/routes/schemas.ts
src/security/fieldCipher.ts · src/security/loginRateLimiter.ts
src/services/audit.ts · auth.ts · clinic.ts · errors.ts · password.ts · records.ts · sync.ts
scripts/gen-key.ts · scripts/load-test.ts · scripts/rotate-key.ts
test/helpers.ts · api.test.ts · sync.test.ts · features.test.ts · unit.test.ts
API.md · .env.example · .gitignore
package.json · tsconfig.json · tsconfig.build.json · vitest.config.ts
```

### `app/` (app)
**Novos:** `src/auth/AuthProvider.tsx` · `src/config/api.ts` · `src/services/api.ts` · `src/services/apiTypes.ts` ·
`src/services/patientForm.ts` · `src/sync/SyncProvider.tsx` · `src/navigation/AppNav.tsx` ·
`src/hooks/useClinicData.ts` · `src/database/repositories/SyncTableRepo.ts` · `src/database/repositories/SyncStateRepo.ts` ·
`src/componentes/AppMenu.tsx` · `TopBar.tsx` · `EvolucaoModal.tsx` · `src/screens/PacientesScreen.tsx` · `PacienteScreen.tsx`

**Alterados:** `App.tsx` · `app.json` · `package.json` / `package-lock.json` · `src/componentes/AppDrawer.tsx` ·
`AuthScreen.tsx` (rodapé) · `DatabaseDebugModal.tsx` · `NovoPacienteModal.tsx` · `src/database/DatabaseProvider.tsx` ·
`migrate.ts` · `repositories/types.ts` · `src/screens/LoginScreen.tsx` · `CadastroPasso1Screen.tsx` ·
`CadastroPasso2Screen.tsx` · `PainelScreen.tsx`

**Removidos:** `src/services/auth.ts` · `clinic.ts` · `patient.ts` · `src/database/repositories/UserRepo.ts` ·
`ClinicRepo.ts` · `PatientRepo.ts`

### Raiz (`C:\dev\clinica-psi`)
`README.md` · `.gitignore` · `.github/workflows/ci.yml` · `docs/` (DEV-SETUP, BACKLOG-TIME, MUDANCAS, guias, screenshots) · `tools/` (4 scripts)

### Fora do projeto
- Variáveis de ambiente do usuário: `JAVA_HOME`, `ANDROID_HOME`, `PATH`
- `C:\Android\Sdk`, `%LOCALAPPDATA%\Programs\Java\jdk-17.0.21+9`, AVD em `%USERPROFILE%\.android\avd`
- Configuração do emulador: escrita por caneta do teclado desligada

---

## 10. Reorganização das pastas

Feita depois de todas as mudanças acima, para eliminar duplicações.

| Antes | Depois | O que aconteceu |
|---|---|---|
| `clinica/` (repo git do HighestCoder) | `app/` | Movido. **Histórico preservado** via `git subtree` (o commit `a414a99` continua no log) |
| `clinica-api/` (git sem commits) | `api/` | Movido; o `.git` vazio foi descartado |
| `clinica/Tela 1..6` **e** `Guias de Front Clinica Psi Expo/Tela 1..6` | `docs/guias/Tela 1..6` | As duas cópias eram **idênticas** (conferido arquivo a arquivo); ficou uma só |
| `DEV-SETUP.md`, `BACKLOG-TIME.md`, `MUDANCAS.md` na raiz | `docs/` | Movidos; caminhos internos atualizados |
| `screenshots/` | `docs/screenshots/` | Removidos 3 arquivos de depuração (`ui.xml`, `cad1-debug.png`, `12-reload.png`) |
| `scripts/` | `tools/` | Scripts ajustados para gravar em `docs/screenshots` |
| `clinica-api/.github/workflows/ci.yml` | `.github/workflows/ci.yml` (raiz) | CI do monorepo: job da API + job do app |
| — | `README.md` e `.gitignore` na raiz | Índice do projeto; ignora `node_modules`, `.env`, `api/data` e o protótipo |

**Não mexidos (por decisão do usuário):** o protótipo `Clinica-PSI-Expo-version/` (repo do Tyago; fica na raiz, mas
ignorado pelo git) e a pasta original no OneDrive (`Documentos\FACULDADE\dev android\projeto`), que está desatualizada.

Backup do estado anterior (histórico git do `clinica`, patch das alterações e código-fonte): pasta temporária da
sessão do Claude, `backup-clinica-git`.

---

## 11. Integração da branch `Dev` do Tyago (Telas 7 a 10)

Origem: `https://github.com/TyagoAlves/Clinica-PSI-Expo-version/tree/Dev` (commit `7c5f63e`).
O Tyago entregou guias e telas **estáticas** (dados de exemplo, sem persistência, como pedem os guias).
A integração portou o **visual** dele para o `app/` e ligou cada tela aos **dados reais** (SQLite do aparelho + sync com a API).

### 11.1 O que veio da branch dele

| Item | Onde ficou no monorepo |
|---|---|
| Guias novos: GUIA_11 Pacientes (Tela 7), GUIA_12 Agenda (Tela 8), GUIA_13 Serviços (Tela 9), Guia 14 Configurações (Tela 10) + mocks | `docs/guias/Tela 7..10/` |
| `ESTADO_FINAL_COMPLETO.md` (retrato do app dele) | `docs/guias/ESTADO_FINAL_COMPLETO.md` |
| Revisões dos guias 01–10 (ele atualizou textos e o GUIA_07 com o `AppToolbar`) | substituíram as versões anteriores em `docs/guias/Tela 1..6/` (a anterior fica no histórico do git) |
| `AppToolbar` (☰ + busca + ⋮) | `app/src/componentes/AppToolbar.tsx` (cópia fiel) |
| `EmptyHero` genérico (título/subtítulo/botão) | `app/src/componentes/EmptyHero.tsx` (cópia fiel) |
| Ilustração da Agenda e ícones de serviço (SVG do Penpot) | `app/src/componentes/art/Ilustracoes.tsx` (vetores intactos; só saíram das telas) |
| Layout das telas Agenda, Serviços, Configurações e Pacientes | `app/src/screens/*.tsx` (reescritas com o mesmo visual + dados reais) |

**Não foi trazido:** o `package.json` dele usa **Expo SDK 55 / React 19 / RN 0.83**; o `app/` continua no **SDK 52**
(upgrade de versão major só com aprovação do time). Só foi adicionado `react-native-svg@15.8.0` (versão do SDK 52).

### 11.2 O que foi implementado em cima

**API (`api/`)**
- Migração 3: serviços ganham `description`, `durationMin`, `priceCents` (centavos), `active`; tabela **`appointments`** (sessões da agenda) com observações cifradas.
- Catálogo padrão com os valores do mock (Psicoterapia 50 min R$ 150, Avaliação 60 min R$ 200, Acompanhamento 50 min R$ 120).
- Rotas novas: `GET/POST /clinics/:id/appointments` (filtro `from`/`to`), `GET/PATCH/DELETE /appointments/:id`,
  `PATCH /me` (nome, CRP), `POST /auth/change-password` (exige a senha atual e derruba as outras sessões).
- `/sync` agora cobre **4 entidades** (pacientes, serviços, evoluções, sessões).
- Repositório genérico ganhou colunas numéricas/booleanas e filtro por intervalo.
- +7 testes (**45 no total**).

**App (`app/`)**
- **Agenda** (`AgendaScreen.tsx`): navegação ‹ dia ›, estado vazio ilustrado do mock (sem pacientes), lista de sessões do dia com status colorido, busca, "Nova sessão" (`SessaoModal.tsx`): paciente, data, horário, duração (puxa do serviço), serviço, profissional, situação e observações.
- **Serviços** (`ServicosScreen.tsx`): cards do mock com ícones, toggle que ativa/desativa de verdade, contagem real de pacientes em tratamento por serviço, novo/editar/excluir (`ServicoModal.tsx`). Inativos somem dos formulários.
- **Configurações** (`ConfiguracoesScreen.tsx`): Informações da clínica (`ClinicaModal.tsx`) e Perfil e acesso com troca de senha (`PerfilModal.tsx`) salvam na API; Backup exporta os dados do aparelho; Apagar dados locais limpa o aparelho e sai; Sobre mostra versão, servidor e última sincronização; busca filtra as opções.
- **Pacientes**: layout do GUIA_11 (AppToolbar, faixa de título, contador "em tratamento", EmptyHero).
- **Painel**: "Sessões de hoje" com dados reais e "Abrir agenda" funcionando. **Detalhe do paciente**: seção "Próximas sessões" com agendamento.
- Menu lateral: Agenda, Serviços e Configurações navegam.
- Banco local v4 (serviços completos + sessões) e sync de sessões offline.
- Componentes novos de apoio: `SheetModal.tsx` (moldura dos formulários), `services/format.ts` (datas e dinheiro).

### 11.3 ⚠️ Divergências em relação aos guias/mocks do Tyago (validar com ele)

| Mock/guia | O que foi feito | Motivo |
|---|---|---|
| Configurações: rodapé *"Seus dados são armazenados apenas localmente."* | *"Seus dados ficam neste aparelho e são sincronizados com o servidor da clínica."* | Mesma questão da seção 1.1 (dados agora sincronizam) |
| "Apagar dados locais — Esta ação não pode ser desfeita." | "Apaga os dados deste aparelho e sai da conta." | Com servidor, os dados voltam ao entrar de novo |
| "Sobre — Versão 1.0 · Prontuário local" | "Versão 1.0 · Prontuário com sincronização" | Idem |
| "Termos e privacidade — 2 modelos · tratamento e aviso de dados" | "Termo de consentimento e aviso de privacidade." + aviso "em breve" | Não há modelos de termo ainda (precisam do cliente) |
| Agenda: só existe o mock do **estado vazio** | Lista de sessões, botão "Nova sessão" e modal **sem mock** | A agenda real precisava de interface; seguiu o visual dos outros cards |
| Serviços: ⋮ do card e "+ Novo serviço" eram "em breve" | Abrem editar/ativar e o formulário de serviço (**sem mock**) | Tela funcional |
| Toolbar da Agenda com busca desabilitada | Busca ativa (filtra sessões do dia por paciente) quando há pacientes | Tela funcional |
| Ícones de serviço só para os 3 do mock | Serviços novos recebem um dos 3 ícones (pelo nome ou alternando) | Não há ícone para serviço criado pelo usuário |

### 11.4 Validação no emulador
Serviços (toggle refletiu no servidor), Agenda (sessão criada, apareceu no servidor e no Painel), Configurações
(edição da clínica salva na API), Pacientes (layout novo). Capturas em `docs/screenshots/17-*` a `20-*`.

---

## 12. Migração para o Supabase (PostgreSQL) — SQLite removido de tudo

Decisão do usuário: trocar o SQLite **do servidor e do celular** pelo Supabase.

### 12.1 ⚠️ Consequência principal: o app deixou de funcionar offline
O modo **offline-first** (seções 2 e 11) foi **desligado**. Agora:
- o celular **não guarda dados de pacientes** (só o token de login, no SecureStore);
- toda leitura e gravação vai direto para a API → Supabase; **sem internet, o app mostra erro** ("Sem conexão com o servidor");
- o selo "pendente" e a fila de sincronização deixaram de existir (o código das telas foi mantido, mas `pending` é sempre 0).

O endpoint `/sync` **continua na API** (com testes), caso o time queira voltar ao modo offline no futuro.

### 12.2 API (`api/`)
| Antes | Agora |
|---|---|
| `node:sqlite`, arquivo `api/data/clinica.db` | **PostgreSQL do Supabase** via driver `postgres` (postgres.js), `prepare: false` (compatível com o pooler) |
| `DB_PATH` no `.env` | **`DATABASE_URL`** (Supabase → Connect → Session pooler). Contém a senha: só no `.env`, nunca no git |
| `src/repositories/sqlite.ts` (síncrono) | `src/repositories/postgres.ts` (assíncrono, `$1…`, mesmas interfaces) |
| 3 migrações SQLite | 1 migração PostgreSQL consolidada (`src/db/migrations.ts`) |
| Testes em SQLite em memória | Testes em **PGlite** (PostgreSQL real em WASM, dentro do Node): mesmo SQL do Supabase, sem rede |

**Segurança específica do Supabase:** todas as tabelas têm **Row Level Security ativa e sem políticas**.
Assim, a API REST automática do Supabase (que aceita a chave *publishable*) **não lê nem grava nada**;
só a nossa API, conectando como dono do banco, acessa os dados. Criptografia de campos, auditoria e
isolamento por clínica continuam na nossa API, iguais.

Rotas novas para o app online: `GET /clinics/:id/evolutions` (últimas da clínica) e filtro `patientId` em
`GET /clinics/:id/appointments`. **46 testes** passando; teste de carga ok.

### 12.3 App (`app/`)
| Antes | Agora |
|---|---|
| `expo-sqlite` + `migrate.ts` + `SyncTableRepo` + `SyncStateRepo` | **Removidos** (dependência desinstalada, plugin tirado do `app.json`) |
| Repositórios gravavam no SQLite local | `ApiTableRepo.ts`: mesma interface, mas cada operação é uma chamada HTTP à API |
| `SyncProvider` fazia push/pull | Agora só acompanha a conexão, busca os profissionais e "Atualizar agora" recarrega as telas |
| Textos "dados neste aparelho / sincronizados" | "Dados no servidor seguro da clínica (Supabase), com criptografia"; "Apagar dados locais" virou "Sair deste aparelho" |

### 12.4 Dados antigos
O banco SQLite antigo (`api/data/clinica.db`, com a conta de teste `ana@clinica.com.br`) **não foi migrado**:
eram só dados de teste. No Supabase o banco começa vazio — é preciso criar a conta de novo pelo app.
O arquivo antigo continua na pasta (ignorado pelo git) e pode ser apagado.

---

## 13. Formatação enquanto digita + padronização dos dados no banco

### 13.1 Como cada dado é guardado no Supabase (verificado em 11/11/2026)

| Dado | Coluna | Como fica no banco | Exemplo |
|---|---|---|---|
| Telefone (paciente e clínica) | `phone` | **só dígitos** | `61900000000` |
| CPF / RG do paciente | `document_enc` | só dígitos (CPF) ou letras+números (RG), **cifrado** | `v1:A/whW+k…` |
| CNPJ / CPF da clínica | `cnpj` | **só dígitos**, dígito verificador conferido | `11222333000181` |
| E-mail | `email` | minúsculo | `maria@email.com` |
| CRP | `crp` | formato padrão | `CRP 06/123456` |
| Nome de pessoa | `name`, `guardian`, `technical_responsible` | só letras, espaços simples | `Maria da Silva` |
| Sigla da clínica | `acronym` | até 3 letras maiúsculas | `CP` |
| Nascimento, início do tratamento, data da evolução | `birth_date`, `treatment_start`, `session_date` | texto `DD/MM/AAAA` (data real; nascimento não futuro) | `10/02/1990` |
| Data e hora da sessão (agenda) | `date`, `time` | texto `AAAA-MM-DD` e `HH:MM` | `2026-11-11` · `10:30` |
| Duração / preço do serviço | `duration_min`, `price_cents` | inteiro (minutos / **centavos**) | `50` · `15000` |
| Ativo | `active` | `boolean` | `true` |
| Endereço, queixa, observações, evolução | `*_enc` | **cifrados** (AES-256-GCM) | `v1:…` |
| Senha | `password_hash` + `salt` | só o hash PBKDF2 | `pbkdf2$210000$…` |
| Criação/edição | `created_at`, `updated_at` | texto ISO-8601 UTC | `2026-11-11T01:23:34.041Z` |

### 13.2 O que mudou
- **App** (`app/src/services/masks.ts`): máscaras aplicadas enquanto se digita em todos os formulários —
  telefone `61 9 0000-0000` / `61 3000-0000`, CPF `000.000.000-00`, CNPJ/CPF da clínica (troca sozinho),
  datas `DD/MM/AAAA`, hora `HH:MM`, CRP `CRP 06/123456`, preço `1.200,00`, duração só números, e-mail sem
  espaços e minúsculo, nomes sem números/símbolos, sigla só letras. Teclado numérico nos campos numéricos.
  Validação antes de salvar: telefone completo, CPF/CNPJ com dígito verificador, data que existe, nascimento não futuro.
- **Telas** mostram telefone/documento formatados (o banco guarda só dígitos).
- **API** (`api/src/domain/validators.ts` + `routes/schemas.ts`): normaliza e valida as mesmas regras — o
  banco fica limpo mesmo que outro cliente (web, script) chame a API. +4 testes (**50 no total**).

### 13.3 Datas com tipos reais (migração 2 — `tipos_de_data_reais`) ✅
- Antes, todas as datas eram **texto**. Agora, no banco:
  | Coluna | Tipo antes | Tipo agora | Formato na API (inalterado) |
  |---|---|---|---|
  | `patients.birth_date`, `treatment_start`, `evolutions.session_date` | TEXT `DD/MM/AAAA` | `DATE` | `DD/MM/AAAA` |
  | `appointments.date` | TEXT `AAAA-MM-DD` | `DATE` | `AAAA-MM-DD` |
  | `appointments.time` | TEXT `HH:MM` | `TIME` | `HH:MM` |
  | `created_at`, `updated_at`, `deleted_at`, `sessions.expires_at`, `audit_log.at` | TEXT ISO | `TIMESTAMPTZ` | ISO-8601 UTC |
- Os dados existentes no Supabase foram convertidos pela própria migração (sem perda).
- A conversão fica em `api/src/repositories/postgres.ts` (tipos de coluna `dateBr`, `date`, `time`, `timestamp`
  com cast explícito no SQL). **O app não mudou**: recebe e envia os mesmos formatos de antes.
- Ganhos: o banco recusa datas impossíveis, ordena/filtra por período corretamente e o prontuário agora lista as
  evoluções pela **data da sessão** (mais recente primeiro). Novos índices: `idx_evolutions_patient_date`, `idx_patients_birth`.

### 13.4 Pendências (sugestão)
- A auditoria registra **toda listagem** do app online (centenas de linhas por sessão de uso). Avaliar
  registrar só leituras de prontuário/paciente específico e escritas.
