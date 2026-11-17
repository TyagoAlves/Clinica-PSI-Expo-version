# 1. O projeto Clínica Psi

> **Para quem é este documento:** para qualquer pessoa, mesmo quem nunca programou.
> Aqui você vai entender **o que é** o projeto, **para que serve** e **como as pastas estão organizadas**.
>
> Próximos passos: [2. Como baixar e rodar](02-COMO-RODAR.md) · [3. Conceitos de código](03-CONCEITOS-DE-CODIGO.md)

---

## 1.1. O que é o Clínica Psi?

O Clínica Psi é um **aplicativo de celular para psicólogos e clínicas de psicologia**.

Pense numa clínica que hoje guarda tudo em papel: as fichas dos pacientes e um caderno com a agenda das
consultas. O app coloca isso no celular, organizado e seguro.

### O que dá para fazer no app

| Tela | O que faz |
|---|---|
| **Login** | Entrar com e-mail e senha (o app não tem tela de cadastro: a conta é criada antes, veja [Como rodar](02-COMO-RODAR.md#25-passo-4-ligar-a-api-e-criar-uma-conta)) |
| **Painel** | A "tela inicial": quantos pacientes estão cadastrados (com os botões "Ver pacientes" e "+ Novo paciente"), as sessões de hoje (com "Abrir agenda") e o botão "Sair da conta" |
| **Pacientes** | Lista de todos os pacientes (iniciais, nome, serviço e início do tratamento), com busca por nome e o botão "+ Novo Paciente" |
| **Ficha do paciente** | Abre ao tocar num paciente: nome completo, serviço, início do tratamento e descrição / queixa principal, com os botões **Editar** e **Excluir** |
| **Agenda** | As sessões (consultas) de cada dia: trocar o dia com ‹ ›, marcar uma nova sessão e, tocando numa sessão, ver os detalhes, editar ou excluir |

Além das telas, há **janelas que sobem de baixo** (os **modais**), por cima da tela:

| Modal | O que faz |
|---|---|
| **PacienteModal** | Formulário do paciente, usado para **novo** e para **editar** |
| **SessaoModal** | Formulário da sessão (paciente, data, horário, duração, serviço, observações), para **nova** e para **editar** |
| **VerSessaoModal** | Mostra os detalhes de uma sessão, com os botões **Editar** e **Excluir** |
| **SheetModal** | A "moldura" comum dos três acima: título, ×, conteúdo e botões no rodapé |

O **menu lateral** (botão ☰) leva para Painel, Pacientes e Agenda, e tem o **Sair**.

Os serviços oferecidos são uma lista fixa no app: **Psicoterapia**, **Avaliação** e **Acompanhamento**.

### Palavras da área que aparecem no app

- **Sessão:** uma consulta marcada na agenda.
- **Serviço:** o tipo de atendimento (Psicoterapia, Avaliação ou Acompanhamento).
- **Queixa principal:** o motivo que levou o paciente a procurar a clínica.

---

## 1.2. As 3 partes do projeto

O projeto tem **três partes** que conversam entre si. Uma comparação com um restaurante ajuda:

```text
   CELULAR                         COMPUTADOR / SERVIDOR               NUVEM
┌─────────────┐   pedidos     ┌──────────────────────┐   SQL    ┌──────────────────┐
│     APP     │ ────────────▶ │         API          │ ───────▶ │ BANCO DE DADOS   │
│  (o salão)  │ ◀──────────── │      (o garçom)      │ ◀─────── │   (a cozinha /   │
│             │   respostas   │                      │          │    a despensa)   │
└─────────────┘               └──────────────────────┘          └──────────────────┘
   app/                            api/                            Supabase
```

1. **O app** (pasta `app/`) é o que a pessoa vê e toca: telas, botões, formulários.
   É como o **salão do restaurante**, onde o cliente faz o pedido.
2. **A API** (pasta `api/`) é um programa que fica rodando num computador. Ela recebe os pedidos do app,
   confere se a pessoa tem permissão e busca ou guarda os dados. É o **garçom**.
3. **O banco de dados** (no **Supabase**, na internet) é onde as informações ficam guardadas de verdade.
   É a **cozinha e a despensa**: o cliente nunca entra lá, só o garçom.

**Por que o app não fala direto com o banco?** Porque, para entrar no banco, é preciso uma **senha**.
Se a senha ficasse dentro do app, qualquer pessoa que baixasse o app poderia descobri-la e ver os dados
de todos os pacientes. Então só a API conhece a senha, e o app precisa pedir tudo para ela.

Cada parte tem um documento só dela:
- O banco: [4. Banco de dados](04-BANCO-DE-DADOS.md)
- A API: [5. API](05-API.md)
- O visual do app: [6. CSS (visual)](06-CSS.md)

---

## 1.3. Organização das pastas

Um projeto de programação é uma **pasta cheia de arquivos de texto**. Cada arquivo tem um pedaço do programa.
Para não virar bagunça, separamos os arquivos em pastas, cada uma com uma função.

### A pasta principal

```text
Clinica-PSI-Escopo-Reduzido/
├── README.md     ← a "capa" do projeto: o primeiro arquivo que se lê
├── app/          ← O APLICATIVO (o que roda no celular)
├── api/          ← A API (o "garçom", roda no computador)
├── docs/         ← A DOCUMENTAÇÃO (estes textos que você está lendo)
├── tools/        ← pequenos programas de ajuda (abrir o emulador, tirar foto da tela)
└── .github/      ← configuração do GitHub (testa o código sozinho a cada envio)
```

> **O que é `.md`?** É um arquivo de texto no formato **Markdown**: um jeito simples de escrever textos com
> títulos, listas e tabelas. O GitHub e o VS Code mostram esses arquivos já formatados.

### Dentro do app (`app/`)

```text
app/
├── App.tsx            ← o ponto de partida: decide se mostra o Login ou as telas internas
├── package.json       ← a "lista de compras": quais bibliotecas o app usa
└── src/               ← "source" (código-fonte): todo o código do app
    ├── telas/         ← as 5 telas (cada arquivo é uma tela)
    │     LoginScreen, PainelScreen, PacientesScreen, PacienteScreen (a ficha), AgendaScreen
    ├── modais/        ← janelas que abrem por cima da tela
    │     PacienteModal, SessaoModal, VerSessaoModal, SheetModal (a moldura)
    ├── componentes/   ← peças visuais que se repetem
    │     AppDrawer, AppMenu (menu lateral), AppScreen, AppToolbar, TopBar (barras do topo),
    │     AuthScreen, BrandHeader (tela de login), EmptyHero, FormField, PasswordField,
    │     PrimaryButton, SectionCard
    ├── banco/         ← bancoDados.ts: as funções que leem e gravam os dados
    ├── api/           ← como o app conversa com a API
    │     cliente.ts (manda os pedidos), endereco.ts (onde a API está), tipos.ts (formato dos dados)
    ├── login/         ← AuthProvider.tsx: guarda quem está logado
    ├── navegacao/     ← AppNav.tsx: troca de uma tela para outra (e o botão "voltar")
    ├── utils/         ← ajudantes: masks.ts (máscaras de data, hora, nome, e-mail) e format.ts (datas, iniciais, lista de serviços)
    └── theme.ts       ← as cores e estilos usados no app inteiro
```

**Exemplo de como as pastas trabalham juntas** (a tela de Pacientes):

```text
telas/PacientesScreen.tsx     mostra a lista
  ├── usa componentes/AppToolbar.tsx     (a barra do topo)
  ├── usa modais/PacienteModal.tsx       (o formulário "novo paciente")
  ├── usa banco/bancoDados.ts            (busca os pacientes)
  │      └── usa api/cliente.ts          (manda o pedido pela internet)
  └── usa theme.ts                       (as cores)
```

### Dentro da API (`api/`)

```text
api/
├── API.md             ← lista de todos os "pedidos" que a API aceita
├── .env.example       ← modelo do arquivo de configuração (senhas ficam no .env, que NÃO vai para o GitHub)
├── scripts/           ← criar-conta.ts (cria uma conta: usuário + clínica) e gen-key.ts (gera a chave de criptografia)
├── src/
│   ├── server.ts      ← liga a API
│   ├── app.ts         ← monta a API (junta as peças)
│   ├── routes/        ← "o cardápio": quais pedidos existem e o que cada um precisa
│   ├── services/      ← as regras ("esse paciente é da sua clínica?")
│   ├── repositories/  ← quem escreve os comandos para o banco de dados
│   ├── db/            ← conexão com o banco e criação das tabelas
│   ├── security/      ← criptografia e bloqueio de quem erra a senha muitas vezes
│   ├── middleware/    ← o "porteiro": confere se a pessoa está logada
│   ├── domain/        ← o formato dos dados e as validações (nomes e datas)
│   └── config/        ← lê o arquivo de configuração (.env)
└── test/              ← testes automáticos (o computador confere se tudo funciona)
```

### Dentro da documentação (`docs/`)

| Arquivo | Assunto |
|---|---|
| `01-O-PROJETO.md` | Este documento |
| `02-COMO-RODAR.md` | Baixar, instalar e abrir o app no emulador ou no celular |
| `03-CONCEITOS-DE-CODIGO.md` | As palavras e ideias de programação usadas no projeto |
| `04-BANCO-DE-DADOS.md` | O banco de dados e o Supabase |
| `05-API.md` | A API: o que é, como foi feita e como usar |
| `06-CSS.md` | O visual: cores, tamanhos e como as telas foram estilizadas |
| `time/` | Anotações técnicas do time (setup detalhado, mudanças, tarefas) |
| `guias/` | Guias antigos do Tyago, da primeira versão do app (só para consulta) |
| `screenshots/` | Fotos da tela do app |

---

## 1.4. Tecnologias usadas (os "nomes" do projeto)

Não precisa decorar. É só para você reconhecer os nomes quando aparecerem:

| Nome | O que é | Onde |
|---|---|---|
| **TypeScript** | A linguagem em que todo o código foi escrito (é o JavaScript com "etiquetas" de tipo) | app e API |
| **React Native** | Ferramenta para criar apps de celular (Android e iPhone) com o mesmo código | app |
| **Expo** | Facilita rodar e testar o app React Native, sem precisar configurar o Android na mão | app |
| **Node.js** | Programa que roda código JavaScript/TypeScript fora do navegador (no computador) | API |
| **Express** | Biblioteca que ajuda a criar uma API no Node.js | API |
| **PostgreSQL** | O tipo de banco de dados (guarda tudo em tabelas) | banco |
| **Supabase** | Serviço na internet que hospeda o nosso PostgreSQL | banco |
| **Git / GitHub** | Guardam o histórico do código e permitem trabalhar em equipe | projeto todo |

Cada um desses nomes é explicado com calma em [3. Conceitos de código](03-CONCEITOS-DE-CODIGO.md).
