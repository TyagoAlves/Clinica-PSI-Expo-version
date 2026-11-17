# Documentação do CSS (Estilização no React Native)

Este documento explica de forma didática todo o **CSS** aplicado no projeto da **Clínica PSI**, utilizando o `StyleSheet.create` do React Native.

---

## 1. Como funciona o CSS no React Native?

No React Native não usamos arquivos `.css` tradicionais com nomes separados por hífen (como `background-color`). Em vez disso, usamos o **`StyleSheet.create({})`**, onde cada estilo é um objeto JavaScript:

- **Nomes em *camelCase***: `background-color` vira `backgroundColor`, `font-size` vira `fontSize`, `border-radius` vira `borderRadius`.
- **Medidas sem `px`**: Os números (como `padding: 20` ou `fontSize: 16`) já representam pixels independentes de densidade (dp), sem precisar escrever `'20px'`.
- **Flexbox ativo por padrão**: Todo `<View>` já usa `display: 'flex'` com direção em coluna (`flexDirection: 'column'`), facilitando empilhar elementos de cima para baixo.

---

## 2. Paleta de Cores Utilizada

Mantivemos uma paleta limpa de clínica médica/psicológica, usando tons suaves de azul, cinza e índigo:

| Elemento | Cor (Hex) | Onde é usada |
| :--- | :--- | :--- |
| **Fundo da Tela** | `#F1F3F8` | Fundo cinza-azulado suave em todas as telas (`tela`) |
| **Fundo do Cartão** | `#FFFFFF` | Caixas brancas que destacam o conteúdo (`cartao`) |
| **Borda do Cartão** | `#DCE1EB` | Contorno sutil ao redor dos cartões |
| **Fundo de Input** | `#F8FAFC` | Fundo dos campos de digitação (`input`) e fichas (`valor`) |
| **Borda de Input** | `#CBD5E1` | Contorno dos campos de texto (`TextInput`) |
| **Azul Primário** | `#4F46E5` | Botões principais (*Entrar, Salvar, Novo*) e destaques |
| **Azul Secundário** | `#E0E7FF` | Fundo dos botões secundários (*Ver Paciente, Editar*) |
| **Vermelho (Perigo)** | `#FEE2E2` / `#DC2626` | Fundo e texto do botão *Apagar* (`botaoPerigo`) |
| **Cinza (Voltar)** | `#E2E8F0` / `#334155` | Fundo e texto dos botões *Voltar / Sair* (`botaoVoltar`) |
| **Texto Principal** | `#1E293B` | Títulos e nomes de pacientes |
| **Texto Secundário** | `#64748B` | Subtítulos, datas e rótulos auxiliares |

---

## 3. Explicação Detalhada de Cada Classe de Estilo

Padronizamos os mesmos nomes de estilos em todas as 10 telas do projeto para manter o código organizado e fácil de apresentar:

### 3.1. Estrutura da Tela e Centralização (`tela` e `container`)

```javascript
tela: {
  flex: 1,                  // Ocupa 100% da altura disponível da tela
  flexGrow: 1,              // Usado quando a tela tem ScrollView (permite rolar)
  backgroundColor: '#F1F3F8', // Cor de fundo da página
  alignItems: 'center',     // Centraliza os cartões horizontalmente
  justifyContent: 'center', // Centraliza o conteúdo verticalmente
  padding: 20,              // Espaçamento interno nas bordas da tela
},
container: {
  width: '100%',            // Ocupa toda a largura em celulares
  maxWidth: 420,            // Limita a largura máxima no navegador (PC) para não esticar
},
```

---

### 3.2. Cartões (`cartao`)

Os cartões agrupam formulários, fichas e itens das listas de pacientes e seções:

```javascript
cartao: {
  width: '100%',
  maxWidth: 420,
  backgroundColor: '#FFFFFF', // Caixa branca
  padding: 22,                // Espaço interno entre a borda do cartão e os textos
  borderRadius: 12,           // Cantos arredondados
  borderWidth: 1,             // Espessura da linha de borda (1px)
  borderColor: '#DCE1EB',     // Cor suave da borda
  marginBottom: 12,           // Espaço abaixo do cartão (separa um cartão do outro)
},
```

---

### 3.3. Textos e Tipografia (`titulo`, `subtitulo`, `rotulo`, `valor`)

```javascript
titulo: {
  fontSize: 26,         // Tamanho grande para o título principal da tela
  fontWeight: 'bold',   // Texto em negrito
  color: '#1E293B',     // Azul bem escuro (quase preto, mais confortável para leitura)
},
subtitulo: {
  fontSize: 15,
  color: '#64748B',     // Cinza médio para descrições abaixo do título
  marginBottom: 16,     // Dá um espaço antes do próximo elemento
},
rotulo: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#334155',
  marginBottom: 6,      // Pequeno espaço acima do TextInput
},
valor: {
  fontSize: 16,
  color: '#1E293B',
  backgroundColor: '#F8FAFC', // Caixa clara para exibir os dados na ficha
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
},
```

