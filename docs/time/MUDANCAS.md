# Clínica Psi — O que mudou na versão reduzida

Esta pasta é uma cópia **simplificada** do projeto completo (`C:\dev\clinica-psi`), feita para a apresentação.
O histórico completo das mudanças anteriores (modo offline, migração do SQLite para o Supabase, integração das
telas do Tyago) está no `docs/MUDANCAS.md` do projeto completo.

---

## 0. Escopo do protótipo do Tyago (13/11/2026)

O escopo foi reduzido mais uma vez para ficar igual ao protótipo do Tyago
(pasta `Clinica-PSI-Expo-version-Escopo-Reduzido-Tyago`). A estrutura do projeto (API, `bancoDados.ts`, tema,
componentes) continuou a mesma; saíram telas, campos e rotas.

| | Antes | Agora |
|---|---|---|
| Telas | Login, Cadastro 1 e 2, Painel, Pacientes, Detalhe, Agenda, Serviços, Configurações | **Login, Painel, Pacientes, Ficha do paciente, Agenda** |
| Janelas (modais) | Novo paciente, Evolução, Sessão, Serviço, Clínica, Perfil, Diagnóstico (⟳) | **Paciente** (novo/editar), **Sessão** (nova/editar), **Detalhes da sessão** |
| Paciente | nome, telefone, e-mail, nascimento, CPF/RG, serviço, início, situação, profissional, endereço, responsável, queixa, observações | **nome, serviço, início do tratamento, descrição** |
| Sessão | paciente, data, horário, duração, serviço, profissional, situação, observações | **paciente, data, horário, duração, serviço, observações** |
| Serviços | tabela + tela de catálogo | lista fixa no app (`SERVICOS` em `app/src/utils/format.ts`) |
| Criar conta | telas de cadastro no app | `npm run criar-conta` na pasta `api` (ou `POST /auth/register`, que já cria a clínica) |
| Rotas da API | + perfil, senha, clínica, membros, evoluções, serviços | só login, pacientes e agenda (ver [`api/API.md`](../../api/API.md)) |
| Testes da API | 40 | 31 |

Também saíram do app: `conexao/ConexaoProvider.tsx`, `banco/catalogos.ts`, `utils/patientForm.ts`, as ilustrações
(`componentes/art/`), `Stepper`, `InfoNote`, `TextButton` e as dependências `@react-native-community/netinfo`,
`react-native-svg` e `expo-crypto`.

O **banco não mudou**: as tabelas `services` e `evolutions` e as colunas antigas (telefone, situação, profissional…)
continuam no Supabase, só que sem uso. As seções abaixo descrevem a primeira redução e foram ajustadas a este escopo.

---

## 1. Resumo

| Parte | Projeto completo | Versão reduzida |
|---|---|---|
| Onde ficam os dados | Supabase | Supabase (igual) |
| Como o app lê e grava | Repositórios genéricos (`DatabaseProvider`, `ApiTableRepo`) | **Um arquivo só**: `app/src/banco/bancoDados.ts` |
| Estado da conexão | `SyncProvider` / `useSync` (nome herdado do modo offline) | **Removido** (o app mostra erro se a API não responder) |
| Sincronização offline (`POST /sync`) | Existe na API, sem uso no app | **Removida** |
| Auditoria LGPD (`audit_log`, `GET /audit`) | Grava cada leitura e escrita | **Removida** |
| Rotação de chave de criptografia | `DATA_ENCRYPTION_KEY_ID`, `OLD_KEYS`, `npm run rotate-key` | **Removida**: uma chave só |
| Teste de carga | `npm run load-test` (autocannon) | **Removido** |
| Testes automáticos da API | 50 | 31 (saíram os de sync, auditoria, rotação, serviços, evoluções e perfil) |
| Visual | Telas do Tyago | Telas ajustadas aos protótipos do Penpot (ver `06-CSS.md`) |

O que **continua igual**: login com token, hash de senha, bloqueio após 5 erros, uma clínica não vê a outra,
campos clínicos cifrados e RLS ligado no Supabase.

---

## 2. App (`app/`)

### 2.1 Visual
- Cores, cantos e sombras dos protótipos reunidos em `app/src/theme.ts` (`colors`, `radius`, `card`, `cardShadow`, `buttonShadow`).
- Telas restilizadas: Login, Painel, Pacientes, Ficha do paciente, Agenda e os formulários.
- Detalhes e exemplos: [`06-CSS.md`](../06-CSS.md).

