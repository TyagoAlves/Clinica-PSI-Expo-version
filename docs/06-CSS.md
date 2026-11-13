# 6. CSS: o visual do app

> **Para quem é este documento:** para quem quer entender como as telas ganharam cores, tamanhos e formas,
> e como mudar o visual. Não precisa saber programar.
>
> Antes: [5. API](05-API.md) · Volta ao início: [1. O projeto](01-O-PROJETO.md)

---

## 6.1. O que é CSS?

Uma tela tem duas partes:
1. **O conteúdo:** o que aparece (um título, um campo de e-mail, um botão "Entrar").
2. **O estilo:** **como** aparece (azul ou cinza? grande ou pequeno? com cantos redondos?).

Nos sites, o estilo é escrito numa linguagem chamada **CSS** (*Cascading Style Sheets*, "folhas de estilo").
Algo assim:

```css
.botao {
  background-color: #4F46E5;
  border-radius: 12px;
  font-size: 16px;
}
```

### E no React Native?

No app de celular **não existem arquivos `.css`**. Mas a ideia é **a mesma**, com quase os mesmos nomes.
O estilo é escrito dentro do próprio código, com o `StyleSheet.create`:

```typescript
const styles = StyleSheet.create({
  botao: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    fontSize: 16,
  },
});
```

Por isso o time chama de "CSS" mesmo assim. As diferenças:

| No CSS dos sites | No React Native |
|---|---|
| `background-color` (com hífen) | `backgroundColor` (junta as palavras e a próxima começa com maiúscula: *camelCase*) |
| `12px` | `12` (só o número; a unidade é automática e se ajusta a cada tela de celular) |
| Arquivo `.css` separado | Bloco `StyleSheet.create({...})` no fim do arquivo da tela |

### Como um estilo é usado

Cada peça da tela recebe o estilo pela "configuração" `style`:

```tsx
<Text style={styles.titulo}>Pacientes</Text>
```

Dá para juntar mais de um estilo numa lista. O segundo só vale **quando a condição é verdadeira**:

```tsx
<View style={[styles.aba, ativa && styles.abaAtiva]} />
// "use o estilo aba; e, se esta aba estiver ativa, use também abaAtiva"
```

---

## 6.2. As propriedades mais usadas

### Cores

As cores são escritas em **hexadecimal**: um `#` seguido de 6 letras/números. É um código para
"quanto de vermelho, verde e azul" a cor tem.

| Código | Cor | Onde aparece no app |
|---|---|---|
| `#4F46E5` | Índigo (azul-arroxeado) | Botões, logo, links |
| `#FFFFFF` | Branco | Cartões e campos |
| `#F1F3F8` | Cinza bem claro | Fundo das telas |
| `#0F172A` | Quase preto | Títulos |
| `#DC2626` | Vermelho | Erros e "Excluir" |

Dica: pesquise "color picker" no Google para ver a cor de qualquer código.

| Propriedade | O que faz |
|---|---|
| `backgroundColor` | Cor de fundo |
| `color` | Cor do texto |
| `borderColor` | Cor da borda |

### Texto

| Propriedade | O que faz | Exemplo |
|---|---|---|
| `fontSize` | Tamanho da letra | `20` para títulos, `12` para textos pequenos |
| `fontWeight` | Grossura da letra | `'400'` normal, `'700'` negrito, `'800'` extra-negrito |
| `textAlign` | Alinhamento | `'center'` |
| `lineHeight` | Espaço entre as linhas | `16` |

### A "caixa": margem, borda e espaçamento interno

Toda peça da tela é uma **caixa**. Pense num **quadro na parede**:

```text
          margin (espaço do lado de fora, até a parede/outros quadros)
   ┌─────────────────────────────────────┐
   │  border (a moldura)                 │
   │   ┌─────────────────────────────┐   │
   │   │  padding (o paspatur:       │   │
   │   │  espaço entre a moldura     │   │
   │   │  e a foto)                  │   │
   │   │     ┌─────────────────┐     │   │
   │   │     │    CONTEÚDO     │     │   │
   │   │     └─────────────────┘     │   │
   │   └─────────────────────────────┘   │
   └─────────────────────────────────────┘
```

| Propriedade | O que faz |
|---|---|
| `margin` | Espaço **fora** da caixa (afasta das outras) |
| `padding` | Espaço **dentro** da caixa (afasta o conteúdo da borda) |
| `borderWidth` | Grossura da borda (`1` = linha fina) |
| `borderRadius` | **Arredonda os cantos** (`12` = levemente; metade da largura = círculo) |
| `width` / `height` | Largura e altura |

Variações úteis: `marginTop` (só em cima), `paddingHorizontal` (só nas laterais), `paddingVertical` (só em cima e embaixo).

### Organizar as peças: o Flexbox

O **Flexbox** decide **como as peças se arrumam dentro de uma caixa**. No React Native, toda `<View>` já usa Flexbox.

