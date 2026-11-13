# Documentação do CSS (Estilização no React Native)

Este documento explica como o visual do **Clínica Psi** foi montado com o `StyleSheet.create` do React Native, seguindo os protótipos do Penpot (telas 1 a 17).

---

## 1. Como funciona o CSS no React Native?

No React Native não existem arquivos `.css`. Cada estilo é um **objeto JavaScript** criado com `StyleSheet.create({})`:

- **Nomes em *camelCase***: `background-color` vira `backgroundColor`, `font-size` vira `fontSize`, `border-radius` vira `borderRadius`.
- **Medidas sem `px`**: `padding: 16` ou `fontSize: 15` já são pixels independentes da densidade da tela (dp).
- **Flexbox por padrão**: toda `<View>` já é flex, empilhando em coluna (`flexDirection: 'column'`). Para pôr lado a lado: `flexDirection: 'row'`.
- **Vários estilos juntos**: `style={[styles.cartao, ativo && styles.cartaoAtivo]}` aplica o segundo só quando `ativo` é verdadeiro.

```typescript
const styles = StyleSheet.create({
  titulo: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
});

<Text style={styles.titulo}>Pacientes</Text>
```

---

## 2. O tema central (`app/src/theme.ts`)

Em vez de repetir cores em cada tela, elas ficam em **um só arquivo**. Se a cor mudar no protótipo, troca-se num lugar só.

### 2.1. Paleta de cores (`colors`)

| Nome | Cor | Onde é usada |
| :--- | :--- | :--- |
| `bg` | `#F1F3F8` | Fundo de todas as telas |
| `surface` | `#FFFFFF` | Cartões, campos e barras |
| `border` | `#E2E8F0` | Borda de cartões, campos e botões contornados |
| `divider` | `#EEF1F6` | Linhas entre itens dentro de um cartão |
| `primary` | `#4F46E5` | Índigo: botões principais, logo, aba ativa, links |
| `primarySoft` | `#EEF2FF` | Fundo de avatares, ícones e chips selecionados |
| `text` | `#0F172A` | Títulos e nomes |
| `textMuted` | `#64748B` | Subtítulos, datas e textos de apoio |
| `label` | `#1E293B` | Rótulos dos campos (em negrito) |
| `placeholder` | `#94A3B8` | Texto de exemplo dentro dos campos |
| `success` / `successBg` | `#059669` / `#ECFDF5` | Selos "Ativo" e "Em tratamento" |
| `warning` / `warningBg` | `#B45309` / `#FFFBEB` | Selo "Pausado" |
| `error` / `errorBg` | `#DC2626` / `#FEF2F2` | Erros, "Excluir" e "Sair deste aparelho" |
| `drawer` | `#111827` | Fundo escuro do menu lateral |

### 2.2. Cantos arredondados (`radius`)

| Nome | Valor | Onde |
| :--- | :--- | :--- |
| `input` | `12` | Campos de texto |
| `button` | `12` | Botões principais |
| `card` | `16` | Cartões |
| `pill` | `999` | Selos e chips (formato de pílula) |

### 2.3. Estilos prontos para reaproveitar

```typescript
// Cartão branco do protótipo: borda fina + sombra suave
export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.card,   // 16
  borderWidth: 1,
  borderColor: colors.border,
  ...cardShadow,
};

// Sombra índigo do botão principal
export const buttonShadow = {
  shadowColor: '#4F46E5',
  shadowOpacity: 0.28,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,                // a sombra no Android usa "elevation"
};
```

O `...card` (*spread*) copia todas as propriedades para dentro de outro estilo:

```typescript
cartaoPaciente: { ...card, padding: 16 },
```

> **Sombra no Android × iOS:** `shadowColor`, `shadowOpacity`, `shadowRadius` e `shadowOffset` funcionam no iOS. No Android, quem desenha a sombra é o `elevation`. Por isso os dois aparecem juntos.

