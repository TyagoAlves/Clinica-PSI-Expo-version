# Ambiente de desenvolvimento — Clínica Psi (Windows)

Pasta desta versão: `D:\dev\Clinica-PSI-Escopo-Reduzido`. Os comandos abaixo partem dela.

```text
Clinica-PSI-Escopo-Reduzido
├── app/                      app mobile (Expo SDK 52 · React Native 0.76 · TypeScript)
├── api/                      API REST (Node.js · Express 5 · TS · zod · PostgreSQL/Supabase · vitest)
├── docs/
│   ├── 01-O-PROJETO.md … 06-CSS.md   tutoriais (para qualquer pessoa)
│   ├── time/
│   │   ├── VISAO-GERAL.md    mapa técnico do projeto
│   │   ├── DEV-SETUP.md      este arquivo
│   │   ├── MUDANCAS.md       o que foi simplificado
│   │   └── BACKLOG-TIME.md   o que falta, por pessoa
│   ├── guias/Tela 1..10/     guias originais do Tyago (históricos)
│   └── screenshots/          capturas do emulador
├── tools/                    emulador.ps1 · screenshot.ps1 · logcat.ps1 · ui.mjs (automação)
└── .github/workflows/ci.yml  CI: API (typecheck, testes, build) + app (typecheck)
```
O detalhe das pastas dentro de `app/src` e `api/src` está no [`README.md`](../../README.md#pastas).

## Ferramentas instaladas

| Ferramenta | Versão / local |
|---|---|
| Node.js / npm | 24.x / 11.x |
| JDK | Temurin 17 — `%LOCALAPPDATA%\Programs\Java\jdk-17.0.21+9` (`JAVA_HOME`) |
| Android SDK | `C:\Android\Sdk` (`ANDROID_HOME`): cmdline-tools, platform-tools (adb), emulator, platforms/android-35, system-images/android-35/google_apis/x86_64 |
| AVD | `ClinicaPsi_API35` (Pixel, Android 15, x86_64) |
| Expo Go | instalado automaticamente no emulador pelo `expo start --android` |

O `PATH` do usuário tem: `JDK\bin`, `Sdk\platform-tools`, `Sdk\emulator`, `Sdk\cmdline-tools\latest\bin`.
Terminais abertos **antes** da configuração não enxergam essas variáveis: abra um novo.

> O SDK fica em `C:\Android\Sdk` e não em `%LOCALAPPDATA%\Android\Sdk` porque o app desktop do Claude
> grava em `AppData\Local` dentro de uma área virtualizada, invisível para os outros programas.

## Subir tudo (3 terminais)

**1. API**
```powershell
cd api
npm run dev          # recarrega sozinha a cada alteração em src/
```
Responde em `http://127.0.0.1:3333/health` (no PC) e `http://10.0.2.2:3333/health` (no emulador).

**2. Emulador**
```powershell
powershell -ExecutionPolicy Bypass -File tools\emulador.ps1
```

**3. App**
```powershell
cd app
npx expo start --android     # abre o Expo Go no emulador; Fast Refresh ativo
```
No terminal do Expo: `r` recarrega, `j` abre o debugger, `m` abre o menu de dev.
Se aparecer "Expo Go … is recommended… Install? (Y/n)", responda `Y`.

Alternativa sem prompt e **sem depender do IP da rede** (recomendado no emulador):
```powershell
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081 host.exp.exponent
```

## Como o app acha a API

`app/src/api/endereco.ts`:
- Android (emulador) → `http://10.0.2.2:3333`
- iOS Simulator / web → `http://localhost:3333`
- Celular físico → crie `app/.env` com `EXPO_PUBLIC_API_URL=http://<IP-do-PC>:3333`
  e suba a API com `HOST=0.0.0.0` em `api/.env` (o Windows pedirá liberação no firewall).

Diagnóstico no app: Painel → botão **⟳** → sessão, conexão com a API e pacientes no servidor.
Código: `src/banco/bancoDados.ts` (dados), `src/api/cliente.ts` (HTTP), `src/login/AuthProvider.tsx` (sessão),
`src/conexao/ConexaoProvider.tsx` (estado da conexão).

## API e banco

Rotas em `api/API.md`. Primeira vez: copie `api\.env.example` para `api\.env`, rode
`npm run gen:key` (cole em `DATA_ENCRYPTION_KEY`) e cole a **`DATABASE_URL`** do Supabase
(painel → **Connect** → Connection string → URI → **Session pooler**; troque `[YOUR-PASSWORD]`).
As tabelas são criadas sozinhas na primeira subida da API. Os testes usam PGlite e **não tocam no Supabase**.

O app é **online**: sem a API no ar ou sem internet, as telas mostram erro.

## Validação (rodar após cada alteração)

```powershell
cd api; npm run typecheck; npm test
cd app; npm run typecheck
```

## Inspeção do emulador

```powershell
# screenshot -> docs\screenshots\<nome>.png
powershell -ExecutionPolicy Bypass -File tools\screenshot.ps1 -Nome login
# logs do JS (console.log) + crashes nativos
powershell -ExecutionPolicy Bypass -File tools\logcat.ps1
# automação pela árvore da UI (dump | tap <texto> | type <rótulo> <valor> | shot <nome>)
node tools\ui.mjs tap "Entrar"
node tools\ui.mjs type "E-mail" "ana@clinica.com.br"
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
- O Expo **web** não abre o app: o login usa o SecureStore, que só existe no Android/iOS.
- A barra de status (relógio) pode aparecer preta no emulador; ainda não investigado.
