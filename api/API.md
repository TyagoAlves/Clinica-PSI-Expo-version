# API da Clínica Psi — rotas (v1)

Banco: **PostgreSQL no Supabase** (`DATABASE_URL`). Tabelas com RLS ativa e sem políticas: só esta API acessa os dados.

Base: `http://<host>:3333`. JSON em UTF-8. Erros sempre no formato:

```json
{ "error": { "code": "validation_error", "message": "Informe o nome.", "issues": [{ "path": "name", "message": "..." }] } }
```

Autenticação: `Authorization: Bearer <token>` (token devolvido no cadastro e no login; validade em `SESSION_TTL_DAYS`).

| Código | Quando |
|---|---|
| 400 `validation_error` / `invalid_param` / `invalid_json` | entrada inválida |
| 401 `unauthenticated` / `session_expired` / `invalid_credentials` | sem token, token vencido ou revogado, login errado |
| 403 `forbidden` | lista de outra clínica |
| 404 `not_found` / `route_not_found` | não existe (ou é de outra clínica) |
| 409 `email_taken` | e-mail já cadastrado |
| 429 `too_many_attempts` | 5 logins errados em 15 min (IP + e-mail); header `Retry-After` |

## Criar conta

O app **não tem tela de cadastro**. Para criar uma conta (usuário + clínica), dentro da pasta `api`:

```powershell
npm run criar-conta -- "Ana Souza" ana@clinica.com.br minhasenha "Clínica Psi"
```

O script usa o banco do `api/.env`. Também dá para criar pela rota `POST /api/v1/auth/register` (abaixo).

## Públicas

### `GET /health` → `{ status, service, uptime }`
### `GET /api/v1/ping` → `{ pong, time }`

### `POST /api/v1/auth/register`
```json
{ "name": "Ana Souza", "email": "ana@clinica.com.br", "password": "min 6", "clinicName": "Clínica Psi" }
```
201 → `{ user, clinic, token, expiresAt }`. Cria o usuário **e** a clínica dele.
`clinicName` é opcional (padrão: "Clínica Psi"); a sigla da clínica sai do nome.

### `POST /api/v1/auth/login`
`{ email, password }` → 200 `{ user, clinic, token, expiresAt }`

## Com login

| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/v1/auth/logout` | revoga o token atual → 204 |
| GET | `/api/v1/me` | `{ user, clinic }` |

### Listagens
Devolvem `{ items, total, nextOffset }` (`nextOffset: null` = última página).
Aceitam `?limit=50&offset=0` (limite máx. 200; na agenda, 500). Pacientes aceitam `&search=` (nome contém).

Todo registro (paciente, sessão) vem com `id` (UUID), `clinicId`, `createdAt`, `updatedAt` e `deletedAt`.
**Apagar** não remove a linha: grava `deletedAt` (exclusão lógica) e o registro some das listagens.

### Pacientes
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/patients` | lista, por nome |
| POST | `/api/v1/clinics/:clinicId/patients` | cria (só `name` é obrigatório) → 201 |
| GET / PATCH / DELETE | `/api/v1/patients/:id` | lê / edita campos / apaga → 204 |

Campos: `name` (nome completo), `service` (ex.: "Psicoterapia"), `treatmentStart` (início do tratamento, DD/MM/AAAA),
`complaint` (descrição / queixa principal).

### Agenda (sessões)
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/appointments?from=AAAA-MM-DD&to=AAAA-MM-DD` | lista por data e hora (filtros opcionais) |
| POST | `/api/v1/clinics/:clinicId/appointments` | `{ patientId, date: "AAAA-MM-DD", time: "HH:MM", durationMin, service?, notes? }` → 201 |
| GET / PATCH / DELETE | `/api/v1/appointments/:id` | lê / edita / apaga |

O paciente da sessão precisa ser da mesma clínica (senão, 404).

## Criptografia
Ficam **cifrados no banco** (AES-256-GCM): a `complaint` do paciente e as `notes` da sessão.
A chave é a `DATA_ENCRYPTION_KEY` do `.env` (gere com `npm run gen:key`). **Perder a chave = perder esses dados.**

## Limitações conhecidas
- O limite de tentativas de login fica na memória: com várias instâncias da API, precisaria ir para o banco.
- Só quem criou a clínica faz parte dela (não há convite de novos profissionais).
- O banco ainda tem tabelas e colunas da versão completa (serviços, evoluções, telefone, situação…). Esta versão não usa.
