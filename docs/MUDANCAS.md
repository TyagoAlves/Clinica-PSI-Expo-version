# Clínica Psi — O que mudou na versão reduzida

Esta pasta é uma cópia **simplificada** do projeto completo (`C:\dev\clinica-psi`), feita para a apresentação.
O histórico completo das mudanças anteriores (modo offline, migração do SQLite para o Supabase, integração das
telas do Tyago) está no `docs/MUDANCAS.md` do projeto completo.

---

## 1. Resumo

| Parte | Projeto completo | Versão reduzida |
|---|---|---|
| Onde ficam os dados | Supabase | Supabase (igual) |
| Como o app lê e grava | Repositórios genéricos (`DatabaseProvider`, `ApiTableRepo`) | **Um arquivo só**: `app/src/banco/bancoDados.ts` |
| Estado da conexão | `SyncProvider` / `useSync` (nome herdado do modo offline) | `ConexaoProvider` / `useConexao` |
| Sincronização offline (`POST /sync`) | Existe na API, sem uso no app | **Removida** |
| Auditoria LGPD (`audit_log`, `GET /audit`) | Grava cada leitura e escrita | **Removida** |
| Rotação de chave de criptografia | `DATA_ENCRYPTION_KEY_ID`, `OLD_KEYS`, `npm run rotate-key` | **Removida**: uma chave só |
| Teste de carga | `npm run load-test` (autocannon) | **Removido** |
| Testes automáticos da API | 50 | 40 (saíram os de sync, auditoria e rotação) |
| Visual | Telas do Tyago | Telas ajustadas aos protótipos do Penpot (ver `DOCUMENTACAO_CSS.md`) |

O que **continua igual**: login com token, hash de senha, bloqueio após 5 erros, uma clínica não vê a outra,
campos clínicos cifrados e RLS ligado no Supabase.

---

## 2. App (`app/`)

### 2.1 Visual
- Cores, cantos e sombras dos protótipos reunidos em `app/src/theme.ts` (`colors`, `radius`, `card`, `cardShadow`, `buttonShadow`).
- Todas as telas existentes restilizadas: Login, Cadastro 1 e 2, Painel, Pacientes, Detalhe do paciente, Agenda,
  Serviços, Configurações e os formulários. Nenhuma tela nova foi criada.
- Detalhes e exemplos: [`DOCUMENTACAO_CSS.md`](DOCUMENTACAO_CSS.md).

### 2.2 Acesso aos dados
- Novo `app/src/banco/bancoDados.ts` (ideia aproveitada da branch `Escopo-Reduzido-Yago`): 5 funções de CRUD
  (`buscarDados`, `buscarUm`, `criarNoBanco`, `atualizarNoBanco`, `apagarNoBanco`), os caminhos em `rotas` e o
  hook `useDados`, que recarrega as listas sozinho depois de cada alteração.
- Removidos `app/src/database/` (DatabaseProvider, ApiTableRepo) e todo o código de "pendente / não enviado".
- `SyncProvider` virou `app/src/conexao/ConexaoProvider.tsx` (`useConexao`): acompanha a internet, busca os
  profissionais da clínica e oferece "Atualizar agora".
- Tipos `SyncPatient`, `SyncService`… viraram `Patient`, `Service`, `Appointment`, `Evolution` (`app/src/api/tipos.ts`).

### 2.3 Pastas do app
As pastas de `app/src` ganharam nomes em português e uma função cada:

| Antes | Agora |
|---|---|
| `screens/` | `telas/` |
| `componentes/*Modal.tsx` (misturados com botões e campos) | `modais/` |
| `services/api.ts`, `services/apiTypes.ts`, `config/api.ts` | `api/cliente.ts`, `api/tipos.ts`, `api/endereco.ts` |
| `services/masks.ts`, `format.ts`, `patientForm.ts` | `utils/` |
| `hooks/useClinicData.ts` | `banco/catalogos.ts` |
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
O Supabase ainda tem as tabelas `audit_log` e `meta` e a coluna `rev` nas tabelas de dados. A API não usa mais
(grava `rev = 0` porque a coluna é obrigatória). Não foram apagadas para não mexer no banco que está no ar.

---

## 4. Como cada dado fica guardado no Supabase

| Dado | Coluna | Como fica no banco | Exemplo |
|---|---|---|---|
| Telefone (paciente e clínica) | `phone` | só dígitos | `61900000000` |
| CPF / RG do paciente | `document_enc` | **cifrado** | `v1:A/whW+k…` |
| CNPJ / CPF da clínica | `cnpj` | só dígitos, dígito verificador conferido | `11222333000181` |
| E-mail | `email` | minúsculo | `maria@email.com` |
| CRP | `crp` | formato padrão | `CRP 06/123456` |
| Nome de pessoa | `name`, `guardian`, `technical_responsible` | só letras, espaços simples | `Maria da Silva` |
| Sigla da clínica | `acronym` | até 3 letras maiúsculas | `CP` |
| Nascimento, início do tratamento, data da evolução | `birth_date`, `treatment_start`, `session_date` | `DATE` (a API mostra `DD/MM/AAAA`) | `1990-02-10` |
| Data e hora da sessão | `date`, `time` | `DATE` e `TIME` (a API mostra `AAAA-MM-DD` e `HH:MM`) | `2026-11-11` · `10:30` |
| Duração / preço do serviço | `duration_min`, `price_cents` | inteiro (minutos / **centavos**) | `50` · `15000` |
| Ativo | `active` | `boolean` | `true` |
| Endereço, queixa, observações, evolução | `*_enc` | **cifrados** (AES-256-GCM) | `v1:…` |
| Senha | `password_hash` + `salt` | só o hash PBKDF2 | `pbkdf2$210000$…` |
| Criação / edição / exclusão | `created_at`, `updated_at`, `deleted_at` | `TIMESTAMPTZ` | `2026-11-11 01:23:34+00` |

As máscaras de digitação (telefone, CPF, datas, preço…) ficam em `app/src/utils/masks.ts`; a API valida as
mesmas regras em `api/src/domain/validators.ts` e `api/src/routes/schemas.ts`.

---

## 5. Como foi validado
- API: `npm run typecheck` e `npm test` (40 testes, banco PGlite em memória).
- App: `npm run typecheck`.
- Todas as chamadas que as telas fazem (pacientes, prontuário, agenda, serviços, clínica e perfil) foram testadas
  contra a API num banco de teste.
