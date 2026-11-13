# Clínica Psi — Prontuário psicológico (versão para apresentação)

App mobile (Expo / React Native) para psicólogos e clínicas: pacientes, prontuário, agenda e serviços.
O app conversa com uma API Node.js, e a API guarda tudo no **Supabase (PostgreSQL)**.

> Esta é a **versão de escopo reduzido**, feita para ser simples de explicar. O projeto completo
> (com modo offline, auditoria e rotação de chave) continua em `C:\dev\clinica-psi`.

```text
Telas do app  →  bancoDados.ts  →  API Node.js (porta 3333)  →  Supabase (PostgreSQL)
```

## Por onde começar: tutoriais (para qualquer pessoa, mesmo sem saber programar)

Leia na ordem:

| # | Documento | O que você aprende |
|---|---|---|
| 1 | [O projeto](docs/01-O-PROJETO.md) | O que é o app, as 3 partes (app, API, banco) e a organização das pastas |
| 2 | [Como baixar e rodar](docs/02-COMO-RODAR.md) | Instalar os programas, baixar o projeto e abrir no emulador, no Expo ou no celular |
| 3 | [Conceitos de código](docs/03-CONCEITOS-DE-CODIGO.md) | As palavras de programação usadas no projeto (componente, função, hook, async...) |
| 4 | [Banco de dados e Supabase](docs/04-BANCO-DE-DADOS.md) | O que é um banco, nossas tabelas, SQL, criptografia e como criar um banco no Supabase |
| 5 | [API](docs/05-API.md) | O que é uma API, como a nossa foi feita, o que ela faz e como acessar |
| 6 | [CSS (visual)](docs/06-CSS.md) | Cores, tamanhos, Flexbox, o tema e como mudar o visual |

## Para o time (técnico)

| Documento | Para quê |
|---|---|
| [`api/API.md`](api/API.md) | Lista completa de rotas da API |
| [`docs/time/VISAO-GERAL.md`](docs/time/VISAO-GERAL.md) | Mapa técnico: onde está cada coisa |
| [`docs/time/DEV-SETUP.md`](docs/time/DEV-SETUP.md) | Ambiente detalhado, inspeção do emulador, problemas conhecidos |
| [`docs/time/MUDANCAS.md`](docs/time/MUDANCAS.md) | O que foi simplificado em relação ao projeto completo |
| [`docs/time/BACKLOG-TIME.md`](docs/time/BACKLOG-TIME.md) | O que falta e quem cuida |

## Pastas

```text
Clinica-PSI-Escopo-Reduzido/
├── README.md              este arquivo
├── app/                   APP MOBILE (Expo SDK 52 · React Native 0.76 · TypeScript)
│   ├── App.tsx            ponto de partida: login → telas
│   └── src/
│       ├── telas/         as 9 telas (Login, Cadastro 1 e 2, Painel, Pacientes, Paciente, Agenda, Serviços, Configurações)
│       ├── modais/        janelas de formulário (novo paciente, evolução, sessão, serviço, clínica, perfil, diagnóstico)
│       ├── componentes/   peças visuais reaproveitadas (botões, campos, cartões, menu lateral, barras)
│       ├── banco/         bancoDados.ts: ler, criar, editar e apagar dados (único arquivo que fala com o banco)
│       ├── api/           cliente HTTP, tipos dos dados e endereço da API
│       ├── login/         AuthProvider: quem está logado (token guardado no SecureStore)
│       ├── conexao/       ConexaoProvider: internet, profissionais da clínica, "Atualizar agora"
│       ├── navegacao/     troca de telas e botão voltar do Android
│       ├── utils/         máscaras (telefone, CPF, datas) e formatação
│       └── theme.ts       cores, cantos e sombras de todas as telas
├── api/                   API REST (Node.js 24 · Express 5 · TypeScript · PostgreSQL no Supabase)
│   ├── API.md             lista de rotas
│   ├── src/
│   │   ├── routes/        recebe a requisição HTTP e valida os dados
│   │   ├── services/      regras do negócio ("esse paciente é da sua clínica?")
│   │   ├── repositories/  monta e executa o SQL
│   │   ├── db/            conexão e criação das tabelas
│   │   ├── security/      criptografia dos campos e bloqueio de login
│   │   ├── middleware/    confere o token de login
│   │   ├── domain/        tipos e validações (CPF, telefone, datas)
│   │   └── config/        leitura do .env
│   └── test/              40 testes automáticos (banco PostgreSQL em memória)
├── docs/                  DOCUMENTAÇÃO (tabela acima) + guias/ originais do Tyago + screenshots/
├── tools/                 scripts do emulador: abrir, screenshot, logs, automação (ui.mjs)
└── .github/workflows/     CI: testes da API + typecheck do app
```

Os guias em `docs/guias/` (`Tela 1` … `Tela 10`) são históricos: descrevem a primeira versão, feita no Snack.

## Subir o projeto (3 terminais, a partir desta pasta)

```powershell
# 1. API  (primeira vez: copie api\.env.example para api\.env, rode "npm run gen:key"
#    e cole a DATABASE_URL do Supabase: Connect → Session pooler)
cd api; npm install; npm run dev

# 2. Emulador Android
powershell -ExecutionPolicy Bypass -File tools\emulador.ps1

# 3. App
cd app; npm install; npx expo start --android
```

Se o app não carregar no emulador (IP da rede mudou), use `adb reverse tcp:8081 tcp:8081` e abra `exp://127.0.0.1:8081`.

## Validar

```powershell
cd api; npm run typecheck; npm test
cd app; npm run typecheck
```

## Time

- **Tyago**: front-end/mobile e contato com o cliente
- **Yago**: back-end e arquitetura
- **Kelven**: back-end, testes e integração
