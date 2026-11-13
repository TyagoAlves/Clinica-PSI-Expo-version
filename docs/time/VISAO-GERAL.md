# Clínica Psi — Visão geral

Mapa do projeto: como as partes se ligam e **onde está cada coisa**.
Como rodar: [`DEV-SETUP.md`](DEV-SETUP.md) · Banco e API em detalhe: [`04-BANCO-DE-DADOS.md`](../04-BANCO-DE-DADOS.md)

---

## 1. Arquitetura

O app é **online**: não guarda pacientes no celular. Toda leitura e gravação passa pela API, que fala com o Supabase.

```text
app/ (Expo SDK 52)                         api/ (Node 24 + Express 5)              Supabase
 Telas                                      routes   → valida a requisição
  └ bancoDados.ts ── HTTP + token ──▶       services → regras e "é da sua clínica?"
 AuthProvider (token no SecureStore)        repositories → monta o SQL         ──▶  PostgreSQL
 ConexaoProvider (internet, "Atualizar")    campos clínicos cifrados (AES-256)
```

O celular guarda só o **token do login** (no SecureStore, a área segura do aparelho).

---

## 2. App — `app/`

| O quê | Arquivo |
|---|---|
| **Falar com o banco** (CRUD + hook `useDados`) | `app/src/banco/bancoDados.ts` |
| Login, cadastro, sessão e logout | `app/src/login/AuthProvider.tsx` |
| Estado da conexão, profissionais da clínica, "Atualizar agora" | `app/src/conexao/ConexaoProvider.tsx` |
| Cliente HTTP (timeout, token, erros) | `app/src/api/cliente.ts` |
| Tipos dos dados (iguais aos da API) | `app/src/api/tipos.ts` |
| Endereço da API (`10.0.2.2:3333` no emulador) | `app/src/api/endereco.ts` |
| Máscaras de telefone, CPF, datas, preço | `app/src/utils/masks.ts` |
| Navegação entre telas e botão voltar | `app/src/navegacao/AppNav.tsx`, `app/App.tsx` |
| Cores e estilos compartilhados | `app/src/theme.ts` |

### Telas

| Tela | Arquivo | O que faz |
|---|---|---|
| Login | `telas/LoginScreen.tsx` | Entra com e-mail e senha |
| Cadastro 1 e 2 | `telas/CadastroPasso1Screen.tsx`, `CadastroPasso2Screen.tsx` | Cria a conta e depois a clínica |
| Painel | `telas/PainelScreen.tsx` | Resumo: pacientes recentes, sessões de hoje, últimas evoluções, pacientes por serviço |
| Pacientes | `telas/PacientesScreen.tsx` | Lista com busca e filtro por situação |
| Detalhe do paciente | `telas/PacienteScreen.tsx` | Dados, evoluções (prontuário) e sessões |
| Agenda | `telas/AgendaScreen.tsx` | Sessões do dia: agendar, editar, excluir |
| Serviços | `telas/ServicosScreen.tsx` | Catálogo da clínica, ativar/desativar |
| Configurações | `telas/ConfiguracoesScreen.tsx` | Clínica, meu acesso, exportar dados, sair |

Formulários (em `modais/`): `NovoPacienteModal`, `EvolucaoModal`, `SessaoModal`, `ServicoModal`, `ClinicaModal`, `PerfilModal`.
Diagnóstico (botão ⟳ do Painel): `DatabaseDebugModal`.

---

## 3. API — `api/`

Camadas: **routes → services → repositories → banco**.

| O quê | Arquivo |
|---|---|
| Início do servidor (lê o `.env`, conecta no banco) | `api/src/server.ts`, `api/src/app.ts` |
| Leitura e validação do `.env` | `api/src/config/env.ts` |
| **Todas as rotas** | `api/src/routes/index.ts` |
| Validação dos dados recebidos (zod) | `api/src/routes/schemas.ts` |
| Login por token (Bearer) | `api/src/middleware/auth.ts`, `api/src/services/auth.ts` |
| Hash de senha (PBKDF2) | `api/src/services/password.ts` |
| Bloqueio após 5 logins errados | `api/src/security/loginRateLimiter.ts` |
| Criptografia dos campos clínicos | `api/src/security/fieldCipher.ts` |
| Clínica e profissionais | `api/src/services/clinic.ts` |
| Pacientes, serviços, evoluções e sessões | `api/src/services/records.ts` |
| **SQL** (um repositório genérico para as 4 tabelas) | `api/src/repositories/postgres.ts` |
| Criação das tabelas | `api/src/db/migrations.ts` |
| Testes (40, com PGlite: PostgreSQL em memória) | `api/test/*.test.ts` |

---

## 4. Segurança (resumo)

- **Senha:** só o hash fica no banco (PBKDF2, 210 mil rodadas).
- **Login:** token aleatório; o banco guarda só o hash dele. 5 erros em 15 min bloqueiam o login.
- **Uma clínica não vê a outra:** toda rota confere a clínica do usuário logado.
- **Campos clínicos cifrados:** documento, endereço, responsável, queixa, observações, evoluções e observações da sessão.
- **Supabase com RLS ligado e sem regras:** só a nossa API acessa os dados.