---

### 3.4. Campos de Digitação (`input`)

Usado em todos os componentes `<TextInput>` (Login, Novo Paciente, Editar Paciente, Nova Seção, Editar Seção):

```javascript
input: {
  backgroundColor: '#F8FAFC', // Fundo cinza bem claro para destacar onde digitar
  borderWidth: 1,             // Borda de 1px
  borderColor: '#CBD5E1',     // Cor da borda
  borderRadius: 8,            // Cantos arredondados
  padding: 10,                // Espaço interno para o texto não colar na borda
  fontSize: 15,               // Tamanho da letra digitada
  marginBottom: 14,           // Espaço até o próximo campo do formulário
},
```

---

### 3.5. Botões Padronizados (`Pressable`)

No React Native, o texto dentro de um botão é estilizado separadamente no componente `<Text>` interno. Criamos **4 tipos de botões** conforme a importância da ação:

```javascript
// 1. Botão Primário (Ações principais: Entrar, Salvar, + Novo)
botaoPrimario: {
  backgroundColor: '#4F46E5', // Azul Índigo forte
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',       // Centraliza o texto dentro do botão
  marginBottom: 10,
},
textoBotaoPrimario: {
  color: '#FFFFFF',           // Texto branco
  fontSize: 15,
  fontWeight: 'bold',
},

// 2. Botão Secundário / Ação (Ver Paciente, Ver Seção, Editar Seção)
botaoSecundario: {
  backgroundColor: '#E0E7FF', // Azul bem claro
  padding: 10,
  borderRadius: 8,
  alignItems: 'center',
},
textoBotaoSecundario: {
  color: '#4F46E5',           // Texto azul índigo
  fontSize: 14,
  fontWeight: 'bold',
},

// 3. Botão de Perigo (Apagar Paciente, Apagar Seção)
botaoPerigo: {
  backgroundColor: '#FEE2E2', // Fundo vermelho claro de alerta
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 10,
},
textoBotaoPerigo: {
  color: '#DC2626',           // Texto vermelho escuro
  fontSize: 15,
  fontWeight: 'bold',
},

// 4. Botão Voltar / Sair (Navegação neutra)
botaoVoltar: {
  backgroundColor: '#E2E8F0', // Fundo cinza neutro
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
},
textoBotaoVoltar: {
  color: '#334155',           // Texto cinza escuro
  fontSize: 15,
  fontWeight: 'bold',
},
```

---

### 3.6. Alinhamento Lado a Lado na Agenda (`flexDirection: 'row'`)

Na tela de Agenda (`TelaAgenda.tsx`), usamos `flexDirection: 'row'` para colocar elementos **na mesma linha horizontal** (como a barra `Ontem | Hoje | Amanhã` e os botões `Ver Seção | Editar Seção`):

```javascript
barraDias: {
  flexDirection: 'row',            // Coloca os itens lado a lado (horizontal)
  justifyContent: 'space-between', // Distribui um na esquerda, um no meio e um na direita
  alignItems: 'center',            // Alinha na mesma altura vertical
  backgroundColor: '#FFFFFF',
  padding: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#DCE1EB',
  marginBottom: 14,
},
linhaBotoes: {
  flexDirection: 'row', // Coloca "Ver Seção" e "Editar Seção" lado a lado
  gap: 8,               // Espaço de 8px entre os dois botões
  marginTop: 12,
},
```

---

## 4. Resumo Rápido para Responder em Sala de Aula

| Propriedade | Para que serve? |
| :--- | :--- |
| `flex: 1` | Faz a tela ocupar todo o espaço disponível do visor. |
| `flexDirection: 'row'` | Muda o alinhamento de coluna (vertical) para linha (horizontal). |
| `alignItems: 'center'` | Centraliza os elementos no eixo cruzado (horizontalmente quando em coluna). |
| `justifyContent: 'center'` | Centraliza os elementos no eixo principal (verticalmente quando em coluna). |
| `justifyContent: 'space-between'` | Separa os elementos nas extremidades opostas da linha. |
| `padding` | Espaçamento **interno** (dentro da borda da caixa/botão). |
| `marginBottom` / `marginTop` | Espaçamento **externo** (afasta um elemento do outro). |
| `borderRadius` | Arredonda os cantos de cartões, botões e campos de texto. |
| `maxWidth: 420` | Garante que o layout fique bonito tanto no celular quanto na tela larga do PC. |
