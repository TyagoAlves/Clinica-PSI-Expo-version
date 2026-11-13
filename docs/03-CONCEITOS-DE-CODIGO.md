# 3. Conceitos de código usados no projeto

> **Para quem é este documento:** para quem nunca programou ou está começando.
> Cada conceito vem com uma explicação simples, uma comparação com o dia a dia e um exemplo **tirado do nosso código**.
>
> Antes: [2. Como rodar](02-COMO-RODAR.md) · Depois: [4. Banco de dados](04-BANCO-DE-DADOS.md)

---

## 3.1. O que é programar?

**Programar é escrever instruções para o computador**, numa língua que ele entende (a **linguagem de programação**).
É como uma receita de bolo: passos em ordem, bem explicados, sem deixar nada para "adivinhar".

O conjunto dessas instruções é o **código**. Um arquivo de código é só um arquivo de texto com essas instruções.

### Front-end e back-end

| | Front-end | Back-end |
|---|---|---|
| O que é | A parte que a pessoa **vê e toca** | A parte que fica **por trás**, guardando e conferindo dados |
| No nosso projeto | O app (`app/`) | A API (`api/`) e o banco de dados |
| No restaurante | O salão e o cardápio | O garçom e a cozinha |

---

## 3.2. A linguagem: JavaScript e TypeScript

O projeto inteiro (app e API) foi escrito em **TypeScript**.

- **JavaScript** é a linguagem mais usada da internet. Todo site moderno usa.
- **TypeScript** é o JavaScript com **etiquetas de tipo**: a gente avisa "isso aqui é um número", "isso é um texto".
  Se alguém tentar colocar um texto onde deveria ir um número, o computador avisa **antes** de rodar o programa.

