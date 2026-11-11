# Clínica Psi — Prontuário psicológico

App mobile (Expo / React Native) para psicólogos e clínicas: pacientes, prontuário, agenda e serviços.
O app fala com uma API Node.js, que guarda tudo no **Supabase (PostgreSQL)**.

## Estrutura

| Pasta | O que é |
|---|---|
| [`app/`](app) | App mobile — Expo SDK 52, React Native 0.76, TypeScript (online: lê/grava via API) |
| [`api/`](api) | API REST — Node.js 24, Express 5, TypeScript, **PostgreSQL no Supabase**. Contrato em [`api/API.md`](api/API.md) |
| [`docs/guias/`](docs/guias) | Guias e mocks do Penpot por tela (`Tela 1` … `Tela 10`, GUIA_01 a GUIA_14) + `ESTADO_FINAL_COMPLETO.md` do Tyago |
| [`docs/VISAO-GERAL.md`](docs/VISAO-GERAL.md) | **Comece por aqui:** antes × agora e onde está cada coisa |
| [`docs/DEV-SETUP.md`](docs/DEV-SETUP.md) | Como montar o ambiente e subir tudo (API, emulador, app) |
| [`docs/BACKLOG-TIME.md`](docs/BACKLOG-TIME.md) | Estado atual e tarefas por pessoa (Tyago, Yago, Kelven) |
| [`docs/MUDANCAS.md`](docs/MUDANCAS.md) | Registro de tudo o que foi alterado e o que falta |
| [`docs/screenshots/`](docs/screenshots) | Capturas do app no emulador |
| [`tools/`](tools) | Scripts: emulador, screenshot, logcat e automação da interface (`ui.mjs`) |
| `Clinica-PSI-Expo-version/` | Protótipo antigo (repo próprio do Tyago). Ignorado pelo git; só referência |

## Subir o projeto (3 terminais)

```powershell
# 1. API  (primeira vez: copie api\.env.example para api\.env, rode "npm run gen:key"
#    e cole a DATABASE_URL do Supabase: Connect → Session pooler)
cd C:\dev\clinica-psi\api; npm install; npm run dev

# 2. Emulador Android
powershell -ExecutionPolicy Bypass -File C:\dev\clinica-psi\tools\emulador.ps1

# 3. App
cd C:\dev\clinica-psi\app; npm install; npx expo start --android
```

Se o app não carregar no emulador (IP da rede mudou), use `adb reverse tcp:8081 tcp:8081` e abra `exp://127.0.0.1:8081`.

## Validar

```powershell
cd C:\dev\clinica-psi\api; npm run typecheck; npm test; npm run load-test
cd C:\dev\clinica-psi\app; npm run typecheck
```

## Time

- **Tyago** — front-end/mobile e contato com o cliente
- **Yago** — back-end e arquitetura
- **Kelven** — back-end, testes e integração

Detalhes de ambiente e solução de problemas: [`docs/DEV-SETUP.md`](docs/DEV-SETUP.md).
