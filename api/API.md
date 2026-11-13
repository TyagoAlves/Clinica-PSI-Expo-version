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
| 403 `forbidden` | recurso de outra clínica |
| 404 `not_found` / `route_not_found` | não existe (ou é de outra clínica, no caso de paciente) |
| 409 `email_taken` / `already_has_clinic` / `clinic_required` | conflito de regra de negócio |
| 429 `too_many_attempts` | 5 logins errados em 15 min (IP + e-mail); header `Retry-After` |

## Públicas

### `GET /health` → `{ status, service, uptime }`
### `GET /api/v1/ping` → `{ pong, time }`

### `POST /api/v1/auth/register`
```json
{ "name": "Ana Souza", "email": "ana@clinica.com.br", "password": "min 6", "crp": "CRP 06/123456", "role": "psychologist" }
```
201 → `{ user, token, expiresAt }`. `crp` e `role` são opcionais.

### `POST /api/v1/auth/login`
`{ email, password }` → 200 `{ user, clinic | null, token, expiresAt }`

## Com login

### Sessão e perfil
| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/v1/auth/logout` | revoga o token atual → 204 |
| GET | `/api/v1/me` | `{ user, clinic \| null }` |
| PATCH | `/api/v1/me` | `{ name?, crp? }` → usuário |
| POST | `/api/v1/auth/change-password` | `{ currentPassword, newPassword }` → 204; encerra as **outras** sessões do usuário |

### Clínica
| Método | Rota | O que faz |
|---|---|---|
| POST | `/api/v1/clinics` | cria a clínica (passo 2 do cadastro) e vincula ao usuário; 409 se ele já tem uma |
| GET / PATCH | `/api/v1/clinics/:id` | lê / edita (só a clínica do próprio usuário) |
| GET | `/api/v1/clinics/:id/members` | profissionais da clínica `[{ id, name, crp, role }]` |

Campos: `name` (obrigatório), `unit, technicalResponsible, cnpj, phone, email, address, acronym`.
A sigla (`acronym`) é tirada do nome se não for enviada.

### Listagens
Devolvem `{ items, total, nextOffset }` (`nextOffset: null` = última página).
Aceitam `?limit=50&offset=0` (limite máx. 200; na agenda, 500). Pacientes e serviços aceitam `&search=` (nome contém).

Todo registro (paciente, serviço, evolução, sessão) vem com `id` (UUID), `clinicId`, `createdAt`, `updatedAt` e `deletedAt`.
**Apagar** não remove a linha: grava `deletedAt` (exclusão lógica) e o registro some das listagens.

### Pacientes
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/patients` | lista, por nome |
| POST | `/api/v1/clinics/:clinicId/patients` | cria (`name`, `phone`, `service` obrigatórios) → 201 |
| GET / PATCH / DELETE | `/api/v1/patients/:id` | lê / edita campos / apaga → 204 |

Campos: `name, phone, email, birthDate (DD/MM/AAAA), document, service, treatmentStart (DD/MM/AAAA),
status ("Em tratamento" | "Pausado" | "Alta"), professional, address, guardian, complaint, notes`.

### Evoluções (prontuário)
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/patients/:id/evolutions` | evoluções do paciente, mais recente primeiro |
| GET | `/api/v1/clinics/:clinicId/evolutions` | últimas evoluções da clínica (Painel) |
| POST | `/api/v1/patients/:id/evolutions` | `{ sessionDate: "DD/MM/AAAA", content }` → 201 (autor = usuário logado) |
| GET / PATCH / DELETE | `/api/v1/evolutions/:id` | lê / edita (`sessionDate`, `content`) / apaga |

Campos: `patientId, sessionDate, content, authorId, authorName`.

### Serviços (catálogo da clínica)
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/services` | lista, por nome |
| POST | `/api/v1/clinics/:clinicId/services` | cria → 201 (409 se o nome já existe) |
| PATCH / DELETE | `/api/v1/services/:id` | edita / apaga |

Campos: `name` (obrigatório), `description, durationMin, priceCents, active`. Preço em **centavos** (R$ 150,00 = `15000`);
`active: false` esconde o serviço dos formulários. Clínica nova já nasce com Psicoterapia, Avaliação e Acompanhamento.

### Agenda (sessões)
| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/v1/clinics/:clinicId/appointments?from=AAAA-MM-DD&to=AAAA-MM-DD&patientId=` | lista por data e hora (filtros opcionais) |
| POST | `/api/v1/clinics/:clinicId/appointments` | `{ patientId, date: "AAAA-MM-DD", time: "HH:MM", durationMin, service?, professional?, status?, notes? }` → 201 |
| GET / PATCH / DELETE | `/api/v1/appointments/:id` | lê / edita / apaga |

`status`: `Agendada` (padrão) · `Realizada` · `Cancelada` · `Faltou`.

## Criptografia
Ficam **cifrados no banco** (AES-256-GCM): do paciente `document, address, guardian, complaint, notes`; da evolução `content`;
da sessão `notes`. A chave é a `DATA_ENCRYPTION_KEY` do `.env` (gere com `npm run gen:key`). **Perder a chave = perder esses dados.**

## Limitações conhecidas
- O limite de tentativas de login fica na memória: com várias instâncias da API, precisaria ir para o banco.
- Só quem criou a clínica faz parte dela (não há convite de novos profissionais).
