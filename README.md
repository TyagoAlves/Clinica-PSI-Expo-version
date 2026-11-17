# Clínica Psi — Prontuário psicológico (versão para apresentação)

App (Expo / React Native) para psicólogos e clínicas: pacientes e agenda de sessões.
Esta é a versão **unificada do time**: telas do Tyago, banco SQLite do Yago e ponto de entrada (`index.js` / `App.tsx`) do Kelven.

```text
Telas do app (App.tsx)  →  bancoDados.js  →  servidor.js (porta 3333)  →  SQLite (app/data/clinica.db)
```

Não precisa de internet nem de conta em nuvem: o banco é um arquivo local, criado sozinho na primeira vez que o servidor sobe
(já com 3 pacientes e 2 seções de exemplo).

## Quem fez o quê

| Parte | Responsável | Arquivos |
|---|---|---|
| Front-end (telas e visual) | **Tyago** | `app/src/telas/**` · [`app/DOCUMENTACAO_CSS.md`](app/DOCUMENTACAO_CSS.md) |
| Banco de dados (SQLite) | **Yago** | `app/src/banco/bancoDados.js`, `app/src/banco/servidor.js` · [`app/DOCUMENTACAO_BANCO_SQLITE.md`](app/DOCUMENTACAO_BANCO_SQLITE.md) |
| Ponto de entrada e integração | **Kelven** | `app/index.js`, `app/App.tsx` |

## Pastas

```text
Projeto - Merge/
├── README.md
├── app/
│   ├── index.js            registra o App como raiz (Kelven)
│   ├── App.tsx             escolhe a tela e chama o banco (Kelven + lógica de banco do Yago)
│   ├── .env.example        porta do servidor e caminho do banco (copie para .env se quiser mudar)
│   ├── src/
│   │   ├── telas/          TelaLogin, TelaHome, Paciente/*, Agenda/* (Tyago)
│   │   └── banco/          bancoDados.js (cliente HTTP) e servidor.js (servidor + SQLite) (Yago)
│   └── data/clinica.db     criado automaticamente (fora do git)
├── docs/                   tutoriais e guias das telas
├── tools/                  scripts do emulador (abrir, screenshot, logs)
└── .github/workflows/      CI: typecheck do app + criação das tabelas do SQLite
```

## Subir o projeto

```powershell
cd app
npm install

# Opção 1: servidor + app no navegador, num comando só
npm run dev

# Opção 2: em dois terminais
npm run servidor        # terminal 1: servidor SQLite em http://localhost:3333
npx expo start --web    # terminal 2: app no navegador (ou --android)
```

**Login:** `admin@clinica.com.br` / `123456` (usuário fixo, criado na primeira vez que o servidor sobe; troque em `app/.env`, veja `app/.env.example`).
Sem login, o servidor recusa os dados (`401`).

Teste rápido do servidor: abra http://localhost:3333/health (pública). `/pacientes` e `/secoes` exigem login.

### Emulador Android

O `bancoDados.js` usa `127.0.0.1:3333` fora do navegador. Dentro do emulador, `127.0.0.1` é o próprio emulador,
então redirecione a porta para o seu PC antes de abrir o app:

```powershell
powershell -ExecutionPolicy Bypass -File tools\emulador.ps1
adb reverse tcp:3333 tcp:3333
cd app; npx expo start --android
```

Se o app não carregar no emulador (IP da rede mudou), use também `adb reverse tcp:8081 tcp:8081` e abra `exp://127.0.0.1:8081`.

## Validar

```powershell
cd app
npm run typecheck
node src/banco/servidor.js --init   # só cria/verifica as tabelas e sai
```

## Documentação

- [`app/DOCUMENTACAO_BANCO_SQLITE.md`](app/DOCUMENTACAO_BANCO_SQLITE.md): tabelas, rotas e como o banco funciona (Yago)
- [`app/DOCUMENTACAO_CSS.md`](app/DOCUMENTACAO_CSS.md): estilos das telas (Tyago)
- [`docs/01-O-PROJETO.md`](docs/01-O-PROJETO.md) a [`docs/06-CSS.md`](docs/06-CSS.md): tutoriais da versão anterior.
  Os capítulos 04 (Supabase) e 05 (API Express) descrevem a arquitetura antiga, que foi trocada pelo SQLite do Yago.
