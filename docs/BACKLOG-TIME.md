# Clínica Psi — o que falta e quem cuida

Atualizado em 13/11/2026. Mapa do projeto: [`VISAO-GERAL.md`](VISAO-GERAL.md) · Rotas da API: [`../api/API.md`](../api/API.md)

## Estado atual

- App **online**: telas → `bancoDados.ts` → API Node.js → Supabase. O celular guarda só o token do login.
- Funciona: login, cadastro (conta + clínica), Painel, Pacientes, Detalhe com prontuário e sessões, Agenda,
  Serviços e Configurações (clínica, meu acesso, troca de senha, exportar dados, sair).
- API com 40 testes passando; app e API sem erros de tipo.

## Antes da apresentação

- [ ] Abrir o app no emulador e passar por todas as telas depois da última rodada de mudanças.
- [ ] Decidir se a barra de status preta no emulador precisa de ajuste.
- [ ] Criar uma conta de demonstração no Supabase com alguns pacientes, sessões e evoluções.

## Tyago — Front-end/Mobile e cliente

- [ ] **Validar com o cliente (Marcos Luz)** que os dados ficam num servidor (Supabase) e não só no celular.
  Dado de saúde é dado sensível pela LGPD.
- [ ] Telas sem protótipo ainda: **Aparência** e **Termos e privacidade** (hoje mostram "em breve").
- [ ] Seletor de data nativo nos formulários (hoje as datas são digitadas, com máscara).
- [ ] Decidir upgrade do Expo SDK 52 → 55.

## Yago — Back-end e arquitetura

- [ ] Hospedar a API (Render, Railway ou Fly) apontando para o Supabase, com HTTPS e `TRUST_PROXY=true`.
- [ ] Guardar a chave de criptografia num cofre/variável do servidor em produção.
- [ ] Convite de outros profissionais para a mesma clínica (hoje só o criador).
- [ ] Opcional: apagar do Supabase as sobras `audit_log`, `meta` e a coluna `rev` (ver `MUDANCAS.md` §3.1).

## Kelven — Regras de negócio, testes e integração

- [ ] Criar o repositório no GitHub e fazer o primeiro push (a CI já está em `.github/workflows/ci.yml`).
- [ ] Testes automáticos do app (Jest + @testing-library/react-native).
- [ ] Ligar o serviço do paciente à tabela de serviços por `id` (hoje é guardado o **nome** do serviço).

## Comandos de validação

```powershell
cd api; npm run typecheck; npm test
cd app; npm run typecheck
```