---

## 3. Componentes reaproveitados (`app/src/componentes/`)

Cada peça visual que se repete virou um componente com o estilo dentro dele:

| Componente | Visual | Usado em |
| :--- | :--- | :--- |
| `BrandHeader` | Logo "CP" (52×52, cantos 12), título e subtítulo | Login, Cadastro |
| `FormField` / `PasswordField` | Rótulo em negrito + campo de 52 de altura, cantos 12 | Todos os formulários |
| `PrimaryButton` | Botão índigo de 52 de altura com sombra | Entrar, Continuar |
| `TextButton` | Texto cinza com ícone opcional | "Cadastrar-se", "Voltar" |
| `Stepper` | Duas pílulas: etapa ativa em índigo, concluída em verde | Cadastro 1 e 2 |
| `AppToolbar` | Barra branca: ☰, busca cinza-clara e ⋮ | Telas internas |
| `SectionCard` | Cartão com título e botão contornado à direita | Painel |
| `EmptyHero` | Círculo com "+", título, texto e botão | Listas vazias |
| `AppDrawer` | Menu lateral escuro, item ativo em índigo | Todas as telas internas |
| `SheetModal` (em `app/src/modais/`) | Formulário que sobe de baixo, com Cancelar/Salvar | Sessão, Serviço, Clínica, Perfil |

---

## 4. Padrões usados nas telas

### 4.1. Faixa de título (Painel, Pacientes, Agenda, Serviços, Configurações)
```typescript
headerRow: {
  flexDirection: 'row',            // título à esquerda, botão à direita
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.surface, // faixa branca
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  marginHorizontal: -16,           // "anula" a margem da tela: a faixa vai de ponta a ponta
  paddingHorizontal: 16,
  paddingVertical: 14,
},
title: { fontSize: 20, fontWeight: '800', color: colors.text },
subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
```

### 4.2. Avatar com iniciais (Pacientes, Detalhe)
```typescript
avatar: {
  width: 48, height: 48,
  borderRadius: 24,                // metade da largura = círculo
  backgroundColor: colors.primarySoft,
  alignItems: 'center',            // centraliza as iniciais
  justifyContent: 'center',
},
```

### 4.3. Selos coloridos (situação do paciente, serviço ativo)
```typescript
pill: {
  fontSize: 11, fontWeight: '700',
  paddingHorizontal: 14, paddingVertical: 4,
  borderRadius: 999,               // pílula
  borderWidth: 1,
  overflow: 'hidden',              // necessário para o Text respeitar o arredondado
},
```
A cor muda conforme a situação:
```typescript
const STATUS_PILL = {
  'Em tratamento': { bg: colors.successBg, fg: colors.success },  // verde
  Pausado:         { bg: colors.warningBg, fg: colors.warning },  // amarelo
  Alta:            { bg: '#F1F5F9',        fg: colors.textMuted },// cinza
};
```

### 4.4. Abas (Detalhe do paciente: Evoluções | Sessões)
```typescript
tab: { flex: 1, borderBottomWidth: 2, borderBottomColor: 'transparent' },
tabActive: { borderBottomColor: colors.primary },  // sublinhado índigo na aba ativa
```

### 4.5. Faixa colorida do serviço (Serviços)
```typescript
bar: { width: 6, borderRadius: 3, backgroundColor: colors.primary }, // ativo
barInactive: { backgroundColor: '#94A3B8' },                          // inativo
```

### 4.6. Cartão de perigo (Configurações → Sair deste aparelho)
```typescript
cardDanger: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
```

---

## 5. Onde está o estilo de cada tela

| Tela (protótipo) | Arquivo |
| :--- | :--- |
| Login (1) | `app/src/telas/LoginScreen.tsx` + `componentes/AuthScreen.tsx` |
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

Os estilos de cada tela ficam **no final do próprio arquivo**, no bloco `const styles = StyleSheet.create({ … })`.
