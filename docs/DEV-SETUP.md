# Ambiente de desenvolvimento — Clínica Psi (Windows)

Pasta de trabalho: `C:\dev\clinica-psi` (fora do OneDrive, para o `node_modules` não ser sincronizado).

Um único repositório git (monorepo) na raiz — ver `README.md`.

```
C:\dev\clinica-psi
├── app/                      app mobile (Expo SDK 52 · React Native 0.76 · TypeScript) — histórico do HighestCoder/clinica preservado
├── api/                      API REST (Node.js · Express 5 · TS · zod · SQLite node:sqlite · vitest)
├── docs/
│   ├── guias/Tela 1..6/      guias e mocks do Penpot por tela (cópia única)
│   ├── DEV-SETUP.md          este arquivo
│   ├── BACKLOG-TIME.md       estado atual + tarefas por papel (Tyago, Yago, Kelven)
│   ├── MUDANCAS.md           registro de tudo o que foi alterado
│   └── screenshots/          capturas do emulador
├── tools/                    emulador.ps1 · screenshot.ps1 · logcat.ps1 · ui.mjs (automação)
├── .github/workflows/ci.yml  CI: API (testes, build, carga) + app (typecheck)
└── Clinica-PSI-Expo-version/ protótipo antigo do Tyago (repo próprio, ignorado pelo git; só referência)
```

## Ferramentas instaladas

| Ferramenta | Versão / local |
|---|---|
| Node.js / npm | 24.x / 11.x (já existiam) |
| JDK | Temurin 17 — `%LOCALAPPDATA%\Programs\Java\jdk-17.0.21+9` (`JAVA_HOME`) |
| Android SDK | `C:\Android\Sdk` (`ANDROID_HOME`) — cmdline-tools, platform-tools (adb), emulator, platforms/android-35, system-images/android-35/google_apis/x86_64 |
| AVD | `ClinicaPsi_API35` (Pixel, Android 15, x86_64) |
| Expo Go | instalado automaticamente no emulador pelo `expo start --android` |

`PATH` do usuário recebeu: `JDK\bin`, `Sdk\platform-tools`, `Sdk\emulator`, `Sdk\cmdline-tools\latest\bin`.
Terminais abertos **antes** da configuração não enxergam essas variáveis — abra um novo.

> O SDK fica em `C:\Android\Sdk` e não em `%LOCALAPPDATA%\Android\Sdk` porque o app desktop do Claude
> grava em `AppData\Local` dentro de uma área virtualizada, invisível para os outros programas.

## Subir tudo (3 terminais)

**1. API**
```powershell
cd C:\dev\clinica-psi\api
npm run dev          # tsx watch: recarrega a cada alteração em src/
```
Responde em `http://127.0.0.1:3333/health` (no PC) e `http://10.0.2.2:3333/health` (no emulador).

**2. Emulador**
```powershell
powershell -ExecutionPolicy Bypass -File C:\dev\clinica-psi\tools\emulador.ps1
```

**3. App**
```powershell
cd C:\dev\clinica-psi\app
npx expo start --android     # abre o Expo Go no emulador; Fast Refresh ativo
```
No terminal do Expo: `r` recarrega, `j` abre o debugger, `m` abre o menu de dev.
Se aparecer "Expo Go 2.32.20 is recommended… Install? (Y/n)", responda `Y` (é só um patch do Expo Go).

Alternativa sem prompt e **sem depender do IP da rede** (recomendado no emulador):
```powershell
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent
```

## Como o app acha a API

`app/src/config/api.ts`:
- Android (emulador) → `http://10.0.2.2:3333`
- iOS Simulator / web → `http://localhost:3333`
- Celular físico → crie `app/.env` com `EXPO_PUBLIC_API_URL=http://<IP-do-PC>:3333`
  e suba a API com `HOST=0.0.0.0` em `api/.env` (o Windows pedirá liberação no firewall).

Diagnóstico no app: Painel → botão **⟳** → Sessão, Conexão com a API, Sincronização, Pacientes no aparelho.
Código: `src/services/api.ts` (cliente), `src/auth/AuthProvider.tsx` (sessão), `src/sync/SyncProvider.tsx` (sync).

## API

Contrato completo em `api/API.md`. Primeira vez: copie `.env.example` para `.env`, rode
`npm run gen:key` (cole em `DATA_ENCRYPTION_KEY`) e cole a **`DATABASE_URL`** do Supabase
(painel → **Connect** → Connection string → URI → **Session pooler**; troque `[YOUR-PASSWORD]`).
As tabelas são criadas sozinhas na primeira subida da API. Testes usam PGlite (não tocam no Supabase).
O app é **online**: sem a API no ar ou sem internet, as telas mostram erro. Arquitetura e backlog por papel: `BACKLOG-TIME.md`.

## Validação (rodar após cada alteração)

```powershell
cd C:\dev\clinica-psi\api; npm run typecheck; npm test; npm run load-test
cd C:\dev\clinica-psi\app;     npm run typecheck
```

## Inspeção do emulador

```powershell
# screenshot -> docs\screenshots\<nome>.png
powershell -ExecutionPolicy Bypass -File C:\dev\clinica-psi\tools\screenshot.ps1 -Nome login
# logs do JS (console.log) + crashes nativos
powershell -ExecutionPolicy Bypass -File C:\dev\clinica-psi\tools\logcat.ps1
# automação pela árvore da UI (dump | tap <texto> | type <rótulo> <valor> | shot <nome>)
node C:\dev\clinica-psi\tools\ui.mjs tap "Entrar"
node C:\dev\clinica-psi\tools\ui.mjs type "E-mail" "ana@clinica.com.br"
# testar offline
adb shell cmd connectivity airplane-mode enable    # (disable para voltar)
# interação manual
adb shell input tap 540 1200          # toque (coordenadas em pixels da tela)
adb shell input text "ana@clinica.com.br"
adb shell input keyevent 4            # voltar (66 = enter)
adb shell uiautomator dump /sdcard/ui.xml; adb pull /sdcard/ui.xml   # árvore da UI com coordenadas
```
No Git Bash, prefixe comandos `adb` que usam `/sdcard/...` com `MSYS_NO_PATHCONV=1`
(senão o Git Bash converte o caminho para `C:/Program Files/Git/sdcard`).

## Problemas conhecidos

- `npm` 11 bloqueia o `postinstall` do `esbuild` (aviso "install-scripts"); o `tsx` funciona assim
  mesmo porque usa o binário pré-compilado `@esbuild/win32-x64`.
- `tools/ui.mjs type` usa "o primeiro campo depois do rótulo": em linhas com 2 campos lado a lado (Data | Horário) ele erra; toque pela coordenada.
- `adb input text` não digita acentos; ESC (keyevent 111) dentro de um modal fecha o modal (é o "voltar").
- Se o Gboard do emulador abrir o tutorial de caneta: `adb shell settings put secure stylus_handwriting_enabled 0`.
- Expo web não abre o banco local (expo-sqlite no navegador exige configuração WASM); o alvo é Android/iOS.