| Propriedade | O que faz | Valores comuns |
|---|---|---|
| `flexDirection` | Empilha ou põe lado a lado | `'column'` (um embaixo do outro, o padrão) · `'row'` (lado a lado) |
| `justifyContent` | Distribui na direção principal | `'center'` · `'space-between'` (um em cada ponta) |
| `alignItems` | Alinha na outra direção | `'center'` (centraliza) |
| `flex: 1` | "Ocupe todo o espaço que sobrar" | |
| `gap` | Espaço entre as peças | `8` |

Exemplo real: a faixa de título de várias telas tem o **título à esquerda** e um **botão à direita**:

```typescript
headerRow: {
  flexDirection: 'row',             // título e botão lado a lado
  justifyContent: 'space-between',  // um em cada ponta
  alignItems: 'center',             // alinhados pelo meio
},
```

### Sombra

| Propriedade | O que faz |
|---|---|
| `shadowColor`, `shadowOpacity`, `shadowRadius`, `shadowOffset` | Sombra no **iPhone** |
| `elevation` | Sombra no **Android** (quanto maior, mais "alto" o cartão parece) |

Por isso as duas aparecem juntas no código: uma para cada sistema.

---

## 6.3. O tema: todas as cores num arquivo só (`app/src/theme.ts`)

### O problema

Se cada tela escrevesse `'#4F46E5'` por conta própria, mudar a cor principal exigiria mexer em dezenas de arquivos,
e bastaria esquecer um para o app ficar com duas cores diferentes.

### A solução

Criamos o arquivo **`app/src/theme.ts`** com **todas as cores e medidas**, cada uma com um **nome**.
As telas usam o nome, não o código da cor:

```typescript
// app/src/theme.ts (resumido)
export const colors = {
  bg: '#F1F3F8',          // fundo de todas as telas
  surface: '#FFFFFF',     // cartões e campos
  border: '#E2E8F0',      // bordas
  primary: '#4F46E5',     // índigo: botões, logo, links
  primarySoft: '#EEF2FF', // índigo bem clarinho: fundo de avatares e ícones
  text: '#0F172A',        // títulos
  textMuted: '#64748B',   // textos de apoio
  error: '#DC2626',       // vermelho de erro
  success: '#059669',     // verde de "Ativo" e "Em tratamento"
  warning: '#B45309',     // amarelo de "Pausado"
  drawer: '#111827',      // fundo escuro do menu lateral
};
```

E numa tela:

```typescript
import { colors } from '../theme';

titulo: { color: colors.text },          // e não color: '#0F172A'
```

Esses valores com nome são chamados de **tokens de design**: as "peças oficiais" do visual, tiradas dos
protótipos feitos no **Penpot** (um programa de desenhar telas, parecido com o Figma).

### Paleta completa

| Nome | Cor | Onde é usada |
|---|---|---|
| `bg` | `#F1F3F8` | Fundo de todas as telas |
| `surface` | `#FFFFFF` | Cartões, campos e barras |
| `border` | `#E2E8F0` | Borda de cartões, campos e botões contornados |
| `divider` | `#EEF1F6` | Linhas entre itens dentro de um cartão |
| `primary` | `#4F46E5` | Botões principais, logo, aba ativa, links |
| `primarySoft` | `#EEF2FF` | Fundo de avatares, ícones e chips selecionados |
| `text` | `#0F172A` | Títulos e nomes |
| `textMuted` | `#64748B` | Subtítulos, datas e textos de apoio |
| `label` | `#1E293B` | Rótulos dos campos (em negrito) |
| `placeholder` | `#94A3B8` | Texto de exemplo dentro dos campos |
| `success` / `successBg` | `#059669` / `#ECFDF5` | Selos "Ativo" e "Em tratamento" |
| `warning` / `warningBg` | `#B45309` / `#FFFBEB` | Selo "Pausado" |
| `error` / `errorBg` | `#DC2626` / `#FEF2F2` | Erros, "Excluir" e "Sair deste aparelho" |
| `drawer` | `#111827` | Fundo escuro do menu lateral |

### Cantos arredondados (`radius`)

| Nome | Valor | Onde |
|---|---|---|
| `input` | `12` | Campos de texto |
| `button` | `12` | Botões |
| `card` | `16` | Cartões |
| `pill` | `999` | Selos e chips (formato de pílula: um número bem grande deixa as pontas totalmente redondas) |

### Estilos prontos

O tema também tem "pacotes" de estilo prontos, para não repetir:

```typescript
// O cartão branco padrão: fundo branco, cantos 16, borda fina e sombra suave
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,
  borderWidth: 1,
  borderColor: colors.border,
  ...cardShadow,
};
```

Os **três pontinhos** (`...`) são o *spread*: "copie tudo daqui para cá". Assim uma tela faz:

```typescript
cartaoPaciente: { ...card, padding: 16 },   // "um cartão padrão, com 16 de espaço por dentro"
```

---

## 6.4. Componentes: estilos que se repetem viram peças

Um botão índigo aparece em várias telas. Em vez de repetir o estilo em cada uma, ele virou um **componente**
(`app/src/componentes/PrimaryButton.tsx`) com o estilo dentro. As telas só escrevem:

```tsx
<PrimaryButton label="Entrar" onPress={handleEntrar} />
```

