# clinica-api — referência dos endpoints (v1)

Base: `http://<host>:3333`. JSON em UTF-8. Erros sempre no formato:

```json
{ "error": { "code": "validation_error", "message": "Informe o nome.", "issues": [{ "path": "name", "message": "..." }] } }
```

Autenticação: `Authorization: Bearer <token>` (token opaco devolvido em register/login; validade `SESSION_TTL_DAYS`).

| Código | Quando |
|---|---|
| 400 `validation_error` / `invalid_param` / `invalid_json` | entrada inválida |
| 401 `unauthenticated` / `session_expired` / `invalid_credentials` | sem token, token vencido/revogado, login errado |
| 403 `forbidden` | recurso de outra clínica |
| 404 `not_found` / `route_not_found` | não existe (ou é de outra clínica, no caso de paciente) |
| 409 `email_taken` / `already_has_clinic` / `clinic_required` | conflito de regra de negócio |
| 429 `too_many_attempts` | 5 logins errados em 15 min (IP + e-mail); header `Retry-After` |

## Públicos

### `GET /health` → `{ status, service, uptime }`
### `GET /api/v1/ping` → `{ pong, time }`

### `POST /api/v1/auth/register`
```json
{ "name": "Ana Souza", "email": "ana@clinica.com.br", "password": "min 6", "crp": "CRP 06/123456", "role": "psychologist" }
```
201 → `{ user, token, expiresAt }`. `crp` e `role` opcionais.

### `POST /api/v1/auth/login`
`{ email, password }` → 200 `{ user, clinic | null, token, expiresAt }`

## Autenticados

### `POST /api/v1/auth/logout` → 204 (revoga o token atual)
### `GET /api/v1/me` → `{ user, clinic | null }`

### `POST /api/v1/clinics` (passo 2 do cadastro)
```json
{ "name": "Clínica Psi", "unit": "Unidade Pinheiros", "technicalResponsible": "...", "cnpj": "12.345.678/0001-90",
  "phone": "(11) 3000-0000", "email": "contato@clinica.com.br", "address": "...", "acronym": "CP" }
```
Só `name` é obrigatório. Vincula o usuário logado. `acronym` é derivada do nome se omitida. 409 se o usuário já tem clínica.

### `GET /api/v1/clinics/:id` · `PATCH /api/v1/clinics/:id`
Só a clínica do próprio usuário.

### `GET /api/v1/clinics/:id/members` → `[{ id, name, crp, role }]`
Profissionais da clínica (alimenta "Profissional responsável").

### `GET /api/v1/clinics/:id/audit?limit&offset` → página de `{ at, userId, action, entity, entityId, ip }`
Trilha LGPD: leituras, listagens, criações, edições, exclusões e syncs de dado clínico. Nunca guarda conteúdo.
Só o dono da clínica (quem a criou) ou usuário `admin`; demais recebem 403.

### Paginação
Listagens aceitam `?limit=50&offset=0` (limit máx. 200) e devolvem `{ items, total, nextOffset }`
(`nextOffset: null` = última página). Pacientes e serviços aceitam `&search=` (nome contém).