### 2.2 Acesso aos dados
- Novo `app/src/banco/bancoDados.ts` (ideia aproveitada da branch `Escopo-Reduzido-Yago`): 5 funções de CRUD
  (`buscarDados`, `buscarUm`, `criarNoBanco`, `atualizarNoBanco`, `apagarNoBanco`), os caminhos em `rotas` e o
  hook `useDados`, que recarrega as listas sozinho depois de cada alteração.
- Removidos `app/src/database/` (DatabaseProvider, ApiTableRepo) e todo o código de "pendente / não enviado".
- `SyncProvider` foi removido (na primeira redução virou `ConexaoProvider`; no escopo do Tyago saiu de vez).
- Tipos `SyncPatient`, `SyncAppointment`… viraram `Patient` e `Appointment` (`app/src/api/tipos.ts`).

### 2.3 Pastas do app
As pastas de `app/src` ganharam nomes em português e uma função cada:

| Antes | Agora |
|---|---|
| `screens/` | `telas/` |
| `componentes/*Modal.tsx` (misturados com botões e campos) | `modais/` |
| `services/api.ts`, `services/apiTypes.ts`, `config/api.ts` | `api/cliente.ts`, `api/tipos.ts`, `api/endereco.ts` |
| `services/masks.ts`, `format.ts` | `utils/` |
| `auth/` | `login/` |
| `navigation/` | `navegacao/` |

Assim a pasta `services/` existe só na API, onde quer dizer "regras do negócio".

---

## 3. API (`api/`)

- Removidos: `services/audit.ts`, `services/sync.ts`, `scripts/load-test.ts`, `scripts/rotate-key.ts`,
  as rotas `/sync` e `/audit`, os scripts `load-test`, `rotate-key` e `db:reset` e a dependência `autocannon`.
- `fieldCipher.ts` ficou com uma chave só (prefixo fixo `v1:`).
- O repositório genérico (`PgRecordRepository` em `repositories/postgres.ts`) grava com um único
  `INSERT … ON CONFLICT (id) DO UPDATE` (cria ou atualiza no mesmo comando).
- Nomes internos `SyncRecord` / `ISyncRepository` viraram `BaseRecord` / `IRecordRepository`, e as respostas
  deixaram de trazer o campo `rev`.
- CI (`.github/workflows/ci.yml`) sem a etapa de carga.

### 3.1 Sobras no banco (não atrapalham)
O Supabase ainda tem as tabelas `audit_log`, `meta`, `services` e `evolutions`, a coluna `rev` nas tabelas de dados
e várias colunas antigas de `patients`, `appointments` e `clinics`. A API não usa mais (grava `rev = 0` porque a
coluna é obrigatória). Não foram apagadas para não mexer no banco que está no ar.

---

## 4. Como cada dado fica guardado no Supabase

| Dado | Coluna | Como fica no banco | Exemplo |
|---|---|---|---|
| E-mail do usuário | `email` | minúsculo | `ana@clinica.com.br` |
| Nome de pessoa | `name` | só letras, espaços simples | `Maria da Silva` |
| Sigla da clínica | `acronym` | até 3 letras maiúsculas | `CP` |
| Serviço do paciente e da sessão | `service` | o **nome** do serviço | `Psicoterapia` |
| Início do tratamento | `treatment_start` | `DATE` (a API mostra `DD/MM/AAAA`) | `2026-03-10` |
| Data e hora da sessão | `date`, `time` | `DATE` e `TIME` (a API mostra `AAAA-MM-DD` e `HH:MM`) | `2026-11-11` · `10:30` |
| Duração da sessão | `duration_min` | inteiro (minutos) | `50` |
| Descrição do paciente, observações da sessão | `complaint_enc`, `notes_enc` | **cifrados** (AES-256-GCM) | `v1:…` |
| Senha | `password_hash` + `salt` | só o hash PBKDF2 | `pbkdf2$210000$…` |
| Criação / edição / exclusão | `created_at`, `updated_at`, `deleted_at` | `TIMESTAMPTZ` | `2026-11-11 01:23:34+00` |

As máscaras de digitação (datas, horário, nome) ficam em `app/src/utils/masks.ts`; a API valida as
mesmas regras em `api/src/domain/validators.ts` e `api/src/routes/schemas.ts`.

---

## 5. Como foi validado
- API: `npm run typecheck` e `npm test` (31 testes, banco PGlite em memória).
- App: `npm run typecheck` e `npx expo export --platform android` (o pacote do app monta sem erro).
- Emulador (13/11/2026), com uma conta criada por `npm run criar-conta`: login, Painel, novo paciente, lista,
  ficha, editar e excluir paciente, nova sessão, detalhes, editar e excluir sessão, Agenda sem pacientes e sair.