| Componente | Visual | Usado em |
|---|---|---|
| `BrandHeader` | Logo "CP" (52×52, cantos 12), título e subtítulo | Login, Cadastro |
| `FormField` / `PasswordField` | Rótulo em negrito + campo de 52 de altura, cantos 12 | Todos os formulários |
| `PrimaryButton` | Botão índigo de 52 de altura, com sombra | Entrar, Continuar |
| `TextButton` | Texto cinza com ícone opcional | "Cadastrar-se", "Voltar" |
| `Stepper` | Duas pílulas: etapa ativa em índigo, concluída em verde | Cadastro 1 e 2 |
| `AppToolbar` | Barra branca com ☰, busca e ⋮ | Telas internas |
| `SectionCard` | Cartão com título e botão à direita | Painel |
| `EmptyHero` | Círculo com "+", título, texto e botão | Listas vazias |
| `AppDrawer` | Menu lateral escuro, item ativo em índigo | Todas as telas internas |
| `SheetModal` (em `modais/`) | Formulário que sobe de baixo, com Cancelar/Salvar | Sessão, Serviço, Clínica, Perfil |

---

## 6.5. Receitas usadas nas telas

### Avatar redondo com as iniciais (Pacientes, Detalhe)

```typescript
avatar: {
  width: 48, height: 48,
  borderRadius: 24,                    // metade de 48 = círculo perfeito
  backgroundColor: colors.primarySoft, // índigo clarinho
  alignItems: 'center',                // iniciais no meio (horizontal)
  justifyContent: 'center',            // iniciais no meio (vertical)
},
```

### Selo colorido de situação (Pacientes, Serviços)

```typescript
pill: {
  fontSize: 11, fontWeight: '700',
  paddingHorizontal: 14, paddingVertical: 4,
  borderRadius: 999,       // formato de pílula
  borderWidth: 1,
  overflow: 'hidden',      // faz o texto respeitar os cantos redondos
},
```

A cor muda conforme a situação do paciente:

```typescript
const STATUS_PILL = {
  'Em tratamento': { bg: colors.successBg, fg: colors.success },  // verde
  Pausado:         { bg: colors.warningBg, fg: colors.warning },  // amarelo
  Alta:            { bg: '#F1F5F9',        fg: colors.textMuted },// cinza
};
```

### Abas sublinhadas (Detalhe do paciente: Evoluções | Sessões)

```typescript
tab: { flex: 1, borderBottomWidth: 2, borderBottomColor: 'transparent' }, // linha invisível
tabActive: { borderBottomColor: colors.primary },                          // linha índigo na aba ativa
```

### Faixa colorida do serviço (Serviços)

```typescript
bar: { width: 6, borderRadius: 3, backgroundColor: colors.primary }, // ativo: índigo
barInactive: { backgroundColor: '#94A3B8' },                          // inativo: cinza
```

### Cartão de perigo (Configurações → Sair deste aparelho)

```typescript
cardDanger: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }, // fundo e borda avermelhados
```

---

## 6.6. Onde está o estilo de cada tela

Os estilos de cada tela ficam **no fim do próprio arquivo**, no bloco `const styles = StyleSheet.create({ ... })`.

| Tela (número no protótipo) | Arquivo |
|---|---|
| Login (1) | `app/src/telas/LoginScreen.tsx` + `app/src/componentes/AuthScreen.tsx` |
| Cadastro 1 e 2 (2, 3) | `app/src/telas/CadastroPasso1Screen.tsx`, `CadastroPasso2Screen.tsx` |
| Painel (4) | `app/src/telas/PainelScreen.tsx` |
| Menu lateral (6) | `app/src/componentes/AppDrawer.tsx` |
| Novo paciente (7) | `app/src/modais/NovoPacienteModal.tsx` |
| Pacientes (8) | `app/src/telas/PacientesScreen.tsx` |
| Detalhe do paciente (9) | `app/src/telas/PacienteScreen.tsx` |
| Agenda (10) | `app/src/telas/AgendaScreen.tsx` |
| Serviços (11) | `app/src/telas/ServicosScreen.tsx` |
| Configurações (12) | `app/src/telas/ConfiguracoesScreen.tsx` |
| Identidade da clínica (13) | `app/src/modais/ClinicaModal.tsx` |
| Meu acesso (15) | `app/src/modais/PerfilModal.tsx` |

---

## 6.7. Tutorial: trocar a cor principal do app

Quer ver o app verde em vez de índigo? É uma mudança de **duas linhas**:

1. Abra `app/src/theme.ts`.
2. Troque:
   ```typescript
   primary: '#4F46E5',
   primarySoft: '#EEF2FF',
   ```
   por:
   ```typescript
   primary: '#059669',
   primarySoft: '#ECFDF5',
   ```
3. Salve o arquivo. Com o app aberto no emulador, ele atualiza sozinho em 1 ou 2 segundos (**Fast Refresh**).

Botões, links, logo e abas mudam todos juntos, porque todos usam `colors.primary`.

> A sombra do botão principal (`buttonShadow`, no mesmo arquivo) tem a cor índigo escrita direto
> (`shadowColor: '#4F46E5'`). Troque ela também para a sombra combinar.
