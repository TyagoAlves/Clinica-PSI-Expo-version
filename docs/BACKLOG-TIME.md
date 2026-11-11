# Clínica Psi — estado atual e backlog por papel

Atualizado em 10/11/2026. Ambiente: ver `docs/DEV-SETUP.md`. Contrato da API: `api/API.md`.

## Arquitetura (decidida)

```
 App Expo (app/)                                    API Node.js (api/)
 ┌──────────────────────────────┐   HTTPS + Bearer      ┌───────────────────────────────┐
 │ Telas ─ AuthProvider (token  │ ── /auth, /me ──────▶ │ Express 5 + zod               │
 │        no SecureStore)       │                       │ AuthService (PBKDF2, sessões) │
 │      ─ SQLite local (cache)  │ ── POST /sync ──────▶ │ PatientService (regras, LWW)  │
 │      ─ SyncProvider (push/   │ ◀─ mudanças + rev ─── │ SQLite (node:sqlite) +        │
 │        pull, offline-first)  │                       │ campos clínicos AES-256-GCM   │
 └──────────────────────────────┘                       └───────────────────────────────┘
```

- **Offline-first:** o app grava no SQLite do aparelho (paciente fica "pendente") e sincroniza quando há
  internet (ao entrar, ao voltar a rede, ao reabrir o app, após cada alteração e a cada 60 s).
- **Conflito:** a edição mais recente (`updatedAt`) vence; exclusão vence edição antiga.
- **Login/cadastro exigem internet** (a conta mora no servidor). Depois disso o app funciona offline.
- **Logout apaga os dados clínicos do aparelho** (avisa se houver alterações não enviadas).

## Corrigido nesta rodada (problemas do app original)

| Problema | Correção |
|---|---|
| Senha guardada em texto puro (`hash_<senha>_<salt>`) | Senha só no servidor, PBKDF2-SHA256 210k iterações; app não guarda senha |
| Login aceitava senha que fosse substring do "hash" | Verificação com `timingSafeEqual` + 401 genérico + bloqueio após 5 erros |
| Login criava conta sozinho com banco vazio | Removido; testado no emulador |
| Sem sessão: clínica não ligada ao usuário, paciente com `clinicId: 1`, drawer fixo "Ana Souza" | Sessão real (token no SecureStore); clínica vinculada no servidor; drawer com dados da sessão |
| Tabela de pacientes sem a maioria dos campos do formulário | Todos os campos do modal persistidos e sincronizados |
| Painel listava pacientes de todas as clínicas | Filtra pela clínica da sessão (app) + isolamento por clínica na API (403/404) |
| Data de início fixa "08/11/2026" e profissionais fixos | Data de hoje; profissional = usuário logado |
| Barra de atalhos permitia abrir o Painel sem login | Removida; navegação guiada pela sessão |
| Rodapé "Nada é enviado para servidores" | Texto atualizado (**validar com o cliente**, ver Tyago) |

## Tyago — Front-end/Mobile & cliente

- [ ] **Validar com o Marcos Luz** a mudança de premissa: os dados agora vão para um servidor da clínica
  (o rodapé antigo dizia o contrário). Texto atual: "Os dados ficam neste aparelho e são sincronizados com
  segurança com o servidor da clínica."
- [x] Tela 7 — lista de Pacientes (busca, filtro por situação) e Tela 8 — detalhe/edição/exclusão.
- [x] Prontuário: evoluções por paciente (criar, editar, excluir), "Últimos registros" no Painel.
- [x] Modal usa o catálogo de serviços e os profissionais da clínica (vindos do servidor via sync).
- [x] Drawer: Painel e Pacientes navegam; botão voltar do Android desempilha (`src/navigation/AppNav.tsx`).
- [ ] **Validar com o cliente as telas novas** (Pacientes, Detalhe, Prontuário): foram feitas sem mock do Penpot,
  seguindo o visual existente.
- [x] Telas 7–10 do Tyago (Pacientes, Agenda, Serviços, Configurações) integradas com dados reais.
- [ ] **Tyago validar** as partes feitas sem mock: lista de sessões e modal da Agenda, modal de Serviço, textos de Configurações (ver `MUDANCAS.md` §11.3).
- [ ] Telas ainda sem mock: Aparência, Termos e privacidade (modelos LGPD), visão semanal da Agenda.
- [ ] Decidir upgrade Expo SDK 52 → 55 (a branch do Tyago está no 55; o `app/` ficou no 52).
- [ ] Migrar navegação para a Rota B (React Navigation) quando as telas acima entrarem (GUIA_03).
- [ ] Máscaras de telefone/CPF/data e seletor de data nativo no modal.
- [ ] Testes de usabilidade com o cliente (roteiro: cadastro, novo paciente offline, sincronização).
- [ ] Testes automatizados do app (Jest + @testing-library/react-native para `SyncProvider` e telas).

## Yago — Arquitetura & segurança

- [x] Serviços, evoluções (conteúdo cifrado) e membros — migração 2.
- [x] Rotação de chave: `DATA_ENCRYPTION_KEY_ID` + `DATA_ENCRYPTION_OLD_KEYS` + `npm run rotate-key`.
- [x] Auditoria LGPD (`audit_log` + `GET /clinics/:id/audit`, só dono/admin; nunca guarda conteúdo).
- [x] Banco de produção: **Supabase (PostgreSQL)**, com RLS ativa sem políticas (bloqueia a API REST automática).
- [ ] Revisar o modelo (`src/db/migrations.ts`) e hospedar a API (Render/Railway/Fly) apontando para o Supabase.
- [ ] Decidir se volta o modo offline (o `/sync` continua pronto na API).
- [ ] Guarda da chave em produção (cofre/variável do host) e política de retenção/exclusão (LGPD).
- [ ] Convite de profissionais para a clínica (hoje só o criador; `members` já lista todos).
- [ ] Criptografia do SQLite no aparelho (SQLCipher exige development build, não roda no Expo Go).
- [ ] HTTPS obrigatório em produção (proxy reverso) + `TRUST_PROXY=true`.

## Kelven — Regras de negócio, testes e integração

- [ ] **Versionamento:** o projeto virou um **monorepo** na raiz (`app/` + `api/` + `docs/` + `tools/`, branch `main`,
  histórico do `clinica` preservado) com CI em `.github/workflows/ci.yml`. Falta commitar o trabalho atual,
  criar o repositório no GitHub e fazer o primeiro push.
- [x] Paginação nas listagens (`limit/offset/search`) e no pull do `/sync` (`hasMore`). 38 testes.
- [ ] Ampliar `npm run load-test` com cenários de conflito (dois aparelhos editando o mesmo paciente).
- [ ] Testes de integração app ↔ API (rodar o SyncProvider contra a API real em CI).
- [ ] Validações extras: CPF com dígito verificador, datas futuras de nascimento, telefone BR.

## Comandos de validação

```powershell
cd C:\dev\clinica-psi\api; npm run typecheck; npm test; npm run load-test
cd C:\dev\clinica-psi\app;     npm run typecheck
node C:\dev\clinica-psi\tools\ui.mjs dump      # automação do emulador (ver DEV-SETUP.md)
```