### Pacientes
| Método | Rota | Corpo / resposta |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/patients` | página de ativos, por nome |
| POST | `/api/v1/clinics/:clinicId/patients` | campos abaixo; `name`, `phone`, `service` obrigatórios → 201 |
| GET | `/api/v1/patients/:id` | paciente |
| PATCH | `/api/v1/patients/:id` | campos parciais |
| DELETE | `/api/v1/patients/:id` | soft delete → 204 |

Campos do paciente: `name, phone, email, birthDate (DD/MM/AAAA), document, service, treatmentStart (DD/MM/AAAA),
status ("Em tratamento" | "Pausado" | "Alta"), professional, address, guardian, complaint, notes`.
Respostas incluem `id (UUID), clinicId, createdAt, updatedAt, deletedAt, rev`.

**Cifrados em repouso (AES-256-GCM):** paciente `document, address, guardian, complaint, notes`; evolução `content`.

### Evoluções (prontuário)
| Método | Rota | Corpo / resposta |
|---|---|---|
| GET | `/api/v1/patients/:id/evolutions` | página, mais recente primeiro |
| POST | `/api/v1/patients/:id/evolutions` | `{ sessionDate: "DD/MM/AAAA", content }` → 201 (autor = usuário logado) |
| GET / PATCH / DELETE | `/api/v1/evolutions/:id` | lê / edita (`sessionDate`, `content`) / soft delete |

Campos: `id, clinicId, patientId, sessionDate, content, authorId, authorName, createdAt, updatedAt, deletedAt, rev`.

### Serviços (catálogo da clínica)
| Método | Rota | Corpo / resposta |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/services` | página por nome |
| POST | `/api/v1/clinics/:clinicId/services` | `{ name }` → 201 (409 se nome repetido) |
| PATCH / DELETE | `/api/v1/services/:id` | renomeia / soft delete |

Clínica nova já nasce com Psicoterapia, Avaliação e Acompanhamento.

### `POST /api/v1/sync` — sincronização offline-first
```json
{ "lastPulledRev": 42,
  "changes": { "patients": [ ... ], "services": [ ... ], "evolutions": [ ... ] } }
```
Cada item: campos da entidade + `id` (UUID gerado no app), `createdAt`, `updatedAt`, `deletedAt`.
Resposta: `{ "rev": 57, "hasMore": false, "changes": { "patients": [], "services": [], "evolutions": [] }, "rejected": ["<id>"] }`

1. **Push:** grava se não existir ou se `updatedAt` for mais novo que o do servidor (última edição vence).
   Exclusão vence edição antiga. IDs de outra clínica e evoluções de paciente de outra clínica são rejeitados.
   Autor de evolução é preservado em edições. Máx. 500 itens por tipo.
2. **Pull:** tudo da clínica com `rev > lastPulledRev` (inclusive removidos), no máx. 500 por chamada.
   Se `hasMore: true`, chame de novo com `lastPulledRev = rev` até `hasMore: false`.

### Agenda — sessões
| Método | Rota | Corpo / resposta |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/appointments?from=AAAA-MM-DD&to=AAAA-MM-DD` | página ordenada por data/hora |
| POST | `/api/v1/clinics/:clinicId/appointments` | `{ patientId, date: "AAAA-MM-DD", time: "HH:MM", durationMin, service?, professional?, status?, notes? }` → 201 |
| GET / PATCH / DELETE | `/api/v1/appointments/:id` | lê / edita / soft delete |

`status`: `Agendada` (padrão) · `Realizada` · `Cancelada` · `Faltou`. `notes` é cifrado em repouso. Sincroniza pelo `/sync` como `changes.appointments`.

### Perfil e senha
- `PATCH /api/v1/me` — `{ name?, crp? }` → usuário público.
- `POST /api/v1/auth/change-password` — `{ currentPassword, newPassword }` → 204; encerra as **outras** sessões do usuário.

### Serviços — campos
`{ name, description, durationMin, priceCents, active }` — preço em **centavos**; `active: false` esconde dos formulários.

## Criptografia e rotação de chave
`.env`: `DATA_ENCRYPTION_KEY` (atual), `DATA_ENCRYPTION_KEY_ID` (prefixo gravado, ex. `v2`) e
`DATA_ENCRYPTION_OLD_KEYS` (`v1=<base64>;...`, só para decifrar). Rotação: `npm run gen:key` → mover a chave
atual para OLD_KEYS → nova chave/ID → `npm run rotate-key` (re-cifra tudo) → remover a antiga quando der "0 restantes".

## Pendências conhecidas (backlog)
- Rate limit e sessões em memória/SQLite: com várias instâncias, mover para Redis/Postgres.
- Convite de novos profissionais para a clínica (hoje só o criador; `members` já lista todos).
- Telas/endpoints de Agenda, Configurações e Termos LGPD.