Arquivos `.ts` são TypeScript. Arquivos `.tsx` são TypeScript **com telas** (veja [JSX](#33-react-componentes-e-jsx)).

### Variável: uma caixa com nome

Uma **variável** guarda um valor para usar depois. É como uma caixa com uma etiqueta.

```typescript
const INTERVALO_MS = 60_000;   // uma caixa chamada INTERVALO_MS guardando o número 60000 (1 minuto em milissegundos)
```

- `const` = a caixa não muda de conteúdo. (Existe também `let`, para caixas que mudam.)
- `//` começa um **comentário**: texto para pessoas lerem. O computador ignora.

### Tipos de valores

| Tipo | Exemplo | O que é |
|---|---|---|
| `string` (texto) | `'Maria da Silva'` | Sempre entre aspas |
| `number` (número) | `50`, `15000` | Sem aspas |
| `boolean` (verdadeiro/falso) | `true`, `false` | Usado em "ativo ou não?" |
| `null` | `null` | "Vazio de propósito" (ex.: paciente sem e-mail) |

### Objeto: uma ficha com campos

Um **objeto** junta várias informações de uma coisa só, como uma ficha de cadastro:

```typescript
const paciente = {
  name: 'Maria da Silva',
  phone: '61900000000',
  status: 'Em tratamento',
};
```

Para ler um campo, usa-se o ponto: `paciente.name` vale `'Maria da Silva'`.

### Lista (array)

Uma **lista** guarda vários valores em ordem, entre colchetes:

```typescript
export const PATIENT_STATUSES = ['Em tratamento', 'Pausado', 'Alta'];
```

### Função: uma receita reaproveitável

Uma **função** é um conjunto de passos com um nome. Você "chama" a função quando precisa, em vez de repetir os passos.
Ela pode **receber** informações (parâmetros) e **devolver** um resultado (`return`).

```typescript
// Recebe um texto e devolve o mesmo texto só com os números (tira parênteses, traços e espaços)
function soDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

soDigitos('(61) 9 0000-0000');   // devolve '61900000000'
```

O `: string` depois de `texto` é a **etiqueta de tipo** do TypeScript: "texto precisa ser um texto".

### Interface e tipo: o "molde" de um objeto

Uma **interface** descreve como um objeto deve ser: quais campos ele tem e de que tipo.
É como o **formulário em branco**, antes de ser preenchido.

```typescript
// app/src/api/tipos.ts (resumido)
export interface ServiceFields {
  name: string;               // nome do serviço (texto)
  durationMin: number | null; // duração em minutos (número ou vazio)
  active: boolean;            // ativo? (sim/não)
}
```

### `import` e `export`: compartilhar entre arquivos

Cada arquivo **exporta** o que quer compartilhar, e outros arquivos **importam** o que precisam:

```typescript
// em app/src/theme.ts
export const colors = { primary: '#4F46E5' };

// em app/src/telas/PacientesScreen.tsx
import { colors } from '../theme';
```

- `../` quer dizer "volte uma pasta". `../theme` = "suba uma pasta e pegue o arquivo `theme`".

---

## 3.3. React: componentes e JSX

O app foi feito com **React Native**, que é a versão para celular do **React** (criado pelo Facebook/Meta).

### Componente: uma peça de Lego

No React, a tela é montada com **componentes**: peças que se encaixam. Um botão é um componente; um cartão
é um componente; uma tela inteira é um componente feito de outros componentes.

Um componente é uma **função que devolve o que deve aparecer na tela**:

```tsx
// app/src/componentes/PrimaryButton.tsx (resumido)
export default function PrimaryButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
```

### JSX: escrever a tela como se fosse HTML

O trecho `<TouchableOpacity> ... </TouchableOpacity>` é **JSX**: um jeito de descrever a tela com "etiquetas"
(tags), parecido com o HTML dos sites. Por isso o arquivo termina em `.tsx` (TypeScript + JSX).

Os componentes básicos do React Native que mais aparecem:

| Componente | Para que serve | Parecido com, no site |
|---|---|---|
| `<View>` | Uma "caixa" que agrupa outras coisas | `<div>` |
| `<Text>` | Qualquer texto | `<p>`, `<span>` |
| `<TextInput>` | Campo onde se digita | `<input>` |
| `<TouchableOpacity>` | Área que pode ser tocada (botão) | `<button>` |
| `<ScrollView>` | Área que rola para baixo | página com rolagem |
| `<Modal>` | Janela que abre por cima da tela | pop-up |

### Props: as "configurações" de um componente

**Props** (propriedades) são as informações que um componente recebe de quem o usa. O mesmo botão pode ter
textos diferentes:

```tsx
<PrimaryButton label="Entrar" onPress={handleEntrar} />
<PrimaryButton label="Continuar" onPress={handleContinuar} />
```

Aqui `label` e `onPress` são props. `onPress` recebe **a função que roda quando o botão é tocado**.

---

## 3.4. Estado e hooks: a "memória" da tela

### Estado (`useState`)

**Estado** é algo que a tela precisa **lembrar** e que pode **mudar**: o texto digitado na busca,
se um formulário está aberto, a lista de pacientes. Quando o estado muda, o React **redesenha a tela sozinho**.

```tsx
// app/src/telas/PacientesScreen.tsx
const [busca, setBusca] = useState('');        // começa vazio
const [novoOpen, setNovoOpen] = useState(false); // o formulário começa fechado
```

- `busca` é o valor atual.
- `setBusca` é a função que **troca** o valor. Ao chamar `setNovoOpen(true)`, o formulário aparece.

### Hook

Funções que começam com **`use`** (como `useState`) são **hooks**: "ganchos" que dão superpoderes ao componente
(memória, buscar dados, saber quem está logado...). Os mais usados no projeto:

| Hook | Para quê | Exemplo |
|---|---|---|
| `useState` | Lembrar um valor que muda | texto da busca |
| `useEffect` | Fazer algo quando a tela abre ou quando algo muda | buscar os pacientes ao abrir |
| `useMemo` | Guardar um cálculo para não refazer à toa | a lista filtrada |
| `useDados` (nosso) | Buscar uma lista do banco e recarregar quando mudar | `useDados(rotas.pacientes(...))` |
| `useAuth` (nosso) | Saber quem está logado e qual a clínica | `const { user, clinic } = useAuth()` |
| `useConexao` (nosso) | Saber se há internet e atualizar os dados | `conexao.atualizarAgora()` |

### Context e Provider: informação para o app inteiro

Algumas informações precisam estar disponíveis em **todas** as telas, como "quem está logado".
Em vez de passar isso de tela em tela, usamos um **Context** (contexto): uma espécie de **quadro de avisos**
que todas as telas conseguem ler. O **Provider** é quem cuida desse quadro.

```tsx
// app/App.tsx (resumido)
<AuthProvider>          {/* cuida de "quem está logado" */}
  <ConexaoProvider>     {/* cuida de "tem internet?" */}
    <AppContent />      {/* todas as telas ficam aqui dentro e podem ler os dois */}
  </ConexaoProvider>
</AuthProvider>
```

---

## 3.5. Esperar a resposta: `async` e `await`

Buscar dados na internet **demora** (às vezes meio segundo, às vezes mais). O programa não pode travar esperando.

- **`async`** marca uma função que faz algo demorado.
- **`await`** quer dizer "espere a resposta antes de continuar".
- **Promise** (promessa) é o nome do "vale" que o programa recebe: "a resposta vai chegar".

Comparação: você pede uma pizza (`async`), recebe a promessa de entrega (`Promise`) e, quando precisa
dela, espera a pizza chegar (`await`).

```typescript
// app/src/banco/bancoDados.ts
export async function criarNoBanco(caminho, item) {
  const criado = await apiRequest('POST', caminho, item); // espera a API responder
  avisarMudanca();                                        // só depois avisa as telas
  return criado;
}
```

### `try` / `catch`: lidar com erros

Às vezes dá errado (sem internet, dado inválido). O `try` tenta; se der erro, o `catch` "pega" o erro e decide o que fazer:

```typescript
try {
  await criarNoBanco(rotas.pacientes(clinica.id), dados);
} catch (erro) {
  Alert.alert('Não foi possível salvar', erro.message); // mostra o aviso na tela
}
```

---

## 3.6. Pacotes, npm e `package.json`

Ninguém escreve tudo do zero. Usamos **pacotes** (ou **bibliotecas**): código pronto, feito por outras pessoas,
para tarefas comuns (desenhar ícones, guardar senha com segurança, falar com o banco).

- **npm** é a loja (gratuita) desses pacotes.
- **`package.json`** é a **lista de compras** do projeto: quais pacotes ele usa e em qual versão.
- **`npm install`** lê a lista e baixa tudo para a pasta **`node_modules`** (que fica enorme e **não** vai para o GitHub).
- **`npm run dev`**, **`npm test`**: atalhos de comandos, definidos na parte `"scripts"` do `package.json`.

Alguns pacotes que usamos:

| Pacote | Para quê |
|---|---|
| `react`, `react-native` | Montar as telas |
| `expo` | Rodar e empacotar o app |
| `expo-secure-store` | Guardar o login no "cofre" do celular |
| `@expo/vector-icons` | Ícones (lupa, lixeira, menu...) |
| `express` | Criar a API |
| `postgres` | Conversar com o banco PostgreSQL |
| `zod` | Conferir se os dados que chegam na API estão certos |
| `vitest` | Rodar os testes automáticos |

---

## 3.7. Internet: HTTP, URL e JSON

Quando o app pede algo para a API, ele usa o **HTTP**: as "regras de etiqueta" da internet (o mesmo que o
navegador usa para abrir sites).

- **URL** (endereço): onde mandar o pedido. Ex.: `http://10.0.2.2:3333/api/v1/patients/123`.
- **Método**: o tipo de pedido. `GET` = buscar, `POST` = criar, `PATCH` = alterar, `DELETE` = apagar.
- **JSON**: o formato do texto que vai e volta. Parece um objeto do JavaScript:
  ```json
  { "name": "Maria da Silva", "phone": "61900000000" }
  ```
- **Status**: um número que diz como foi. `200` = deu certo, `404` = não encontrado, `401` = precisa fazer login.

Tudo isso é explicado com calma em [5. API](05-API.md).

### CRUD

**CRUD** é a sigla para as 4 coisas que se faz com dados:

| Letra | Inglês | Português | No app |
|---|---|---|---|
| C | Create | Criar | Cadastrar um paciente |
| R | Read | Ler | Ver a lista de pacientes |
| U | Update | Atualizar | Editar o telefone |
| D | Delete | Apagar | Excluir uma sessão |

---

## 3.8. Segurança: token, hash e criptografia

| Conceito | Explicação simples | No projeto |
|---|---|---|
| **Token** | Uma "pulseira de festa": depois do login, o app recebe um código e mostra ele em cada pedido, em vez de mandar a senha toda vez | O app guarda o token no **SecureStore** (o cofre do celular) |
| **Hash** | Transformar um texto numa "impressão digital" que **não dá para desfazer**. Para conferir a senha, faz-se o hash de novo e compara | As senhas são guardadas só como hash. Nem quem tem acesso ao banco descobre a senha |
| **Criptografia** | Embaralhar um texto com uma **chave**. Quem tem a chave desembaralha | Queixa, endereço, CPF e as anotações do prontuário ficam embaralhados no banco |

---

## 3.9. Git e GitHub

- **Git** é um programa que guarda o **histórico** do código: cada versão salva é um **commit**
  ("fotografia" do projeto naquele momento, com uma mensagem explicando o que mudou).
- **GitHub** é o site onde esse histórico fica guardado na internet, para a equipe toda acessar.
- **Branch** (galho) é uma **linha paralela** de trabalho. Cada pessoa pode mexer na sua branch sem atrapalhar
  as outras. Este projeto está na branch `branch-estruturada-kelven`.
- **Push** = enviar seus commits para o GitHub. **Pull**/**clone** = baixar do GitHub.

---

## 3.10. Glossário rápido

| Palavra | Significado |
|---|---|
| **API** | Programa que recebe pedidos e devolve respostas (o "garçom") |
| **Async / await** | Jeito de esperar uma resposta demorada sem travar o app |
| **Banco de dados** | Onde os dados ficam guardados, em tabelas |
| **Biblioteca / pacote** | Código pronto feito por outras pessoas |
| **Branch** | Linha paralela de trabalho no Git |
| **Commit** | Uma versão salva do código, com mensagem |
| **Componente** | Peça da tela (botão, cartão, tela inteira) |
| **Context / Provider** | "Quadro de avisos" que todas as telas conseguem ler |
| **CRUD** | Criar, ler, atualizar e apagar |
| **Emulador** | Celular de mentira que roda no computador |
| **Endpoint / rota** | Um endereço específico da API (ex.: `/patients`) |
| **Expo / Expo Go** | Ferramenta que roda o app no celular sem publicar na loja |
| **Função** | Uma receita com nome, que pode ser reaproveitada |
| **Hook** | Função `use...` que dá memória e poderes a um componente |
| **HTTP** | As regras de comunicação da internet |
| **JSON** | Formato de texto para trocar dados |
| **JSX / TSX** | Jeito de escrever a tela com "etiquetas" dentro do código |
| **Node.js** | Programa que roda JavaScript no computador (usado pela API) |
| **npm** | A "loja" de pacotes do JavaScript |
| **Objeto** | Ficha com vários campos (`nome`, `telefone`...) |
| **Props** | As configurações que um componente recebe |
| **SQL** | Língua para falar com o banco de dados |
| **Estado (state)** | O que a tela lembra e que pode mudar |
| **Token** | "Pulseira" que prova que a pessoa já fez login |
| **TypeScript** | JavaScript com etiquetas de tipo |
| **Variável** | Caixa com nome que guarda um valor |
