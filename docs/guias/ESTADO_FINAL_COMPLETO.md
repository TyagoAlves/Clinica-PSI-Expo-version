# Estado final completo — Clínica Psi (Expo Go / Snack)

**Projeto:** Clínica Psi — Prontuário para Psicólogos (React Native + Expo Go + Snack)
**Para quem:** quem nunca fez este projeto e quer copiar → colar → rodar no celular, **sem editar nada à mão**.
**O que este arquivo é:** o retrato **final e coerente** de todos os arquivos do app, já com **todas as mudanças** aplicadas ao final das fases (GUIA_01 → GUIA_13) - incluindo a navegação do menu lateral (`☰` → `Pacientes`/`Agenda`/`Serviços`) ligada pela Rota A.
**O que este arquivo não é:** tutorial de design (isso está nos guias) nem commit de build EAS. Aqui está o código pronto.

> 📌 Se você está seguindo os guias na ordem, este arquivo é o seu ponto de conferência final: o app no seu Snack/projeto precisa ficar **exatamente** assim. Se divergir em algum arquivo, a fonte da verdade é o guia da fase ou este retrato — nunca "mais ou menos".
>
> 🔗 Comentários de linha aqui são curtos de propósito. A explicação *por que* cada decisão existe (com os mockups e o passo a passo) está nos guias: `Tela 1` (GUIA_01 Login) → `Tela 2` (GUIA_02 Cadastro 1, GUIA_03B refactor, GUIA_03 navegação) → `Tela 3` (GUIA_04 Cadastro 2) → `Tela 4` (GUIA_07 Painel, GUIA_08 barras de sistema) → `Tela 5` (GUIA_09 Novo Paciente) → `Tela 6` (GUIA_10 menu) → `Tela 7` (GUIA_11 Pacientes vazio + drawer) → Tela 8 (GUIA_12 Agenda) → Tela 9 (GUIA_13 Serviços).

---

## 0. Como usar (passo a passo)

### Opção A — Snack (mais rápida, sem instalar nada)

1. Abra **https://snack.expo.dev** → projeto `@seu-usuario/clinica-psi` (ou crie um novo).
2. Crie os arquivos exatamente com os caminhos desta página, na ordem da tabela abaixo (cole o conteúdo inteiro de cada um).
3. `App.js` fica na raiz; o resto em `src/…`.
4. Clique **Run** → escaneie o QR com o **Expo Go** no celular.

### Opção B — Projeto local (pasta real)

1. `npx create-expo-app clinica` (template `blank`) → `cd clinica`
2. **`npx expo install @expo/vector-icons react-native-safe-area-context react-native-svg`** — as três dependências do app (ícones, safe areas e o vetor da Agenda). No Expo Go/Snack elas já estão no binário; no projeto local, o `expo install` alinha versões com o SDK. **Sem este passo o app quebra com `Unable to resolve module`**
3. Crie a mesma árvore de pastas e cole os mesmos arquivos (ignore `README.md` e `LICENSE` do template).
4. `npx expo start` → escaneie o QR.

### Ordem de criação dos arquivos (a ordem importa para o autocomplete, não para a build)

| # | Arquivo | Guia de origem |
|---|---|---|
| 1 | `src/theme.js` | GUIA_01 |
| 2 | `src/componentes/BrandHeader.tsx` | GUIA_02 |
| 3 | `src/componentes/AuthScreen.tsx` | GUIA_02 → GUIA_08 (versão final) |
| 4 | `src/componentes/AppScreen.tsx` | GUIA_07 → GUIA_08 (versão final) |
| 5 | `src/componentes/FormField.tsx` | GUIA_02 |
| 6 | `src/componentes/PasswordField.tsx` | GUIA_02 |
| 7 | `src/componentes/PrimaryButton.tsx` | GUIA_02 |
| 8 | `src/componentes/Stepper.tsx` | GUIA_02 (+ estado "concluído" do GUIA_04) |
| 9 | `src/componentes/InfoNote.tsx` | GUIA_02 |
| 10 | `src/componentes/TextButton.tsx` | GUIA_02 |
| 11 | `src/componentes/SectionCard.tsx` | GUIA_07 |
| 12 | `src/componentes/EmptyHero.tsx` | GUIA_07 → GUIA_11 (genérico) |
| 13 | `src/componentes/AppToolbar.tsx` | GUIA_07 (extraído na revisão da Tela 4) |
| 14 | `src/componentes/AppDrawer.tsx` | GUIA_10 |
| 15 | `src/componentes/NovoPacienteModal.tsx` | GUIA_09 |
| 16 | `src/screens/LoginScreen.tsx` | GUIA_01 → GUIA_03B (versão final) |
| 17 | `src/screens/CadastroPasso1Screen.tsx` | GUIA_02 |
| 18 | `src/screens/CadastroPasso2Screen.tsx` | GUIA_04 |
| 19 | `src/screens/PainelScreen.tsx` | GUIA_07 → GUIA_09 → GUIA_10 → GUIA_11 (final) |
| 20 | `src/screens/PacientesScreen.tsx` | GUIA_11 (final) |
| 21 | `src/screens/AgendaScreen.tsx` | GUIA_12 (Tela 8) |
| 22 | `src/screens/ServicosScreen.tsx` | GUIA_13 (Tela 9) |
| 23 | `App.js` (raiz) | GUIA_03 → GUIA_07 → GUIA_08 → GUIA_12 → GUIA_13 (final) |

> **O Snack já vem com `package.json` / `App.js`.** Não edite `package.json`. As dependências `@expo/vector-icons` e `react-native-safe-area-context` já estão no Expo Go — nada para instalar. Se você colar tudo e algo quebrar no Snack, confira o **Console**: o caminho do arquivo que ele procura sempre aparece na mensagem de erro (guia GUIA_01 §8.15 explica o processo).

---

## 1. `src/theme.js` — tokens de design (fonte única de cores)

O que faz: guarda **todas** as cores e espaçamentos do app em um lugar só. Se o indigo mudar de tom amanhã, você altera **1 linha** aqui — não dezenas espalhadas pelas telas.

```js
// src/theme.js
export const colors = {
  bg: '#F1F3F8',          // fundo geral (do mock)
  surface: '#FFFFFF',     // cartões, inputs, toolbar
  border: '#E2E8F0',      // bordas de inputs e botões neutros
  primary: '#4F46E5',     // indigo do mock (botões cheios, logo, links)
  primaryDark: '#4338CA', // hover/pressed
  text: '#0F172A',        // títulos (quase preto)
  textMuted: '#64748B',   // subtítulos, textos auxiliares
  label: '#475569',       // rótulos dos campos
  placeholder: '#94A3B8', // placeholder
  error: '#DC2626',       // erros
  errorBg: '#FEF2F2',     // fundo do box de erro
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
};
```

**Explicação rápida:**
- `export const colors` — objeto de cores nomeadas; import `{ colors }` nas outras telas/componentes
- `export const spacing` — escala de 4/8/16/24/32px (os mocks usam múltiplos de 4; nada de `17px`)
- Nunca use valores hexadecimais soltos em telas — tudo vem daqui (exceção deliberada: o menu lateral `#0F172A` é identidade própria do drawer, ver GUIA_10)

---

## 2. Componentes (`src/componentes/`)

### 2.1 `BrandHeader.tsx` — marca (CP + Clínica Psi + subtítulo)

```tsx
// src/componentes/BrandHeader.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function BrandHeader() {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.logo} accessibilityLabel="Clínica Psi">
        <Text style={styles.logoText}>CP</Text>
      </View>
      <Text style={styles.title}>Clínica Psi</Text>
      <Text style={styles.subtitle}>Prontuário psicológico</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 16 },
  logo: {
    width: 64, height: 64, borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
```

- **Por que componente?** O mesmo cabeçalho aparece em Login e Cadastro 1 e 2 — um lugar só para editar
- `accessibilityRole="header"` ajuda leitores de tela (e o Penpot) a entenderem que é o topo da tela

### 2.2 `AuthScreen.tsx` — moldura das telas pré-login (com `useAuthScroll`)

```tsx
// src/componentes/AuthScreen.tsx
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // já vem no Expo Go
import { colors } from '../theme';
import BrandHeader from './BrandHeader';

// ScrollContext permite que qualquer campo chame "role até o fim" ao ganhar foco
// (sem lib de teclado-aware-scrollview — funciona em iOS e Android igual)
const ScrollContext = createContext<((opts?: { animated?: boolean }) => void) | null>(null);
export const useAuthScroll = () => useContext(ScrollContext);

export default function AuthScreen({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = useCallback((opts?: { animated?: boolean }) => {
    scrollRef.current?.scrollToEnd({ animated: true, ...opts });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* barra de status escura sobre fundo claro, translúcida (edge-to-edge) */}
      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // iOS empurra; Android encolhe
        style={styles.keyboardWrap}
      >
        <ScrollContext.Provider value={scrollToEnd}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BrandHeader />
            {children}
            <Text style={styles.footer}>
              O sistema guarda tudo apenas local. Nada é enviado para servidores.
            </Text>
          </ScrollView>
        </ScrollContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  keyboardWrap: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 72, // folga para o último campo não ficar atrás do teclado (GUIA_02 §7.11)
  },
  footer: {
    width: '100%',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
```

**Explicação rápida:**
- `SafeAreaView` é o wrapper mais externo — respeita notch/3-botões do Samsung/iPhone automaticamente (GUIA_08)
- `useAuthScroll()` é consumido por `CadastroPasso1/2`: campo baixo ao focar → tela rola sozinha
- **Nunca** escreva `StatusBar`/`ScrollView`/`KeyboardAvoidingView` dentro das telas de auth — tudo vive aqui

### 2.3 `AppScreen.tsx` — moldura das telas pós-login

```tsx
// src/componentes/AppScreen.tsx
import type { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function AppScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingHorizontal: 16,  // cartões largos, como no mock
    paddingTop: 0,          // o toolbar manda
    paddingBottom: 24,
  },
});
```

- Diferente do `AuthScreen`: **sem** marca, **sem** rodapé de privacidade — é a família pós-login
- Manter as duas molduras separadas evita que uma tela "puxe" a identidade da outra

### 2.4 `FormField.tsx` — rótulo + input padrão

```tsx
// src/componentes/FormField.tsx
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '../theme';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  id?: string; // nativeID do input (para accessibilityLabelledBy)
}

export default function FormField({ label, required, id, style, ...rest }: Props) {
  const labelId = id ? `${id}-label` : `${label}-label`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={labelId}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <TextInput
        accessibilityLabelledBy={labelId}
        nativeID={id}
        style={[styles.input, style]}
        placeholderTextColor={colors.placeholder}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
  input: {
    height: 48, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14, fontSize: 16, color: colors.text,
  },
});
```

- `{...rest}` repassa todas as props do `TextInput` (placeholder, value, onChangeText, keyboardType…) — o componente não reimplementa nada do RN
- `nativeID` + `accessibilityLabelledBy` emparelhados: o leitor de tela anuncia a senha como "Senha, campo de texto" (WCAG)

### 2.5 `PasswordField.tsx` — senha com olho mostrar/ocultar

```tsx
// src/componentes/PasswordField.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  required?: boolean;
  id?: string;
}

export default function PasswordField({ label, required, id, ...rest }: Props) {
  const [show, setShow] = useState(false); // estado encapsulado no componente
  const labelId = id ? `${id}-label` : `${label}-label`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={labelId}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabelledBy={labelId}
          nativeID={id}
          style={[styles.input, styles.inputFlex]}
          placeholder="••••••••"
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          textContentType="password"
          {...rest}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShow((v) => !v)}
          accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    height: 48, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14, fontSize: 16, color: colors.text,
  },
  inputFlex: { flex: 1 },
  eye: {
    position: 'absolute', right: 10,
    height: 48, justifyContent: 'center', paddingHorizontal: 6,
  },
});
```

### 2.6 `PrimaryButton.tsx` — CTA indigo com loading

```tsx
// src/componentes/PrimaryButton.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function PrimaryButton({ label, onPress, loading, disabled, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.disabled]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52, borderRadius: 8, width: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
```

- `disabled` deduz do `loading` — impossível tocar duplo
- `activeOpacity={0.85}` dá o press feedback (o mock não mostra, o app faz)

### 2.7 `Stepper.tsx` — etapas do cadastro (com estado "concluído")

```tsx
// src/componentes/Stepper.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface Step { n: number; label: string; }

interface Props {
  steps: Step[];
  active: number; // índice da etapa ativa (0-based): telas antes ficam "concluídas"
}

export default function Stepper({ steps, active }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Etapas do cadastro">
      {steps.map((step, i) => {
        const isActive = i === active;
        const isDone = i < active; // etapas anteriores à ativa ficam verdes com ✓
        return (
          <View key={step.n} style={[styles.chip, isDone ? styles.done : isActive ? styles.chipActive : null]}>
            {isDone
              ? <Text style={[styles.chipText, styles.chipTextDone]}>✓  {step.label}</Text>
              : <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>{step.n}  {step.label}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16, justifyContent: 'flex-start' },
  chip: {
    borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.06)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  done: { borderColor: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.10)' },
  chipTextDone: { color: '#16A34A' },
});
```

- `active={0}` desenha Passo 1 ativo (visual do GUIA_02/Tela 2); `active={1}` mostra `✓ Seus dados` verde (GUIA_04/Tela 3)

### 2.8 `InfoNote.tsx` — nota de apoio (ⓘ)

```tsx
// src/componentes/InfoNote.tsx
import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function InfoNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} style={styles.icon} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  icon: { marginTop: 1 },
  text: { fontSize: 11, color: colors.textMuted, lineHeight: 16, flexShrink: 1, flex: 1 },
});
```

### 2.9 `TextButton.tsx` — botão de texto puro ("Voltar")

```tsx
// src/componentes/TextButton.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function TextButton({ label, onPress, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      style={styles.root}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 10, paddingHorizontal: 4, alignSelf: 'flex-start' },
  text: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});
```

### 2.10 `SectionCard.tsx` — cartão padrão do Painel

```tsx
// src/componentes/SectionCard.tsx
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function SectionCard({
  title,
  actionLabel,
  onActionPress,
  children,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel ? (
          <TouchableOpacity
            onPress={onActionPress}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.chipText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  body: { alignItems: 'center', paddingVertical: 20 },
});
```

### 2.11 `EmptyHero.tsx` — estado vazio (Painel e Pacientes)

```tsx
// src/componentes/EmptyHero.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export default function EmptyHero({
  title = 'Crie seu primeiro paciente para começar',
  subtitle = 'Cadastre o primeiro paciente para acompanhar sessões, evoluções e termos LGPD em um só lugar.',
  buttonLabel = '+ Novo paciente',
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.circle}><Text style={styles.plus}>+</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button" accessibilityLabel={buttonLabel}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: 16,
    paddingVertical: 28, paddingHorizontal: 16,
    alignItems: 'center', gap: 12, marginTop: 12,
  },
  circle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(79, 70, 229, 0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  plus: { fontSize: 32, fontWeight: '400', color: '#4F46E5', marginTop: 2 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center', paddingHorizontal: 12 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 },
  button: {
    height: 44, borderRadius: 8, paddingHorizontal: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
```

- Sem props: textos do Painel (do mock). Com props: textos do Pacientes (GUIA_11) — mesmo componente

### 2.12 `AppDrawer.tsx` — menu lateral com navegação (Rota A)

```tsx
// src/componentes/AppDrawer.tsx
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void; // sem isso, o item só fecha o menu
};

const DEFAULT_ITEMS: DrawerItem[] = [
  { key: 'painel',        label: 'Painel',        icon: 'grid-outline',        active: true },
  { key: 'pacientes',     label: 'Pacientes',     icon: 'people-outline' },
  { key: 'agenda',        label: 'Agenda',        icon: 'calendar-outline' },
  { key: 'servicos',      label: 'Serviços',      icon: 'medkit-outline' },
  { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  items?: DrawerItem[];
  clinic?: { name: string; unit: string };
  professional?: { initials: string; name: string; role: string };
};

export default function AppDrawer({
  visible,
  onClose,
  items = DEFAULT_ITEMS,
  clinic = { name: 'Clínica Psi', unit: 'Unidade Pinheiros' },
  professional = { initials: 'AS', name: 'Ana Souza', role: 'Psicóloga · CRP 06/123456' },
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidthRef = useRef(Math.min(270, Math.round(width * 0.72)));
  panelWidthRef.current = Math.min(270, Math.round(width * 0.72));

  const translateX = useRef(new Animated.Value(-panelWidthRef.current)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    const width = panelWidthRef.current;
    if (visible) {
      setMounted(true);
      translateX.setValue(-width);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -width, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible, fade, translateX]);

  if (!mounted) return null; // desmontado: some da árvore e não anima

  // item ativo: o marcado com active:true; se nenhum, assume o primeiro
  const activeItem = items.find((i) => i.active)?.key ?? items[0]?.key;

  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade }]} accessibilityViewIsModal>
        {/* tocar fora do painel fecha */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fechar menu" />

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidthRef.current,
              maxWidth: panelWidthRef.current,
              paddingBottom: Math.max(18, insets.bottom + 12), // acima da barra do Samsung/iPhone
              transform: [{ translateX }],
            },
          ]}
        >
          {/* marca */}
          <View style={styles.brandRow}>
            <View style={styles.logo} accessibilityLabel="Clínica Psi">
              <Text style={styles.logoText}>CP</Text>
            </View>
            <View>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicUnit}>{clinic.unit}</Text>
            </View>
          </View>

          {/* itens do menu */}
          <View style={styles.items}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.item, item.key === activeItem && styles.itemActive]}
                onPress={() => {
                  item.onPress?.();   // primeiro o callback (se existir)...
                  onClose();          // ...depois fecha o menu
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: item.key === activeItem }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.key === activeItem ? '#FFFFFF' : '#CBD5E1'}
                  style={styles.itemIcon}
                />
                <Text style={[styles.itemLabel, item.key === activeItem && styles.itemLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* rodapé fixo */}
          <View style={styles.footer}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{professional.initials}</Text></View>
            <View style={styles.footerMeta}>
              <Text style={styles.footerName}>{professional.name}</Text>
              <Text style={styles.footerRole}>{professional.role}</Text>
            </View>
            <Text style={styles.footerArrow}>→</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)' },
  panel: {
    flex: 1, maxWidth: 270, width: '72%',
    backgroundColor: '#0F172A',
    paddingTop: 40, paddingHorizontal: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22, paddingHorizontal: 4 },
  logo: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  clinicName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  clinicUnit: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  items: { flex: 1, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 42, paddingHorizontal: 12, borderRadius: 10 },
  itemActive: { backgroundColor: '#4F46E5' },
  itemIcon: { width: 22, textAlign: 'center' },
  itemLabel: { fontSize: 15, color: '#CBD5E1', fontWeight: '500' },
  itemLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 14, paddingBottom: 6,
    borderTopWidth: 1, borderTopColor: '#1E293B', marginTop: 8,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerMeta: { flex: 1 },
  footerName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerRole: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  footerArrow: { color: '#CBD5E1', fontSize: 18 },
});
```

**Explicação rápida:**
- `items` é injetável — as chamadas passam a lista com `onPress`; `DEFAULT_ITEMS` existe só como fallback e **não** navega (por design; ver GUIA_10 §4)
- Animação 100% via `Animated` nativo (`useNativeDriver: true`) — nenhum pacote novo
- O item chamador (`PainelScreen`/`PacientesScreen`) monta a lista com o callback `onNavegar` — este componente não conhece as rotas (acoplamento zero)

### 2.13 `NovoPacienteModal.tsx` — modal de cadastro de paciente

```tsx
// src/componentes/NovoPacienteModal.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import FormField from './FormField';

// Catálogo temporário — vira dado vindo de `services/` na fase de persistência (GUIA_05)
const SERVICES = ['Psicoterapia', 'Avaliação', 'Acompanhamento'];
const SITUACOES = ['Em tratamento', 'Pausado', 'Alta'];
const PROFESSIONALS = ['Ana Souza', 'Marcos Lima', 'Clínica Psi'];
const DEFAULT_DATE = '08/11/2026';

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.fieldRow}>{children}</View>
);

// Picker simples (ciclo por toque) — sem @react-native-picker/picker nesta fase
const PickerRow = ({ label, required, value, onPress }: {
  label: string; required?: boolean; value: string; onPress: () => void;
}) => (
  <View style={styles.fieldCol}>
    <Text style={styles.label}>{label}{required ? <Text style={styles.req}> *</Text> : null}</Text>
    <TouchableOpacity style={styles.picker} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Selecionar ${label}: ${value}`}>
      <Text style={styles.pickerText} numberOfLines={1}>{value}</Text>
      <Ionicons name="chevron-down-outline" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

export type NovoPacientePayload = {
  nome: string; telefone: string; email: string; nascimento: string; documento: string;
  servico: string; inicio: string; situacao: string; profissional: string;
  endereco: string; responsavel: string; descricao: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (payload: NovoPacientePayload) => void;
};

export default function NovoPacienteModal({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  // Animação controlada pelo componente: a janela aparece e desaparece
  // com fade + leve escala (0.95 → 1), assim como o backdrop — nada desliza.
  // Mesmo padrão do AppDrawer, mas sem deslocamento nenhum.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      fade.setValue(0);
      scale.setValue(0.95);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible, fade, scale]);
  const [nome, setNome]           = useState('');
  const [telefone, setTelefone]   = useState('');
  const [email, setEmail]         = useState('');
  const [nascimento, setNascimento]= useState('');
  const [documento, setDocumento] = useState('');
  const [servico, setServico]     = useState(SERVICES[0]);
  const [inicio, setInicio]       = useState(DEFAULT_DATE);
  const [situacao, setSituacao]   = useState(SITUACOES[0]);
  const [profissional, setProfissional] = useState(PROFESSIONALS[0]);
  const [endereco, setEndereco]   = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const reset = useCallback(() => {
    setNome(''); setTelefone(''); setEmail(''); setNascimento(''); setDocumento('');
    setServico(SERVICES[0]); setInicio(DEFAULT_DATE); setSituacao(SITUACOES[0]); setProfissional(PROFESSIONALS[0]);
    setEndereco(''); setResponsavel(''); setDescricao(''); setError(null); setSaving(false);
  }, []);

  const close = useCallback(() => { reset(); onClose(); }, [onClose, reset]);

  const handleSubmit = useCallback(() => {
    if (!nome.trim())     { setError('Informe o nome completo.'); return; }
    if (!telefone.trim()) { setError('Informe um telefone de contato.'); return; }
    if (!servico.trim())  { setError('Selecione o serviço.'); return; }

    Keyboard.dismiss();
    setError(null);
    setSaving(true);

    const payload: NovoPacientePayload = {
      nome: nome.trim(), telefone: telefone.trim(), email: email.trim(),
      nascimento: nascimento.trim(), documento: documento.trim(),
      servico, inicio, situacao, profissional,
      endereco: endereco.trim(), responsavel: responsavel.trim(), descricao: descricao.trim(),
    };

    if (onSaved) { onSaved(payload); close(); return; }
    // sem pai controlando: mostra sucesso local
    setSaving(false);
    Alert.alert('Paciente cadastrado', 'Já aparece para o seu atendimento.', [{ text: 'OK', onPress: close }]);
  }, [nome, telefone, servico, inicio, situacao, profissional, email, nascimento, documento,
      endereco, responsavel, descricao, onSaved, close]);

  if (!mounted) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fade, paddingTop: insets.top }]} accessibilityViewIsModal>
        <Animated.View style={[styles.sheet, { transform: [{ scale }] }]}>
          {/* header */}
          <View style={styles.header}>
            <Text style={styles.title}>Novo paciente</Text>
            <TouchableOpacity onPress={close} style={styles.close}
              accessibilityLabel="Fechar" accessibilityRole="button" accessibilityHint="Fecha o formulário sem salvar">
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* conteúdo rolável */}
          <ScrollView contentContainerStyle={styles.scrollContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}>
            <FormField label="Nome completo" required placeholder="Como o paciente deve aparecer no sistema"
              value={nome} onChangeText={(t) => { setNome(t); if (error) setError(null); }}
              autoCapitalize="words" maxLength={80} returnKeyType="next" />

            <FieldRow>
              <View style={styles.fieldCol}>
                <FormField label="Telefone" required placeholder="(11) 3000-0000"
                  value={telefone} onChangeText={(t) => { setTelefone(t); if (error) setError(null); }}
                  keyboardType="phone-pad" maxLength={16} returnKeyType="next" />
              </View>
              <View style={styles.fieldCol}>
                <FormField label="E-mail" placeholder="nome@clinica.com.br"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
                  maxLength={80} returnKeyType="next" />
              </View>
            </FieldRow>

            <FieldRow>
              <View style={styles.fieldCol}>
                <FormField label="Nascimento" placeholder="DD/MM/AAAA"
                  value={nascimento} onChangeText={setNascimento}
                  keyboardType="number-pad" maxLength={10} returnKeyType="next" />
              </View>
              <View style={styles.fieldCol}>
                <FormField label="Documento" placeholder="CPF ou RG"
                  value={documento} onChangeText={setDocumento}
                  autoCorrect={false} maxLength={20} returnKeyType="next" />
              </View>
            </FieldRow>

            <FieldRow>
              <PickerRow label="Serviço" required value={servico} onPress={() => {
                const next = SERVICES[(SERVICES.indexOf(servico) + 1) % SERVICES.length];
                setServico(next);
              }} />
              <View style={styles.fieldCol}>
                <FormField label="Início do tratamento" value={inicio} onChangeText={setInicio}
                  keyboardType="number-pad" maxLength={10} returnKeyType="next" />
              </View>
            </FieldRow>

            <FieldRow>
              <PickerRow label="Situação" value={situacao} onPress={() => {
                const next = SITUACOES[(SITUACOES.indexOf(situacao) + 1) % SITUACOES.length];
                setSituacao(next);
              }} />
              <PickerRow label="Profissional responsável" value={profissional} onPress={() => {
                const next = PROFESSIONALS[(PROFESSIONALS.indexOf(profissional) + 1) % PROFESSIONALS.length];
                setProfissional(next);
              }} />
            </FieldRow>

            <FormField label="Endereço" placeholder="Rua e número" value={endereco}
              onChangeText={setEndereco} maxLength={160} returnKeyType="next" />

            <FormField label="Responsável" placeholder="Nome do responsável" value={responsavel}
              onChangeText={setResponsavel} autoCapitalize="words" maxLength={80} returnKeyType="next" />

            <View style={styles.descriptionWrap}>
              <Text style={styles.label}>Descrição / queixa principal</Text>
              <TextInput style={styles.multiline} placeholder="O que trouxe o paciente até o atendimento?"
                placeholderTextColor={colors.placeholder} value={descricao} onChangeText={setDescricao}
                multiline textAlignVertical="top" maxLength={500} />
            </View>

            {error ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* rodapé com folga acima da barra do sistema */}
          <View style={[styles.footer, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={close}
              accessibilityRole="button" accessibilityLabel="Cancelar">
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleSubmit}
              activeOpacity={0.85} disabled={saving}
              accessibilityRole="button" accessibilityLabel="Cadastrar paciente"
              accessibilityHint="Cadastra o paciente e fecha o formulário">
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonPrimaryText}>Cadastrar paciente</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%', maxWidth: 480, backgroundColor: colors.surface,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    overflow: 'hidden', maxHeight: '96%',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  closeText: { fontSize: 24, lineHeight: 26, color: colors.textMuted, fontWeight: '500' },
  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
  fieldRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  fieldCol: { flex: 1, minWidth: 0, marginBottom: 12 }, // minWidth: 0 evita colapso da 2ª coluna
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
  picker: {
    height: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pickerText: { fontSize: 15, color: colors.text, flexShrink: 1 },
  descriptionWrap: { marginBottom: 4 },
  multiline: {
    minHeight: 96, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: colors.text,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginTop: 4, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 16, justifyContent: 'center',
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  buttonSecondary: {
    height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
  },
  buttonSecondaryText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  buttonPrimary: {
    height: 44, borderRadius: 8, backgroundColor: colors.primary,
    paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center',
  },
  buttonPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
```

**Explicação rápida:**
- `animationType="none"` + animação controlada: `fade` na janela e no backdrop + leve escala (0.95 → 1) — a janela aparece suavemente; nada desliza (mesma família do `AppDrawer`, sem deslocamento)
- `Modal transparent animationType="none"` + animação controlada de aparecimento (`fade` + escala 0.95→1) — a janela surge suavemente; o botão Voltar do Android fecha via `onRequestClose`
- `fieldCol = { flex: 1, minWidth: 0 }` — a regra de ouro das linhas de 2 campos: sem `minWidth: 0`, a coluna com placeholder longo colapsa (GUIA_09 §9.1)
- Validar → `setSaving(true)` → `onSaved(payload)` (o pai decide o destino; se não houver pai, exibe Alert local)
- Serviços/Situações/Profissionais são **mock**; na fase de persistência (GUIA_05) viram dados reais

### 2.14 `AppToolbar.tsx` — a barra superior (☰ + busca), reutilizada por todas as telas

```tsx
// src/componentes/AppToolbar.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Barra superior das telas pós-login (Painel, Pacientes, futuramente Agenda…).
// Contém o botão ☰ (quem abre o drawer é a tela, via onMenuPress) e o campo de busca.
// O visual é o do mock — muda apenas o comportamento: no Painel a busca ainda é
// fachada (searchDisabled, lista não existe); na tela Pacientes ela é controlada.
// Barra superior das telas pós-login (Painel, Pacientes, Agenda…).
// ☰ sempre abre o drawer; a busca é fachada ou controlada; à direita,
// opcional, um botão de ação (⋮) para a tela que precisar de "mais ações".
type Props = {
  onMenuPress: () => void;
  search?: string;                  // valor controlado (padrão: '')
  onChangeSearch?: (text: string) => void;
  searchDisabled?: boolean;         // Painel/Agenda: busca de fachada até a lista existir
  placeholder?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;  // ex.: 'ellipsis-vertical'
  onRightActionPress?: () => void;
  rightActionLabel?: string;                          // a11y (ex.: 'Mais ações')
};

export default function AppToolbar({
  onMenuPress,
  search = '',
  onChangeSearch,
  searchDisabled = false,
  placeholder = '⌕ Buscar paciente pelo nome ou telefone…',
  rightActionIcon,
  onRightActionPress,
  rightActionLabel,
}: Props) {
  return (
    <View style={styles.toolbar}>
      {/* ☰ — cada tela decide o destino (aqui, abre o próprio AppDrawer) */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {searchDisabled ? (
        // Painel: campo desabilitado (o placeholder é o mesmo do mock)
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={false}
          accessibilityLabel="Buscar paciente"
        />
      ) : (
        // Pacientes: campo controlado (filtra a lista no futuro; hoje é busca em memória)
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={onChangeSearch}
          accessibilityLabel="Buscar paciente"
        />
      )}

      {/* ⋮ — botão de ação opcional, à direita */}
      {rightActionIcon ? (
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={onRightActionPress}
          accessibilityRole="button"
          accessibilityLabel={rightActionLabel ?? 'Ação'}
        >
          <Ionicons name={rightActionIcon} size={18} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,   // estica até as bordas (anula o padding da AppScreen)
    paddingHorizontal: 16,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.text },
  search: {
    flex: 1, height: 42, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12, fontSize: 13, color: colors.text,
  },
});
```

**Explicação rápida:**
- `onMenuPress` é obrigatório — o componente não decide o que o ☰ abre; cada tela passa o seu `onPress={() => setDrawerOpen(true)}`
- `searchDisabled` existe por enquanto: o Painel ainda não tem lista para filtrar; o campo mostra o placeholder mas não aceita digitação (fiel ao mock)
- Quando a lista de pacientes chegar (Busca/Filter), a barra responde **uma única vez** para as duas telas — nenhum código duplicado
- As hairlines entre a toolbar e a linha do título continuam vindo da borda da toolbar + borda da `headerRow` de cada tela (o mock mostra as duas)
- `rightActionIcon`/`onRightActionPress`/`rightActionLabel` são **opcionais** — só a Agenda usa `⋮` (`ellipsis-vertical`); sem eles o componente se comporta exatamente como antes


---

## 3. `src/screens/` — as seis telas

### 3.1 `LoginScreen.tsx` (versão final, após GUIA_03B)

```tsx
// src/screens/LoginScreen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import AuthScreen from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PasswordField from '../componentes/PasswordField';
import PrimaryButton from '../componentes/PrimaryButton';
import TextButton from '../componentes/TextButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  onCadastrar?: () => void;
  onEntrar?: () => void;
};

export default function LoginScreen({ onCadastrar, onEntrar }: Props = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEntrar = useCallback(() => {
    if (!EMAIL_REGEX.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    if (password.length < 6) { setError('A senha precisa de ao menos 6 caracteres.'); return; }

    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    setTimeout(() => { // MOCK — vira chamada ao auth service na fase real
      setLoading(false);
      if (onEntrar) return onEntrar();
      Alert.alert('Login (demonstração)', 'Estrutura, UX e validação prontas. Navegue/conecte para prosseguir.', [{ text: 'OK' }]);
    }, 900);
  }, [email, password, onEntrar]);

  const handleCadastrar = useCallback(() => {
    if (onCadastrar) return onCadastrar();
    Alert.alert('Cadastro', 'O fluxo de cadastro em 2 passos entra quando a navegação estiver ligada.', [{ text: 'Entendi' }]);
  }, [onCadastrar]);

  return (
    <AuthScreen>
      <FormField id="email" label="E-mail" required placeholder="nome@clinica.com.br"
        value={email} onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
        keyboardType="email-address" autoCapitalize="none" autoComplete="email"
        autoCorrect={false} textContentType="emailAddress" maxLength={80} returnKeyType="next" />

      <PasswordField id="senha" label="Senha" required value={password}
        onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
        autoComplete="password" textContentType="password" autoCapitalize="none" autoCorrect={false} />

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton label="Entrar" onPress={handleEntrar} loading={loading} />
      <TextButton label="Cadastrar-se" onPress={handleCadastrar} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10, backgroundColor: colors.errorBg,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

**Explicação rápida:** validação antes de tudo (UX), `onEntrar`/`onCadastrar` opcionais (funciona sozinho no Snack e conectado na Rota A); a marca, as barras de sistema e o rodapé vêm do `AuthScreen`.

### 3.2 `CadastroPasso1Screen.tsx`

```tsx
// src/screens/CadastroPasso1Screen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen, { useAuthScroll } from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PasswordField from '../componentes/PasswordField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import InfoNote from '../componentes/InfoNote';
import TextButton from '../componentes/TextButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;

type Props = {
  onVoltar?: () => void;
  onContinuar?: () => void;
  navigation?: { goBack: () => void };
};

export default function CadastroPasso1Screen({ onVoltar, onContinuar, navigation }: Props = {}) {
  const scrollToEnd = useAuthScroll();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [crp, setCrp] = useState('');
  const [funcao, setFuncao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => { if (error) setError(null); };

  const handleContinuar = useCallback(() => {
    if (!nome.trim()) { setError('Informe o nome.'); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    if (senha.length < 6) { setError('A senha precisa de ao menos 6 caracteres.'); return; }
    if (senha !== confirmarSenha) { setError('As senhas não são iguais.'); return; }
    if (crp.trim() && !CRP_REGEX.test(crp.trim())) {
      setError('CRP no formato CRP 06/00000, ex.: CRP 06/123456.');
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    setTimeout(() => { // MOCK
      setLoading(false);
      if (onContinuar) return onContinuar();
      Alert.alert('Cadastro (demonstração)', 'E-mail válido, senha confirmada. O passo 2 (Dados da clínica) entra na próxima tela.', [{ text: 'OK' }]);
    }, 900);
  }, [nome, email, senha, confirmarSenha, crp, onContinuar]);

  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert('Voltar', 'A navegação entra na próxima fase. Por enquanto, a tela de login é onde tudo começa.', [{ text: 'Entendi' }]);
  }, [onVoltar, navigation]);

  return (
    <AuthScreen>
      <Stepper steps={[{ n: 1, label: 'Seus dados' }, { n: 2, label: 'Dados da clínica' }]} active={0} />
      <Text style={styles.sectionTitle}>Quem vai usar o sistema</Text>

      <FormField id="nome" label="Nome completo" required placeholder="Como você quer aparecer no sistema"
        value={nome} onChangeText={(t) => { setNome(t); clearError(); }}
        onFocus={() => scrollToEnd?.()} autoCapitalize="words" maxLength={80} returnKeyType="next" />
      <FormField id="email" label="E-mail de acesso" required placeholder="nome@clinica.com.br"
        value={email} onChangeText={(t) => { setEmail(t); clearError(); }}
        onFocus={() => scrollToEnd?.()} keyboardType="email-address" autoCapitalize="none"
        autoComplete="email" autoCorrect={false} textContentType="emailAddress" maxLength={80} returnKeyType="next" />
      <PasswordField id="senha" label="Senha (mínimo 6)" required value={senha}
        onChangeText={(t) => { setSenha(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoComplete="password" textContentType="password" autoCapitalize="none" autoCorrect={false}
        maxLength={64} returnKeyType="next" />
      <PasswordField id="confirmar" label="Repetir a senha" required value={confirmarSenha}
        onChangeText={(t) => { setConfirmarSenha(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCapitalize="none" autoCorrect={false} returnKeyType="go" onSubmitEditing={handleContinuar} />
      <FormField id="crp" label="CRP" placeholder="CRP 06/00000"
        value={crp} onChangeText={(t) => { setCrp(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCapitalize="characters" autoCorrect={false} maxLength={24} returnKeyType="next" />
      <FormField id="funcao" label="Função" placeholder="Psicólogo(a), administrador…"
        value={funcao} onChangeText={(t) => { setFuncao(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCapitalize="sentences" maxLength={80} returnKeyType="go" onSubmitEditing={handleContinuar} />

      <InfoNote>
        A senha não é guardada: o sistema guarda só um derivado dela, e é esse
        derivado que compara no login.
      </InfoNote>

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton label="Continuar  →" onPress={handleContinuar} loading={loading}
        accessibilityLabel="Continuar para o passo Dados da clínica" />
      <TextButton label="Voltar" onPress={handleVoltar} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { alignSelf: 'flex-start', fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

**Explicação rápida:** validação na ordem do wizard web (nome → e-mail → senha → confirmação → CRP), primeira falha para; `useAuthScroll` faz a tela rolar até o campo de senha/função; `active={0}` no Stepper.

### 3.3 `CadastroPasso2Screen.tsx`

```tsx
// src/screens/CadastroPasso2Screen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen, { useAuthScroll } from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import TextButton from '../componentes/TextButton';

const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11}|\d{14})$/;

type Props = {
  onVoltar?: () => void;
  onConcluir?: () => void;
  navigation?: { replace?: (name: 'Painel') => void; goBack?: () => void };
};

export default function CadastroPasso2Screen({ onVoltar, onConcluir, navigation }: Props = {}) {
  const scrollToEnd = useAuthScroll();
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [sigla, setSigla] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => { if (error) setError(null); };

  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert('Voltar', 'Sem navegação, este fluxo termina aqui.', [{ text: 'Entendi' }]);
  }, [onVoltar, navigation]);

  const handleConcluir = useCallback(() => {
    if (!nome.trim()) { setError('Informe o nome da clínica.'); return; }
    if (cnpj.trim() && !CNPJ_REGEX.test(cnpj.trim())) {
      setError('CNPJ no formato 00.000.000/0001-90.');
      return;
    }
    setError(null);
    setLoading(true);
    Keyboard.dismiss();
    setTimeout(() => { // MOCK
      setLoading(false);
      if (onConcluir) return onConcluir();
      if (navigation?.replace) return navigation.replace('Painel');
      Alert.alert('Cadastro concluído', 'Fluxo avançará para o Painel quando a navegação estiver ligada.', [{ text: 'OK' }]);
    }, 900);
  }, [nome, cnpj, onConcluir, navigation]);

  return (
    <AuthScreen>
      <Stepper steps={[{ n: 1, label: 'Seus dados' }, { n: 2, label: 'Dados da clínica' }]} active={1} />
      <Text style={styles.sectionTitle}>Sua clínica</Text>
      <Text style={styles.helper}>
        Estes dados aparecem no cabeçalho das fichas, nos termos e no rodapé dos documentos.
        Dá para ajustar depois em Configurações.
      </Text>

      <FormField id="clinica" label="Nome da clínica" required placeholder="ClínicaPsi"
        value={nome} onChangeText={(t) => { setNome(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        maxLength={120} returnKeyType="next" />
      <FormField id="unidade" label="Unidade" placeholder="Unidade Pinheiros"
        value={unidade} onChangeText={(t) => { setUnidade(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        maxLength={64} returnKeyType="next" />
      <FormField id="responsavel" label="Responsável técnico" placeholder=""
        value={responsavel} onChangeText={setResponsavel} onFocus={() => scrollToEnd?.()}
        autoCapitalize="words" maxLength={80} returnKeyType="next" />
      <FormField id="cnpj" label="CNPJ / documento" placeholder="12.345.678/0001-90"
        value={cnpj} onChangeText={(t) => { setCnpj(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCorrect={false} maxLength={18} returnKeyType="next" />
      <FormField id="telefone" label="Telefone" placeholder="(11) 3000-0000"
        value={telefone} onChangeText={(t) => { setTelefone(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        keyboardType="phone-pad" maxLength={16} returnKeyType="next" />
      <FormField id="emailclinica" label="E-mail da clínica" placeholder="contato@clinica.com.br"
        value={email} onChangeText={(t) => { setEmail(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={80} returnKeyType="next" />
      <FormField id="endereco" label="Endereço" placeholder="Rua das Acácias, 120 - São Paulo/SP"
        value={endereco} onChangeText={(t) => { setEndereco(t); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCapitalize="sentences" maxLength={160} returnKeyType="next" />
      <FormField id="sigla" label="Sigla (aparece no ícone)" placeholder="CP"
        value={sigla} onChangeText={(t) => { setSigla(t.toUpperCase()); clearError(); }} onFocus={() => scrollToEnd?.()}
        autoCapitalize="characters" autoCorrect={false} maxLength={3} returnKeyType="go" onSubmitEditing={handleConcluir} />

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton label="Concluir e entrar  →" onPress={handleConcluir} loading={loading}
        accessibilityLabel="Concluir e entrar no Painel" />
      <TextButton label="Voltar" onPress={handleVoltar} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { alignSelf: 'flex-start', fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  helper: { alignSelf: 'flex-start', fontSize: 11, color: colors.textMuted, marginBottom: 12, lineHeight: 15 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

**Explicação rápida:** `active={1}` deixa `✓ Seus dados` verde; só o nome da clínica é obrigatório (como no mock); sigla sempre maiúscula.

### 3.4 `PainelScreen.tsx` (final, com modal + drawer + navegação)

```tsx
// src/screens/PainelScreen.tsx
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import NovoPacienteModal from '../componentes/NovoPacienteModal';
import AppDrawer from '../componentes/AppDrawer';
import type { DrawerItem } from '../componentes/AppDrawer';
import AppToolbar from '../componentes/AppToolbar';

// A tela funciona sozinha (default) ou conectada (Rota A): App.js passa onNavegar
export default function PainelScreen(
  { onNavegar }: { onNavegar: (to: 'painel' | 'pacientes' | 'agenda' | 'servicos') => void } = { onNavegar: () => {} }
) {
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Item "Pacientes" navega de verdade; "Painel" fica ativo nesta tela
  const drawerItems: DrawerItem[] = useMemo(
    () => [
      { key: 'painel',        label: 'Painel',        icon: 'grid-outline',     active: true, onPress: () => onNavegar('painel') },
      { key: 'pacientes',     label: 'Pacientes',     icon: 'people-outline',               onPress: () => onNavegar('pacientes') },
      { key: 'agenda',        label: 'Agenda',        icon: 'calendar-outline',             onPress: () => onNavegar('agenda') },
      { key: 'servicos',      label: 'Serviços',      icon: 'medkit-outline',               onPress: () => onNavegar('servicos') },
      { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
    ],
    [onNavegar]
  );

  return (
    <AppScreen>
      {/* Barra superior (☰ + busca) — componente compartilhado */}
      <AppToolbar onMenuPress={() => setDrawerOpen(true)} searchDisabled />

      {/* Título + ação */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Painel</Text>
          <Text style={styles.subtitle}>Visão geral da clínica</Text>
        </View>
        <TouchableOpacity style={styles.newPatientBtn} onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button" accessibilityLabel="Novo Paciente">
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Hero estado vazio */}
      <EmptyHero onPress={() => setNovoPacienteOpen(true)} />

      {/* Seções */}
      <SectionCard title="Sessões de hoje" actionLabel="Abrir agenda" onActionPress={() => onNavegar('agenda')}>
        <Text style={styles.muted}>Nenhuma sessão agendada para hoje.</Text>
      </SectionCard>
      <SectionCard title="Últimos registros">
        <Text style={styles.muted}>Nenhuma evolução registrada.</Text>
      </SectionCard>
      <SectionCard title="Pacientes por serviço">
        <Text style={styles.muted}>Nenhum paciente por serviço ainda.</Text>
      </SectionCard>

      {/* Modal Novo Paciente */}
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={() => setNovoPacienteOpen(false)}
      />

      {/* Menu lateral */}
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newPatientBtn: { height: 40, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
```

**Explicação rápida:** o botão `☰` só abre o drawer (`setDrawerOpen(true)`); o que cada item faz é decidido pela lista `drawerItems` — ligada ao `onNavegar` que o `App.js` passa para a tela.

### 3.5 `PacientesScreen.tsx` (final)

```tsx
// src/screens/PacientesScreen.tsx
import { useState, useMemo } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import EmptyHero from '../componentes/EmptyHero';
import AppDrawer from '../componentes/AppDrawer';
import type { DrawerItem } from '../componentes/AppDrawer';
import AppToolbar from '../componentes/AppToolbar';
import NovoPacienteModal from '../componentes/NovoPacienteModal';

export default function PacientesScreen(
  { onNavegar }: { onNavegar: (to: 'painel' | 'pacientes' | 'agenda' | 'servicos') => void } = { onNavegar: () => {} }
) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [search, setSearch] = useState('');

  const drawerItems: DrawerItem[] = useMemo(
    () => [
      { key: 'painel',        label: 'Painel',        icon: 'grid-outline',                onPress: () => onNavegar('painel') },
      { key: 'pacientes',     label: 'Pacientes',     icon: 'people-outline', active: true, onPress: () => onNavegar('pacientes') },
      { key: 'agenda',        label: 'Agenda',        icon: 'calendar-outline',             onPress: () => onNavegar('agenda') },
      { key: 'servicos',      label: 'Serviços',      icon: 'medkit-outline',               onPress: () => onNavegar('servicos') },
      { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
    ],
    [onNavegar]
  );

  const emBreve = () =>
    Alert.alert('Em breve', 'Nesta fase os dados aparecem após a persistência ser conectada.', [{ text: 'Entendi' }]);

  return (
    <AppScreen>
      {/* Barra superior (☰ + busca) — componente compartilhado */}
      <AppToolbar onMenuPress={() => setDrawerOpen(true)} search={search} onChangeSearch={setSearch} />

      {/* Título + ação */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Pacientes</Text>
          <Text style={styles.subtitle}>Cadastro e acompanhamento</Text>
        </View>
        <TouchableOpacity style={styles.newPatientBtn} onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button" accessibilityLabel="Novo Paciente">
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Chip de filtro (único por enquanto) */}
      <View style={styles.chips}>
        <TouchableOpacity style={styles.chip} onPress={emBreve} accessibilityRole="button">
          <Text style={styles.chipText}>Todos</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>0 paciente(s) em tratamento</Text>

      <EmptyHero
        title="Nenhum paciente encontrado"
        subtitle="Ajuste a busca ou cadastre um novo paciente para acompanhar."
        buttonLabel="+ Novo paciente"
        onPress={() => setNovoPacienteOpen(true)}
      />

      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={() => setNovoPacienteOpen(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newPatientBtn: { height: 40, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 12, paddingBottom: 6 },
  chip: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 8, marginBottom: 4 },
});
```

### 3.6 `AgendaScreen.tsx` (final, com CTA → NovoPacienteModal)

```tsx
// src/screens/AgendaScreen.tsx
import { useState, useMemo } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppDrawer from '../componentes/AppDrawer';
import type { DrawerItem } from '../componentes/AppDrawer';
import NovoPacienteModal from '../componentes/NovoPacienteModal';

const AgendaArt = () => (
  <Svg viewBox="79.8 237.7 200.2 141.2" width={200} height={141}>
    <Path
      d="M80.23956298828125,330.8905029296875C80.425537109375,328.65472412109375,81.1795654296875,326.6441650390625,81.794677734375,324.51275634765625C85.13323974609375,312.94598388671875,91.97869873046875,303.32183837890625,98.26266479492188,293.24957275390625C101.3292236328125,288.3349609375,103.89694213867188,283.09765625,107.15573120117188,278.3179931640625C111.11026000976562,272.5181884765625,118.21011352539062,264.64031982421875,123.6724853515625,260.2073974609375C127.26522827148438,257.2899169921875,131.38470458984375,255.1002197265625,135.4376220703125,252.9029541015625C163.50746154785156,237.6868896484375,198.5989227294922,240.36846923828125,224.67083740234375,258.4471435546875C232.49171447753906,263.87005615234375,240.30453491210938,273.6412353515625,244.0088653564453,282.3646240234375C244.77696228027344,284.17279052734375,245.1348114013672,286.16046142578125,245.75833129882812,288.02386474609375C246.23255920410156,289.43994140625,246.94561767578125,290.76055908203125,247.2860565185547,292.2218017578125C248.58612060546875,297.80133056640625,248.79469299316406,303.6953125,250.8740234375,309.0736083984375C252.4601287841797,313.176513671875,255.470458984375,316.5076904296875,257.5101318359375,320.32244873046875C258.11053466796875,321.4454345703125,258.3644714355469,322.7225341796875,258.83148193359375,323.9005126953125C259.31463623046875,325.11993408203125,260.09832763671875,326.223876953125,260.495849609375,327.4771728515625C262.4560546875,333.6661376953125,262.58734130859375,341.64739990234375,262.00091552734375,348.1109619140625C261.70050048828125,351.4136962890625,260.254638671875,354.45330810546875,258.8047180175781,357.33917236328125C251.80560302734375,371.2623291015625,236.5341033935547,377.4771728515625,221.38523864746094,378.0321044921875C210.57962036132812,378.427978515625,199.6866455078125,378.0433349609375,188.87335205078125,378.0433349609375L165.34774780273438,378.0433349609375L138.64999389648438,378.0433349609375C119.44949340820312,378.0433349609375,102.4249267578125,378.879638671875,88.97418212890625,362.8441162109375C84.91275024414062,358.0010986328125,82.140625,352.63385009765625,80.8836669921875,346.3675537109375C79.89642333984375,341.4466552734375,79.82318115234375,335.90789794921875,80.23956298828125,330.8905029296875ZM185.119873046875,275.728515625C182.91363525390625,275.7886962890625,180.18389892578125,275.5760498046875,178.04669189453125,275.8963623046875C173.36936950683594,276.59979248046875,170.07447814941406,280.1231689453125,168.97604370117188,284.5716552734375C170.81719970703125,285.84503173828125,172.755859375,287.12078857421875,174.30084228515625,288.7545166015625C174.83212280273438,289.31561279296875,176.02813720703125,291.1536865234375,176.64044189453125,291.35076904296875C177.75454711914062,291.7105712890625,180.37564086914062,291.43011474609375,181.64389038085938,291.4224853515625C185.65032958984375,291.39788818359375,189.6598358154297,291.4439697265625,193.66653442382812,291.4588623046875C207.03463745117188,291.50958251953125,220.40765380859375,291.2864990234375,233.77615356445312,291.51275634765625C233.66287231445312,303.23602294921875,233.95135498046875,314.9620361328125,233.81854248046875,326.6851806640625C233.79452514648438,328.793212890625,233.87261962890625,330.8997802734375,233.8500213623047,333.0069580078125C233.8408660888672,333.878173828125,233.95135498046875,334.770751953125,233.74298095703125,335.62786865234375C233.36598205566406,337.1824951171875,232.40402221679688,338.6649169921875,231.12384033203125,339.62298583984375C228.65338134765625,341.47247314453125,225.43313598632812,340.861083984375,222.52589416503906,340.87384033203125C216.65692138671875,340.89849853515625,210.78607177734375,341.0255126953125,204.91592407226562,341.0294189453125L205.45697021484375,341.89306640625C206.1701202392578,342.62689208984375,206.51461791992188,343.5567626953125,206.94456481933594,344.4739990234375C211.58493041992188,344.4505615234375,216.24119567871094,344.5029296875,220.88055419921875,344.6124267578125C223.81948852539062,344.6812744140625,227.0927276611328,345.074951171875,229.94717407226562,344.2833251953125C232.16827392578125,343.66748046875,234.06991577148438,342.2476806640625,235.4786834716797,340.45635986328125C236.5882110595703,339.0433349609375,237.24024963378906,337.13201904296875,237.53541564941406,335.3797607421875C237.81939697265625,333.697998046875,237.60508728027344,331.82293701171875,237.60508728027344,330.119140625C237.60418701171875,326.43194580078125,237.56756591796875,322.74261474609375,237.6466522216797,319.0565185546875C237.83770751953125,310.1478271484375,237.55848693847656,301.2320556640625,237.58746337890625,292.3240966796875C237.60418701171875,286.98126220703125,238.48011779785156,282.2806396484375,233.84368896484375,278.32598876953125C230.1805419921875,275.20196533203125,225.41159057617188,275.7490234375,220.92442321777344,275.69970703125C220.90516662597656,274.60980224609375,221.18276977539062,269.8443603515625,220.6241912841797,269.15570068359375C218.60098266601562,266.6649169921875,215.66929626464844,269.3656005859375,216.84657287597656,272.15728759765625C216.53594970703125,272.75811767578125,216.53164672851562,273.0933837890625,216.83831787109375,273.6961669921875C216.54241943359375,274.3948974609375,216.57537841796875,274.9793701171875,216.57101440429688,275.74578857421875C211.02972412109375,275.77044677734375,205.48941040039062,275.7498779296875,199.94866943359375,275.76727294921875C196.40524291992188,275.77911376953125,192.85247802734375,275.90460205078125,189.31536865234375,275.702880859375C189.35955810546875,273.25909423828125,189.59698486328125,270.8731689453125,189.07284545898438,268.46795654296875C187.73699951171875,268.19769287109375,186.7982635498047,268.19647216796875,185.45672607421875,268.43585205078125C184.83743286132812,270.81866455078125,185.11126708984375,273.27734375,185.119873046875,275.728515625ZM206.52862548828125,311.5277099609375C206.78030395507812,311.0439453125,207.10858154296875,310.54913330078125,207.25445556640625,310.01715087890625C207.48333740234375,309.18145751953125,207.49819946289062,305.0435791015625,207.23614501953125,304.24334716796875C207.01205444335938,303.55804443359375,206.59991455078125,303.01519775390625,205.97340393066406,302.65252685546875C205.0771026611328,302.1324462890625,203.72970581054688,302.3780517578125,202.729248046875,302.3658447265625C201.81613159179688,302.3536376953125,200.71343994140625,302.1873779296875,199.90509033203125,302.69122314453125C199.402587890625,303.0052490234375,198.92994689941406,303.48504638671875,198.71432495117188,304.04388427734375C198.35638427734375,304.9720458984375,198.32888793945312,309.2445068359375,198.68743896484375,310.1630859375C198.87286376953125,310.63623046875,199.2759246826172,311.0633544921875,199.70135498046875,311.3336181640625C200.79702758789062,312.02862548828125,205.15179443359375,311.66717529296875,206.52862548828125,311.5277099609375ZM214.51309204101562,304.8077392578125C214.47276306152344,306.00799560546875,214.27664184570312,308.900390625,214.6376953125,309.93560791015625C214.82904052734375,310.486083984375,215.31195068359375,310.9901123046875,215.79180908203125,311.3074951171875C216.58294677734375,311.83135986328125,221.28570556640625,311.84417724609375,222.16578674316406,311.43548583984375C223.00502014160156,311.044921875,223.55474853515625,310.18133544921875,223.60968017578125,309.27264404296875C223.72882080078125,307.3111572265625,224.12985229492188,303.99664306640625,222.35983276367188,302.73614501953125C221.4908905029297,302.1170654296875,220.45172119140625,302.2620849609375,219.43954467773438,302.2437744140625C217.51263427734375,302.2071533203125,214.60162353515625,302.1429443359375,214.51309204101562,304.8077392578125ZM132.0850830078125,306.91485595703125C131.98629760742188,308.679443359375,132.47259521484375,310.6788330078125,133.00381469726562,312.34832763671875C135.90060424804688,321.46282958984375,145.64492797851562,326.02001953125,154.66354370117188,323.072021484375C161.51751708984375,320.83099365234375,165.82504272460938,314.6302490234375,166.26174926757812,307.60235595703125C166.38449096679688,305.630615234375,165.9481658935547,303.507568359375,165.33859252929688,301.64300537109375C163.19375610351562,295.08721923828125,156.76962280273438,290.245849609375,149.81219482421875,290.10186767578125C147.19650268554688,290.047119140625,144.50765991210938,290.677001953125,142.09439086914062,291.65740966796875C140.95773315429688,292.1195068359375,139.94651794433594,292.8558349609375,138.970703125,293.5863037109375C134.65621948242188,296.81536865234375,132.38302612304688,301.55938720703125,132.0850830078125,306.91485595703125ZM198.4367218017578,322.1947021484375C198.42120361328125,323.55255126953125,198.21978759765625,326.7001953125,199.03549194335938,327.73760986328125C199.31610107421875,328.0938720703125,199.72056579589844,328.4649658203125,200.16311645507812,328.5980224609375C200.71986389160156,328.7635498046875,205.11444091796875,328.759033203125,205.69215393066406,328.61187744140625C206.07049560546875,328.51544189453125,206.404052734375,328.2674560546875,206.64285278320312,327.962890625C207.59625244140625,326.74847412109375,207.29611206054688,324.68231201171875,207.31382751464844,323.2265625C207.33059692382812,321.8275146484375,207.16513061523438,319.9561767578125,205.43719482421875,319.632568359375C204.74591064453125,319.5030517578125,204.02569580078125,319.6265869140625,203.32843017578125,319.57891845703125C201.27154541015625,319.43841552734375,198.47003173828125,319.3411865234375,198.4367218017578,322.1947021484375ZM214.67059326171875,323.248046875C214.66305541992188,324.86773681640625,214.20562744140625,327.3719482421875,215.79544067382812,328.3919677734375C216.55059814453125,328.8758544921875,217.658203125,328.68255615234375,218.51031494140625,328.6923828125C220.67156982421875,328.7193603515625,223.45668029785156,329.22442626953125,223.53427124023438,326.2044677734375C223.5758056640625,324.5902099609375,223.99354553222656,321.3966064453125,222.7274169921875,320.2369384765625C221.75994873046875,319.3515625,216.47833251953125,319.32049560546875,215.51483154296875,320.2152099609375C214.59939575195312,321.06689453125,214.67633056640625,322.09478759765625,214.67059326171875,323.248046875ZM135.41726684570312,332.99737548828125C134.38919067382812,332.8580322265625,130.513671875,334.19677734375,129.79434204101562,334.9444580078125C128.48785400390625,335.1417236328125,127.42520141601562,336.0008544921875,126.30551147460938,336.65887451171875C120.500244140625,340.07037353515625,115.63809204101562,345.75616455078125,115.158935546875,352.70562744140625C115.10626220703125,354.4241943359375,115.11605834960938,356.15045166015625,115.11685180664062,357.87115478515625C115.11685180664062,358.641357421875,115.00042724609375,359.489990234375,115.18295288085938,360.24530029296875C115.38934326171875,361.101318359375,115.98062133789062,362.26409912109375,116.88742065429688,362.3878173828125C117.08551025390625,362.90460205078125,117.38491821289062,363.1578369140625,117.94305419921875,363.33062744140625C119.00564575195312,363.65997314453125,120.26339721679688,363.5118408203125,121.36123657226562,363.503173828125C123.52023315429688,363.48492431640625,125.67984008789062,363.4315185546875,127.8388671875,363.4498291015625C139.42373657226562,363.54840087890625,151.02127075195312,363.5579833984375,162.60562133789062,363.42926025390625C162.74993896484375,362.35980224609375,162.0968017578125,361.4190673828125,161.73306274414062,360.4361572265625C161.27590942382812,359.19708251953125,160.86305236816406,357.8895263671875,160.805908203125,356.55596923828125L160.27725219726562,356.55694580078125C160.603759765625,355.67413330078125,160.09414672851562,353.35894775390625,160.08700561523438,352.22613525390625C160.18997192382812,346.3441162109375,161.41949462890625,341.9288330078125,164.91949462890625,337.095458984375C165.64300537109375,336.09674072265625,166.54412841796875,335.2696533203125,167.29119873046875,334.2979736328125C166.27243041992188,333.1290283203125,161.98959350585938,332.29052734375,160.37033081054688,331.87420654296875C154.29141235351562,330.3092041015625,147.7962188720703,330.49139404296875,141.61013793945312,331.2598876953125C139.5358428955078,331.5169677734375,137.52053833007812,332.4500732421875,135.41726684570312,332.4698486328125ZM164.17129516601562,351.17266845703125C164.13162231445312,354.0579833984375,164.67213439941406,356.986083984375,165.86068725585938,359.626220703125C172.18060302734375,373.66375732421875,191.74349975585938,375.1044921875,200.196044921875,362.341552734375C202.05499267578125,359.5360107421875,203.3204803466797,355.81878662109375,203.388916015625,352.4344482421875C203.44744873046875,349.5230712890625,202.85914611816406,346.66259765625,201.74441528320312,343.97222900390625C200.81533813476562,341.73223876953125,199.3977813720703,339.8292236328125,197.74256896972656,338.08575439453125C185.98233032226562,325.6934814453125,164.4064178466797,334.07769775390625,164.17129516601562,351.17266845703125Z"
      fill="#f0f1fb"
    />
    <Path
      d="M175.37274169921875,349.7215576171875L181.8692169189453,349.6864013671875C181.84478759765625,347.3731689453125,181.60140991210938,344.97308349609375,182.16522216796875,342.71905517578125C183.33209228515625,342.5682373046875,184.26565551757812,342.5574951171875,185.43466186523438,342.6976318359375C185.87820434570312,344.9913330078125,185.7019805908203,347.40716552734375,185.73060607910156,349.7413330078125C187.325439453125,349.69219970703125,191.53977966308594,349.1622314453125,192.57354736328125,350.5235595703125C192.90126037597656,350.9559326171875,192.88568115234375,351.5418701171875,192.96377563476562,352.053466796875L191.56459045410156,353.4476318359375L185.66473388671875,353.42230224609375C185.70758056640625,354.6287841796875,186.00485229492188,358.66180419921875,185.54893493652344,359.6427001953125C184.93719482421875,360.9581298828125,182.87225341796875,361.0985107421875,182.11546325683594,359.826904296875C181.60369873046875,358.96746826171875,181.8595428466797,354.6654052734375,181.87081909179688,353.50811767578125C180.64950561523438,353.51031494140625,179.42922973632812,353.5220947265625,178.20794677734375,353.5135498046875C175.2374725341797,353.4930419921875,173.73931884765625,352.952392578125,175.37274169921875,349.7215576171875Z"
      fill="#f0f1fb"
    />
    <Path
      d="M185.119873046875,275.728515625C185.11126708984375,273.27734375,184.83743286132812,270.81866455078125,185.45672607421875,268.43585205078125C186.7982635498047,268.19647216796875,187.73699951171875,268.19769287109375,189.07284545898438,268.46795654296875C189.59698486328125,270.8731689453125,189.35955810546875,273.25909423828125,189.31536865234375,275.702880859375C192.85247802734375,275.90460205078125,196.40524291992188,275.77911376953125,199.94866943359375,275.76727294921875C205.48941040039062,275.7498779296875,211.02972412109375,275.77044677734375,216.57101440429688,275.74578857421875C216.57537841796875,274.9793701171875,216.54241943359375,274.3948974609375,216.83831787109375,273.6961669921875C216.53164672851562,273.0933837890625,216.53594970703125,272.75811767578125,216.84657287597656,272.15728759765625C215.66929626464844,269.3656005859375,218.60098266601562,266.6649169921875,220.6241912841797,269.15570068359375C221.18276977539062,269.8443603515625,220.90516662597656,274.60980224609375,220.92442321777344,275.69970703125C225.41159057617188,275.7490234375,230.1805419921875,275.20196533203125,233.84368896484375,278.32598876953125C238.48011779785156,282.2806396484375,237.60418701171875,286.98126220703125,237.58746337890625,292.3240966796875C237.55848693847656,301.2320556640625,237.83770751953125,310.1478271484375,237.6466522216797,319.0565185546875C237.56756591796875,322.74261474609375,237.60418701171875,326.43194580078125,237.60508728027344,330.119140625C237.60508728027344,331.82293701171875,237.81939697265625,333.697998046875,237.53541564941406,335.3797607421875C237.24024963378906,337.13201904296875,236.5882110595703,339.0433349609375,235.4786834716797,340.45635986328125C234.06991577148438,342.2476806640625,232.16827392578125,343.66748046875,229.94717407226562,344.2833251953125C227.0927276611328,345.074951171875,223.81948852539062,344.6812744140625,220.88055419921875,344.6124267578125C216.24119567871094,344.5029296875,211.58493041992188,344.4505615234375,206.94456481933594,344.4739990234375C206.51461791992188,343.5567626953125,206.1701202392578,342.62689208984375,205.45697021484375,341.89306640625L204.91592407226562,341.0294189453125C210.78607177734375,341.0255126953125,216.65692138671875,340.89849853515625,222.52589416503906,340.87384033203125C225.43313598632812,340.861083984375,228.65338134765625,341.47247314453125,231.12384033203125,339.62298583984375C232.40402221679688,338.6649169921875,233.36598205566406,337.1824951171875,233.74298095703125,335.62786865234375C233.95135498046875,334.770751953125,233.8408660888672,333.878173828125,233.8500213623047,333.0069580078125C233.87261962890625,330.8997802734375,233.79452514648438,328.793212890625,233.81854248046875,326.6851806640625C233.95135498046875,314.9620361328125,233.66287231445312,303.23602294921875,233.77615356445312,291.51275634765625C220.40765380859375,291.2864990234375,207.03463745117188,291.50958251953125,193.66653442382812,291.4588623046875C189.6598358154297,291.4439697265625,185.65032958984375,291.39788818359375,181.64389038085938,291.4224853515625C180.37564086914062,291.43011474609375,177.75454711914062,291.7105712890625,176.64044189453125,291.35076904296875C176.02813720703125,291.1536865234375,174.83212280273438,289.31561279296875,174.30084228515625,288.7545166015625C172.755859375,287.12078857421875,170.81719970703125,285.84503173828125,168.97604370117188,284.5716552734375C170.07447814941406,280.1231689453125,173.36936950683594,276.59979248046875,178.04669189453125,275.8963623046875C180.18389892578125,275.5760498046875,182.91363525390625,275.7886962890625,185.119873046875,275.728515625Z"
      fill="#ccd2f4"
    />
    <Path
      d="M206.52862548828125,311.5277099609375C205.15179443359375,311.66717529296875,200.79702758789062,312.02862548828125,199.70135498046875,311.3336181640625C199.2759246826172,311.0633544921875,198.87286376953125,310.63623046875,198.68743896484375,310.1630859375C198.32888793945312,309.2445068359375,198.35638427734375,304.9720458984375,198.71432495117188,304.04388427734375C198.92994689941406,303.48504638671875,199.402587890625,303.0052490234375,199.90509033203125,302.69122314453125C200.71343994140625,302.1873779296875,201.81613159179688,302.3536376953125,202.729248046875,302.3658447265625C203.72970581054688,302.3780517578125,205.0771026611328,302.1324462890625,205.97340393066406,302.65252685546875C206.59991455078125,303.01519775390625,207.01205444335938,303.55804443359375,207.23614501953125,304.24334716796875C207.49819946289062,305.0435791015625,207.48333740234375,309.18145751953125,207.25445556640625,310.01715087890625C207.10858154296875,310.54913330078125,206.78030395507812,311.0439453125,206.52862548828125,311.5277099609375Z"
      fill="#ccd2f4"
    />
    <Path
      d="M214.51309204101562,304.8077392578125C214.60162353515625,302.1429443359375,217.51263427734375,302.2071533203125,219.43954467773438,302.2437744140625C220.45172119140625,302.2620849609375,221.4908905029297,302.1170654296875,222.35983276367188,302.73614501953125C224.12985229492188,303.99664306640625,223.72882080078125,307.3111572265625,223.60968017578125,309.27264404296875C223.55474853515625,310.18133544921875,223.00502014160156,311.044921875,222.16578674316406,311.43548583984375C221.28570556640625,311.84417724609375,216.58294677734375,311.83135986328125,215.79180908203125,311.3074951171875C215.31195068359375,310.9901123046875,214.82904052734375,310.486083984375,214.6376953125,309.93560791015625C214.27664184570312,308.900390625,214.47276306152344,306.00799560546875,214.51309204101562,304.8077392578125Z"
      fill="#ccd2f4"
    />
    <Path
      d="M198.4367218017578,322.1947021484375C198.47003173828125,319.3411865234375,201.27154541015625,319.43841552734375,203.32843017578125,319.57891845703125C204.02569580078125,319.6265869140625,204.74591064453125,319.5030517578125,205.43719482421875,319.632568359375C207.16513061523438,319.9561767578125,207.33059692382812,321.8275146484375,207.31382751464844,323.2265625C207.29611206054688,324.68231201171875,207.59625244140625,326.74847412109375,206.64285278320312,327.962890625C206.404052734375,328.2674560546875,206.07049560546875,328.51544189453125,205.69215393066406,328.61187744140625C205.11444091796875,328.759033203125,200.71986389160156,328.7635498046875,200.16311645507812,328.5980224609375C199.72056579589844,328.4649658203125,199.31610107421875,328.0938720703125,199.03549194335938,327.73760986328125C198.21978759765625,326.7001953125,198.42120361328125,323.55255126953125,198.4367218017578,322.1947021484375Z"
      fill="#ccd2f4"
    />
    <Path
      d="M214.67059326171875,323.248046875C214.67633056640625,322.09478759765625,214.59939575195312,321.06689453125,215.51483154296875,320.2152099609375C216.47833251953125,319.32049560546875,221.75994873046875,319.3515625,222.7274169921875,320.2369384765625C223.99354553222656,321.3966064453125,223.5758056640625,324.5902099609375,223.53427124023438,326.2044677734375C223.45668029785156,329.22442626953125,220.67156982421875,328.7193603515625,218.51031494140625,328.6923828125C217.658203125,328.68255615234375,216.55059814453125,328.8758544921875,215.79544067382812,328.3919677734375C214.20562744140625,327.3719482421875,214.66305541992188,324.86773681640625,214.67059326171875,323.248046875Z"
      fill="#ccd2f4"
    />
    <Path
      d="M259.51922607421875,295.5863037109375C259.59246826171875,295.10760498046875,260.0540771484375,294.78253173828125,260.08428955078125,294.30072021484375C260.10345458984375,293.9932861328125,259.95684814453125,293.61419677734375,259.91510009765625,293.30426025390625L258.46221923828125,293.2152099609375C258.44464111328125,292.64007568359375,258.5452575683594,292.2755126953125,258.06549072265625,291.9945068359375C258.8583068847656,290.50738525390625,260.1422119140625,289.3179931640625,260.91729736328125,287.7933349609375C261.483154296875,286.6783447265625,264.19647216796875,282.7115478515625,265.27044677734375,282.6824951171875C267.39776611328125,282.62451171875,268.15081787109375,284.34857177734375,267.0762939453125,286.24407958984375C266.8564147949219,286.6314697265625,266.3922119140625,286.56805419921875,266.09405517578125,286.845947265625C265.66583251953125,287.2474365234375,265.28875732421875,288.1258544921875,264.99554443359375,288.6461181640625C263.879150390625,290.62646484375,262.75848388671875,293.25054931640625,261.1418762207031,294.85968017578125C260.6868896484375,295.31256103515625,260.1239013671875,295.4429931640625,259.51922607421875,295.5863037109375Z"
      fill="#8c93f7"
    />
    <Path
      d="M264.38330078125,302.9410400390625C267.7767639160156,302.20404052734375,277.16033935546875,299.9503173828125,280,301.24822998046875L280,303.6048583984375C276.68621826171875,305.8892822265625,268.68341064453125,306.387939453125,264.66949462890625,306.387939453125C264.17742919921875,305.04901123046875,264.18170166015625,304.3509521484375,264.38330078125,302.9410400390625Z"
      fill="#8c93f7"
    />
    <Path
      d="M160.08700561523438,352.22613525390625C158.9949951171875,351.67584228515625,160.26199340820312,349.0411376953125,159.4072265625,348.1788330078125C158.97573852539062,349.73291015625,158.9589080810547,352.47509765625,159.16183471679688,354.09503173828125C159.30496215820312,355.2396240234375,159.65792846679688,356.1912841796875,159.59518432617188,357.3519287109375C160.10623168945312,357.22845458984375,160.07876586914062,357.06011962890625,160.27725219726562,356.55694580078125L160.805908203125,356.55596923828125C160.86305236816406,357.8895263671875,161.27590942382812,359.19708251953125,161.73306274414062,360.4361572265625C162.0968017578125,361.4190673828125,162.74993896484375,362.35980224609375,162.60562133789062,363.42926025390625C151.02127075195312,363.5579833984375,139.42373657226562,363.54840087890625,127.8388671875,363.4498291015625C125.67984008789062,363.4315185546875,123.52023315429688,363.48492431640625,121.36123657226562,363.503173828125C120.26339721679688,363.5118408203125,119.00564575195312,363.65997314453125,117.94305419921875,363.33062744140625C117.38491821289062,363.1578369140625,117.08551025390625,362.90460205078125,116.88742065429688,362.3878173828125C117.15170288085938,362.1162109375,117.12704467773438,362.1910400390625,117.20742797851562,361.8004150390625C115.52053833007812,361.2237548828125,115.97299194335938,358.69927978515625,115.92074584960938,357.305908203125C115.86224365234375,355.76849365234375,115.81353759765625,354.25262451171875,115.81353759765625,352.7110595703125C115.59518432617188,352.7088623046875,115.37747192382812,352.7061767578125,115.158935546875,352.70562744140625C115.63809204101562,345.75616455078125,120.500244140625,340.07037353515625,126.30551147460938,336.65887451171875C127.42520141601562,336.0008544921875,128.48785400390625,335.1417236328125,129.79434204101562,334.9444580078125L129.8922119140625,335.85125732421875L128.83523559570312,335.978759765625C128.91903686523438,336.138671875,128.86209106445312,336.3211669921875,129.1114501953125,336.34033203125C129.58078002929688,336.3760986328125,130.06063842773438,335.7996826171875,130.41006469726562,335.5552978515625C130.72439575195312,335.336181640625,131.27182006835938,335.4638671875,131.63827514648438,335.40789794921875C132.34002685546875,335.3004150390625,132.84463500976562,334.88018798828125,133.59231567382812,334.8330078125C133.59231567382812,334.57220458984375,133.59423828125,334.31060791015625,133.59573364257812,334.0491943359375C134.1868896484375,333.9957275390625,134.6075439453125,333.62823486328125,135.15859985351562,333.5487060546875C135.49545288085938,333.4998779296875,135.88442993164062,333.62286376953125,136.23533630371094,333.60577392578125C136.09707641601562,333.11004638671875,135.92672729492188,333.15936279296875,135.41726684570312,332.99737548828125L135.41726684570312,332.4698486328125C137.52053833007812,332.4500732421875,139.5358428955078,331.5169677734375,141.61013793945312,331.2598876953125C147.7962188720703,330.49139404296875,154.29141235351562,330.3092041015625,160.37033081054688,331.87420654296875C161.98959350585938,332.29052734375,166.27243041992188,333.1290283203125,167.29119873046875,334.2979736328125C166.54412841796875,335.2696533203125,165.64300537109375,336.09674072265625,164.91949462890625,337.095458984375C161.41949462890625,341.9288330078125,160.18997192382812,346.3441162109375,160.08700561523438,352.22613525390625Z"
      fill="#8c93f7"
    />
    <Path
      d="M164.17129516601562,351.17266845703125C164.4064178466797,334.07769775390625,185.98233032226562,325.6934814453125,197.74256896972656,338.08575439453125C199.3977813720703,339.8292236328125,200.81533813476562,341.73223876953125,201.74441528320312,343.97222900390625C202.85914611816406,346.66259765625,203.44744873046875,349.5230712890625,203.388916015625,352.4344482421875C203.3204803466797,355.81878662109375,202.05499267578125,359.5360107421875,200.196044921875,362.341552734375C191.74349975585938,375.1044921875,172.18060302734375,373.66375732421875,165.86068725585938,359.626220703125C164.67213439941406,356.986083984375,164.13162231445312,354.0579833984375,164.17129516601562,351.17266845703125ZM175.37274169921875,349.7215576171875C173.73931884765625,352.952392578125,175.2374725341797,353.4930419921875,178.20794677734375,353.5135498046875C179.42922973632812,353.5220947265625,180.64950561523438,353.51031494140625,181.87081909179688,353.50811767578125C181.8595428466797,354.6654052734375,181.60369873046875,358.96746826171875,182.11546325683594,359.826904296875C182.87225341796875,361.0985107421875,184.93719482421875,360.9581298828125,185.54893493652344,359.6427001953125C186.00485229492188,358.66180419921875,185.70758056640625,354.6287841796875,185.66473388671875,353.42230224609375L191.56459045410156,353.4476318359375L192.96377563476562,352.053466796875C192.88568115234375,351.5418701171875,192.90126037597656,350.9559326171875,192.57354736328125,350.5235595703125C191.53977966308594,349.1622314453125,187.325439453125,349.69219970703125,185.73060607910156,349.7413330078125C185.7019805908203,347.40716552734375,185.87820434570312,344.9913330078125,185.43466186523438,342.6976318359375C184.26565551757812,342.5574951171875,183.33209228515625,342.5682373046875,182.16522216796875,342.71905517578125C181.60140991210938,344.97308349609375,181.84478759765625,347.3731689453125,181.8692169189453,349.6864013671875Z"
      fill="#4f49e8"
    />
    <Path
      d="M132.0850830078125,306.91485595703125C132.38302612304688,301.55938720703125,134.65621948242188,296.81536865234375,138.970703125,293.5863037109375C139.94651794433594,292.8558349609375,140.95773315429688,292.1195068359375,142.09439086914062,291.65740966796875C144.50765991210938,290.677001953125,147.19650268554688,290.047119140625,149.81219482421875,290.10186767578125C156.76962280273438,290.245849609375,163.19375610351562,295.08721923828125,165.33859252929688,301.64300537109375C165.9481658935547,303.507568359375,166.38449096679688,305.630615234375,166.26174926757812,307.60235595703125C165.82504272460938,314.6302490234375,161.51751708984375,320.83099365234375,154.66354370117188,323.072021484375C145.64492797851562,326.02001953125,135.90060424804688,321.46282958984375,133.00381469726562,312.34832763671875C132.47259521484375,310.6788330078125,131.98629760742188,308.679443359375,132.0850830078125,306.91485595703125Z"
      fill="#8188f7"
    />
    <Path
      d="M258.06549072265625,291.9945068359375C258.5452575683594,292.2755126953125,258.44464111328125,292.64007568359375,258.46221923828125,293.2152099609375L259.91510009765625,293.30426025390625C259.95684814453125,293.61419677734375,260.10345458984375,293.9932861328125,260.08428955078125,294.30072021484375C260.0540771484375,294.78253173828125,259.59246826171875,295.10760498046875,259.51922607421875,295.5863037109375L259.6462707519531,296.09356689453125C257.15911865234375,295.541015625,256.8126220703125,294.194580078125,258.06549072265625,291.9945068359375Z"
      fill="#8188f7"
    />
    <Path
      d="M135.41726684570312,332.99737548828125C135.92672729492188,333.15936279296875,136.09707641601562,333.11004638671875,136.23533630371094,333.60577392578125C135.88442993164062,333.62286376953125,135.49545288085938,333.4998779296875,135.15859985351562,333.5487060546875C134.6075439453125,333.62823486328125,134.1868896484375,333.9957275390625,133.59573364257812,334.0491943359375C133.59423828125,334.31060791015625,133.59231567382812,334.57220458984375,133.59231567382812,334.8330078125C132.84463500976562,334.88018798828125,132.34002685546875,335.3004150390625,131.63827514648438,335.40789794921875C131.27182006835938,335.4638671875,130.72439575195312,335.336181640625,130.41006469726562,335.5552978515625C130.06063842773438,335.7996826171875,129.58078002929688,336.3760986328125,129.1114501953125,336.34033203125C128.86209106445312,336.3211669921875,128.91903686523438,336.138671875,128.83523559570312,335.978759765625L129.8922119140625,335.85125732421875L129.79434204101562,334.9444580078125C130.513671875,334.19677734375,134.38919067382812,332.8580322265625,135.41726684570312,332.99737548828125Z"
      fill="#8188f7"
    />
    <Path
      d="M160.08700561523438,352.22613525390625C160.09414672851562,353.35894775390625,160.603759765625,355.67413330078125,160.27725219726562,356.55694580078125C160.07876586914062,357.06011962890625,160.10623168945312,357.22845458984375,159.59518432617188,357.3519287109375C159.65792846679688,356.1912841796875,159.30496215820312,355.2396240234375,159.16183471679688,354.09503173828125C158.9589080810547,352.47509765625,158.97573852539062,349.73291015625,159.4072265625,348.1788330078125C160.26199340820312,349.0411376953125,158.9949951171875,351.67584228515625,160.08700561523438,352.22613525390625Z"
      fill="#8188f7"
    />
    <Path
      d="M115.158935546875,352.70562744140625C115.37747192382812,352.7061767578125,115.59518432617188,352.7088623046875,115.81353759765625,352.7110595703125C115.81353759765625,354.25262451171875,115.86224365234375,355.76849365234375,115.92074584960938,357.305908203125C115.97299194335938,358.69927978515625,115.52053833007812,361.2237548828125,117.20742797851562,361.8004150390625C117.12704467773438,362.1910400390625,117.15170288085938,362.1162109375,116.88742065429688,362.3878173828125C115.98062133789062,362.26409912109375,115.38934326171875,361.101318359375,115.18295288085938,360.24530029296875C115.00042724609375,359.489990234375,115.11685180664062,358.641357421875,115.11685180664062,357.87115478515625C115.11605834960938,356.15045166015625,115.10626220703125,354.4241943359375,115.158935546875,352.70562744140625Z"
      fill="#8188f7"
    />
  </Svg>
);

// Capitular o weekday vindo do pt-BR ("domingo" -> "Domingo")
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A tela funciona sozinha (sem props) ou conectada pela Rota A:
// o App.js passa onNavegar; o Drawer troca de tela de verdade.
export default function AgendaScreen(
  { onNavegar }: { onNavegar: (to: 'painel' | 'pacientes' | 'agenda' | 'servicos') => void } = { onNavegar: () => {} }
) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [offset, setOffset] = useState(0); // 0 = hoje · -1 = ontem · +1 = amanhã…

  // Item "Agenda" marcado como ativo; os demais levam para telas existentes
  const drawerItems: DrawerItem[] = useMemo(
    () => [
      { key: 'painel',    label: 'Painel',    icon: 'grid-outline',     onPress: () => onNavegar('painel') },
      { key: 'pacientes', label: 'Pacientes', icon: 'people-outline',   onPress: () => onNavegar('pacientes') },
      { key: 'agenda',    label: 'Agenda',    icon: 'calendar-outline', active: true, onPress: () => onNavegar('agenda') },
      { key: 'servicos',  label: 'Serviços',  icon: 'medkit-outline',            onPress: () => onNavegar('servicos') },
      { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
    ],
    [onNavegar]
  );

  // Data exibida no card de navegação (Hoje · DD/MM/AAAA ou Semana · DD/MM/AAAA)
  const data = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);
  const rotulo = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const titulo = offset === 0 ? `Hoje · ${rotulo}` : `${cap(data.toLocaleDateString('pt-BR', { weekday: 'long' }))} · ${rotulo}`;

  const abrirMenu = () =>
    Alert.alert('Agenda', 'Filtros e configurações da agenda entram quando a persistência for ligada.', [{ text: 'Entendi' }]);

  return (
    <AppScreen>
      {/* Barra superior — com o botão ⋮ exatamente como o mock v2 */}
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        searchDisabled
        rightActionIcon="ellipsis-vertical"
        onRightActionPress={abrirMenu}
        rightActionLabel="Mais ações"
      />

      {/* Linha de título */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Sessões por dia</Text>
        </View>
      </View>

      {/* Navegação de data (‹ Hoje · 08/11/2026 ›) */}
      <View style={styles.dateNav}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setOffset((v) => v - 1)}
          accessibilityRole="button"
          accessibilityLabel="Dia anterior"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{titulo}</Text>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setOffset((v) => v + 1)}
          accessibilityRole="button"
          accessibilityLabel="Próximo dia"
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Card de estado vazio */}
      <View style={styles.emptyCard}>
        {/* Ilustração do mock — vetor idêntico ao export do Penpot (react-native-svg) */}
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <AgendaArt />
        </View>

        <Text style={styles.emptyTitle}>Nenhum paciente cadastrado</Text>
        <Text style={styles.emptySubtitle}>
          Cadastre seu primeiro paciente e comece a agendar sessões, acompanhar evoluções e organizar documentos em um único lugar.
        </Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Cadastrar primeiro paciente"
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={styles.ctaIcon} />
          <Text style={styles.ctaText}>Cadastrar primeiro paciente</Text>
        </TouchableOpacity>

        {/* Divisor "DEPOIS DISSO, VOCÊ PODERÁ" */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>DEPOIS DISSO, VOCÊ PODERÁ</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 3 colunas de "futuro" */}
        <View style={styles.capsRow}>
          <View style={styles.capItem}>
            <View style={styles.capCircle}><Ionicons name="calendar-outline" size={22} color={colors.primary} /></View>
            <Text style={styles.capText}>Agendar{'\n'}sessões</Text>
          </View>
          <View style={styles.capItem}>
            <View style={styles.capCircle}><Ionicons name="document-text-outline" size={22} color={colors.primary} /></View>
            <Text style={styles.capText}>Registrar{'\n'}evoluções</Text>
          </View>
          <View style={styles.capItem}>
            <View style={styles.capCircle}><Ionicons name="folder-open-outline" size={22} color={colors.primary} /></View>
            <Text style={styles.capText}>Armazenar{'\n'}documentos</Text>
          </View>
        </View>
      </View>

      {/* Drawer */}
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />

      {/* Modal Novo Paciente — o CTA "Cadastrar primeiro paciente" abre aqui */}
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={() => setNovoPacienteOpen(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 12,
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dateBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 16, fontWeight: '800', color: colors.text },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16, marginTop: 12,
    paddingTop: 20, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },

  // Ilustração composta (blob + pessoa + calendário + plus), sem asset externo

  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptySubtitle: {
    fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center',
    marginTop: 8, marginBottom: 16, paddingHorizontal: 8,
  },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 10, height: 48, width: '100%',
    shadowColor: colors.primary, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ctaIcon: { marginRight: 6 },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  dividerLine: { width: 46, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: colors.textMuted },

  capsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 14 },
  capItem: { alignItems: 'center', width: 96 },
  capCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  capText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
});
```

**Explicação rápida:** a Agenda usa a `AppToolbar` com botão `⋮` (`ellipsis-vertical`, ação de "mais ações"); o card de data navega por dia (`‹`/`›`, sem swipe nesta fase); o CTA abre o mesmo `NovoPacienteModal` do Painel/Pacientes; o item `Agenda` do drawer fica ativo nesta tela; a rota `agenda` vive no `App.js` §3.7.

### 3.7 `App.js` (raiz — JavaScript puro)

```tsx
// App.js
import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
import PainelScreen from './src/screens/PainelScreen';
import PacientesScreen from './src/screens/PacientesScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import ServicosScreen from './src/screens/ServicosScreen';

function AppContent() {
  const [tela, setTela] = useState('login');

  const irLogin = useCallback(() => setTela('login'), []);
  const irCadastro1 = useCallback(() => setTela('cadastro1'), []);
  const irCadastro2 = useCallback(() => setTela('cadastro2'), []);
  const irPainel = useCallback(() => setTela('painel'), []);
  const go = useCallback((to) => setTela(to), []); // sem anotação de tipo: App.js é JS

  let conteudo;
  if (tela === 'login') {
    conteudo = <LoginScreen onCadastrar={irCadastro1} onEntrar={irPainel} />;
  } else if (tela === 'cadastro1') {
    conteudo = <CadastroPasso1Screen onVoltar={irLogin} onContinuar={irCadastro2} />;
  } else if (tela === 'cadastro2') {
    conteudo = <CadastroPasso2Screen onVoltar={irCadastro1} onConcluir={irPainel} />;
  } else if (tela === 'pacientes') {
    conteudo = <PacientesScreen onNavegar={go} />;
  } else if (tela === 'agenda') {
    conteudo = <AgendaScreen onNavegar={go} />;
  } else if (tela === 'servicos') {
    conteudo = <ServicosScreen onNavegar={go} />;
  } else {
    conteudo = <PainelScreen onNavegar={go} />;
  }

  return <View style={styles.safe}>{conteudo}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F3F8' },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
```

---

### 3.8 `ServicosScreen.tsx` (final, lista de serviços com toggles)

```tsx
// src/screens/ServicosScreen.tsx
import { useMemo, useState } from 'react';
import { Alert, Switch, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppDrawer from '../componentes/AppDrawer';
import type { DrawerItem } from '../componentes/AppDrawer';

// Ícones vetoriais extraídos do Penpot: viewBox = bounds invisível do frame,
// fills rgb→hex, matrix identidade removida, rect de bounds descartado.
// Mesma técnica do AgendaArt (GUIA_12): inline no arquivo da tela, sem asset externo.

const BrainIcon = () => (
  <Svg width={46} height={42} viewBox="33 267 45 42">
    <Path fill="#95ADCA" d="M48.54388427734375,275.4714050292969C48.520263671875,275.1231384277344,48.5263671875,274.7477722167969,48.4371337890625,274.4071044921875C48.18328857421875,273.44012451171875,47.094970703125,272.83544921875,46.33111572265625,272.3369445800781C46.8712158203125,271.7815856933594,47.39349365234375,271.2255859375,48.05487060546875,270.8149719238281C49.0218505859375,270.21453857421875,50.60687255859375,269.89178466796875,51.727783203125,270.06817626953125C52.30865478515625,270.1596374511719,52.92083740234375,270.35760498046875,53.47125244140625,270.56341552734375C53.7852783203125,270.6810302734375,54.1248779296875,270.9652404785156,54.4764404296875,270.9302673339844C55.03656005859375,270.8744201660156,55.6190185546875,270.4105224609375,56.11639404296875,270.1701354980469C56.633544921875,269.9205322265625,57.2227783203125,269.7434387207031,57.7806396484375,269.61407470703125C58.16583251953125,269.5249328613281,58.59600830078125,269.5566101074219,58.9888916015625,269.5634765625C61.15087890625,269.60235595703125,62.97100830078125,270.6659851074219,64.5181884765625,272.1170654296875C63.22711181640625,272.92034912109375,62.66729736328125,273.0677185058594,62.698974609375,274.70306396484375C62.98883056640625,274.7017517089844,63.3409423828125,274.7507629394531,63.6258544921875,274.6694030761719C64.1895751953125,274.5077209472656,64.66436767578125,273.7707214355469,65.37066650390625,273.5139465332031C67.0927734375,272.8876953125,69.18426513671875,273.599853515625,70.566162109375,274.7242736816406C71.83489990234375,275.756591796875,72.53863525390625,277.27691650390625,72.79669189453125,278.86358642578125C72.89508056640625,279.4692077636719,72.6275634765625,280.1539306640625,72.88177490234375,280.7249755859375C73.131103515625,281.284912109375,73.86749267578125,281.4070739746094,74.33416748046875,281.7105407714844C75.08575439453125,282.1989440917969,75.75750732421875,283.013671875,76.06927490234375,283.8603820800781C77.24163818359375,287.0425109863281,75.5860595703125,290.98779296875,72.30322265625,291.98675537109375C70.80682373046875,292.442138671875,69.21270751953125,292.0187683105469,67.73504638671875,291.7437438964844C67.52325439453125,292.41143798828125,67.31109619140625,293.1255798339844,66.97412109375,293.7432861328125C65.8486328125,295.8042907714844,63.7254638671875,297.1475830078125,61.4471435546875,297.4853515625C61.09234619140625,297.5379638671875,60.7171630859375,297.5115051269531,60.3585205078125,297.5392761230469C59.75054931640625,297.5862731933594,59.16058349609375,297.6885681152344,58.54742431640625,297.6607666015625C58.1470947265625,297.642822265625,57.67681884765625,297.59283447265625,57.29974365234375,297.4494323730469C56.77069091796875,297.24786376953125,56.32080078125,296.7317199707031,55.7225341796875,296.7709045410156C55.13909912109375,296.80914306640625,54.63848876953125,297.3569641113281,54.05889892578125,297.4719543457031C53.53912353515625,297.5751953125,52.97845458984375,297.7205810546875,52.44769287109375,297.7372131347656C51.94415283203125,297.75323486328125,51.43798828125,297.6483459472656,50.9483642578125,297.5477600097656C50.64990234375,297.4866638183594,50.35333251953125,297.47161865234375,50.059326171875,297.3785400390625C48.83660888671875,296.9910888671875,47.63409423828125,295.9849548339844,47.25701904296875,294.7144775390625C46.70623779296875,292.8589782714844,47.53125,290.9054870605469,49.00213623046875,289.7379150390625C49.27020263671875,289.5252685546875,49.59228515625,289.38055419921875,49.8873291015625,289.2103576660156C50.18548583984375,289.0382080078125,50.43865966796875,288.7984313964844,50.76983642578125,288.68475341796875C51.49139404296875,288.43646240234375,52.35809326171875,288.48773193359375,53.11065673828125,288.41815185546875C54.0950927734375,288.3266906738281,55.0552978515625,288.0437927246094,55.96673583984375,287.67303466796875C56.5155029296875,287.4492492675781,56.9876708984375,286.9677429199219,57.3223876953125,286.4865417480469C57.60504150390625,286.0798034667969,57.75445556640625,285.4496765136719,58.2861328125,285.2850341796875C60.0247802734375,284.7466735839844,62.15118408203125,285.48529052734375,63.42926025390625,283.820556640625C63.962890625,283.1250305175781,64.1656494140625,282.45111083984375,64.2213134765625,281.5815124511719C63.95574951171875,281.5795593261719,63.6505126953125,281.537109375,63.3865966796875,281.5916442871094C62.4736328125,281.77978515625,62.255615234375,282.9600830078125,61.40057373046875,283.2890319824219C60.18682861328125,283.75555419921875,58.15545654296875,283.5340576171875,56.8153076171875,283.5340576171875C56.6978759765625,284.00970458984375,56.580810546875,284.5029602050781,56.31500244140625,284.9223937988281C55.1878662109375,286.701171875,52.69317626953125,286.86712646484375,50.80609130859375,286.8880310058594C50.5108642578125,285.3980407714844,50.2142333984375,283.91693115234375,49.8924560546875,282.4338073730469C49.7679443359375,281.8595275878906,49.3212890625,281.2969665527344,49.468505859375,280.6811828613281C49.63018798828125,280.003662109375,50.20587158203125,279.4208984375,50.7440185546875,279.01873779296875C51.05029296875,278.7900695800781,51.4764404296875,278.5947265625,51.61688232421875,278.209228515625C51.748779296875,277.8472900390625,51.67413330078125,277.4075927734375,51.6614990234375,277.0345153808594C49.70166015625,277.2216796875,49.1285400390625,278.3117980957031,47.9730224609375,279.72076416015625C47.48248291015625,279.337890625,46.26971435546875,278.200439453125,45.702392578125,278.0955505371094C45.4090576171875,278.0413513183594,45.0633544921875,278.14520263671875,44.77618408203125,278.1864013671875C44.7978515625,278.4300842285156,44.78912353515625,278.7077331542969,44.8641357421875,278.943603515625C45.31756591796875,280.3731384277344,47.1949462890625,280.6439514160156,47.86566162109375,281.92193603515625C48.3255615234375,282.79803466796875,49.23272705078125,286.8180847167969,48.8753662109375,287.69622802734375C48.59783935546875,288.3773498535156,47.62115478515625,288.9303894042969,47.12152099609375,289.4481506347656C46.3800048828125,290.2161865234375,45.9080810546875,291.2099304199219,45.3511962890625,292.1102294921875C43.28497314453125,292.1102294921875,41.596435546875,292.13214111328125,39.563232421875,291.66107177734375C39.09649658203125,291.5529479980469,38.607177734375,291.494140625,38.16510009765625,291.29095458984375C35.15228271484375,289.90814208984375,33.94561767578125,286.78704833984375,34.56982421875,283.61212158203125C34.7117919921875,282.8905029296875,34.86669921875,282.1875,35.1900634765625,281.5177917480469C35.6243896484375,280.6191101074219,36.29193115234375,279.83837890625,37.16357421875,279.34344482421875C37.67938232421875,279.0504150390625,38.43060302734375,278.991943359375,38.81549072265625,278.5009460449219C39.18121337890625,278.0348205566406,39.1104736328125,277.233154296875,39.29833984375,276.6872863769531C39.77862548828125,275.2920227050781,40.71575927734375,274.22381591796875,42.028564453125,273.5789794921875C43.306640625,272.9510803222656,45.05621337890625,273.1245422363281,46.14190673828125,274.0451354980469C46.5458984375,274.3878173828125,46.9530029296875,275.1963195800781,47.35052490234375,275.3828430175781C47.7030029296875,275.54815673828125,48.1732177734375,275.47760009765625,48.54388427734375,275.4714050292969ZM57.632568359375,272.1644592285156C56.78167724609375,272.3431396484375,56.4957275390625,272.4339599609375,56.11029052734375,273.2300720214844C55.21636962890625,275.0777282714844,56.744140625,276.5909118652344,56.33984375,278.24517822265625C56.18658447265625,278.8714294433594,55.8660888671875,279.3966979980469,55.47479248046875,279.90240478515625C55.3311767578125,280.0882873535156,55.1180419921875,280.251953125,55.0372314453125,280.4796447753906C54.964111328125,280.68707275390625,55.00421142578125,280.9324035644531,55.12548828125,281.1114196777344C55.91845703125,282.28192138671875,56.90521240234375,281.0137634277344,57.381591796875,280.3048400878906C58.03802490234375,279.3277893066406,58.3990478515625,278.04754638671875,58.10601806640625,276.8747863769531C57.99285888671875,276.42132568359375,57.73699951171875,276.0058288574219,57.659423828125,275.5451965332031C57.5623779296875,274.9699401855469,57.4925537109375,274.48809814453125,57.65228271484375,273.91607666015625C57.7298583984375,273.639404296875,57.89874267578125,273.4045104980469,57.89776611328125,273.1085205078125C57.89678955078125,272.7857971191406,57.735107421875,272.46270751953125,57.632568359375,272.1644592285156ZM60.40020751953125,289.14306640625C59.547119140625,290.8940124511719,59.3773193359375,291.4699401855469,57.63800048828125,292.4676208496094L57.78192138671875,293.5646057128906C58.00347900390625,293.6201171875,58.2431640625,293.7151794433594,58.475341796875,293.6926574707031C59.77154541015625,293.56787109375,60.82196044921875,291.8498840332031,61.5089111328125,290.89141845703125C63.18994140625,291.0443115234375,65.0242919921875,291.0541076660156,66.593505859375,290.33380126953125C67.353759765625,289.9848937988281,68.12738037109375,289.41778564453125,68.6959228515625,288.8016662597656C71.68902587890625,285.5581359863281,70.544189453125,281.7334289550781,67.3851318359375,279.18341064453125C66.3350830078125,278.3356628417969,65.11871337890625,277.65325927734375,63.76885986328125,277.44482421875C63.027587890625,277.33050537109375,62.26080322265625,277.43145751953125,61.52667236328125,277.5362854003906C61.55352783203125,278.2651062011719,61.59393310546875,279.03021240234375,62.504638671875,279.0416259765625C62.746826171875,279.0445556640625,62.98358154296875,278.9749755859375,63.226806640625,278.9772644042969C63.8428955078125,278.98248291015625,64.6009521484375,279.174560546875,65.1478271484375,279.4630126953125C65.85223388671875,279.8348083496094,66.4517822265625,280.3404846191406,67.01678466796875,280.900390625C67.59576416015625,281.4747009277344,68.2156982421875,282.1744079589844,68.5419921875,282.9345703125C69.379638671875,284.8848571777344,68.43365478515625,287.051025390625,66.88128662109375,288.3025207519531C66.15753173828125,288.8859558105469,65.1636962890625,289.3302307128906,64.23394775390625,289.41583251953125C62.94122314453125,289.5350646972656,61.67608642578125,289.28973388671875,60.40020751953125,289.14306640625ZM36.8330078125,283.2955627441406C36.8291015625,283.56475830078125,36.7841796875,283.8760681152344,36.8543701171875,284.141357421875C37.12115478515625,285.14617919921875,38.338134765625,285.7436828613281,39.2744140625,285.941650390625C39.8018798828125,286.05303955078125,40.36456298828125,286.0867004394531,40.7659912109375,286.5080871582031C41.01434326171875,286.7691345214844,41.2371826171875,287.15753173828125,41.34869384765625,287.5011901855469C41.55926513671875,288.1499938964844,41.473876953125,289.59259033203125,42.196044921875,289.8623962402344C42.52496337890625,289.9855651855469,43.00909423828125,289.9048767089844,43.3470458984375,289.9048767089844C43.3499755859375,289.35504150390625,43.415283203125,288.7464599609375,43.31793212890625,288.20159912109375C43.21160888671875,287.60638427734375,42.7384033203125,286.5557861328125,42.83447265625,286.0108947753906C42.88946533203125,285.6999206542969,43.10546875,285.4735107421875,43.29754638671875,285.2392883300781C43.71929931640625,284.72509765625,44.38128662109375,284.00347900390625,44.27069091796875,283.27435302734375C44.2266845703125,282.9836120605469,44.0491943359375,282.6961364746094,43.9317626953125,282.43316650390625C43.67755126953125,282.47039794921875,43.37713623046875,282.47137451171875,43.1497802734375,282.60888671875C42.87847900390625,282.7725524902344,42.7115478515625,283.0995788574219,42.5631103515625,283.36907958984375C42.1776123046875,284.0688171386719,41.56927490234375,284.377197265625,40.80218505859375,284.4840087890625C40.09747314453125,284.58233642578125,39.20587158203125,284.2644958496094,38.615966796875,283.88751220703125C38.32745361328125,283.70294189453125,38.09271240234375,283.4334411621094,37.75604248046875,283.3298645019531C37.470458984375,283.2423400878906,37.124755859375,283.2936096191406,36.8330078125,283.2955627441406Z" />
    <Path fill="#6882A1" d="M69.3065185546875,308.7520446777344L62.756591796875,308.7556457519531C61.63214111328125,306.1598815917969,61.8675537109375,305.1435852050781,59.4375,303.1103820800781C58.5655517578125,302.3808898925781,57.595947265625,301.9676818847656,56.781005859375,301.1444396972656C56.3372802734375,300.69622802734375,55.67657470703125,299.37451171875,55.24127197265625,299.1719665527344C54.77850341796875,298.95703125,54.03204345703125,299.3232421875,53.53692626953125,299.3362731933594C49.1893310546875,299.4516296386719,46.497314453125,298.90081787109375,45.52099609375,294.0702819824219C41.68505859375,293.9317932128906,37.990478515625,293.9259338378906,35.10919189453125,291.01556396484375C33.56243896484375,289.45306396484375,33.0394287109375,287.908203125,33.0394287109375,285.7276611328125C33.0394287109375,284.44775390625,32.84600830078125,283.00189208984375,33.31500244140625,281.7853698730469C33.90362548828125,280.25750732421875,35.032958984375,279.16802978515625,36.35498046875,278.2696838378906C36.66455078125,278.0592956542969,37.1357421875,277.9541015625,37.35430908203125,277.6326599121094C37.5687255859375,277.31707763671875,37.599853515625,276.8424377441406,37.71368408203125,276.4814453125C38.0875244140625,275.2933349609375,38.6065673828125,274.17510986328125,39.5269775390625,273.3107604980469C41.416015625,271.53656005859375,43.09283447265625,272.4316711425781,44.77362060546875,271.6035461425781C45.281005859375,271.3536376953125,45.676513671875,270.74212646484375,46.08856201171875,270.3592529296875C46.71728515625,269.7748107910156,47.62701416015625,269.291015625,48.4222412109375,268.98297119140625C50.44903564453125,268.1972961425781,52.6585693359375,269.0450439453125,54.7119140625,268.94964599609375C55.27459716796875,268.9231872558594,55.74932861328125,268.5279235839844,56.28717041015625,268.38385009765625C58.1331787109375,267.888916015625,60.13409423828125,267.829833984375,61.96197509765625,268.46026611328125C62.9393310546875,268.79742431640625,64.1346435546875,269.4200439453125,64.89105224609375,270.13482666015625C65.38006591796875,270.5964050292969,65.8629150390625,271.3353576660156,66.46832275390625,271.6358642578125C67.20147705078125,271.9994812011719,68.10894775390625,271.9527587890625,68.8931884765625,272.1236267089844C70.3961181640625,272.4509582519531,71.9910888671875,273.705078125,72.959716796875,274.8650817871094C73.72686767578125,275.7843322753906,74.29766845703125,276.92083740234375,74.55767822265625,278.0923156738281C74.6934814453125,278.7025146484375,74.73455810546875,279.4215393066406,75.00592041015625,279.9896240234375C75.1591796875,280.30975341796875,75.55889892578125,280.4365234375,75.8076171875,280.6714172363281C76.72125244140625,281.53448486328125,77.78363037109375,282.830078125,77.9058837890625,284.147216796875C78.061767578125,285.8243713378906,78.07666015625,287.7608947753906,77.5343017578125,289.350830078125C77.33441162109375,289.9359130859375,76.82635498046875,290.49615478515625,76.70477294921875,291.0838317871094C76.2015380859375,293.5185546875,76.65692138671875,296.3393859863281,74.8587646484375,298.377197265625C73.59490966796875,299.809326171875,72.0865478515625,301.0774841308594,70.33135986328125,301.84222412109375C69.9061279296875,302.02777099609375,68.66876220703125,302.2701721191406,68.50128173828125,302.7376403808594C68.44012451171875,302.9075012207031,69.45330810546875,307.9895935058594,69.54815673828125,308.7729797363281ZM48.54388427734375,275.4714050292969C48.1732177734375,275.47760009765625,47.7030029296875,275.54815673828125,47.35052490234375,275.3828430175781C46.9530029296875,275.1963195800781,46.5458984375,274.3878173828125,46.14190673828125,274.0451354980469C45.05621337890625,273.1245422363281,43.306640625,272.9510803222656,42.028564453125,273.5789794921875C40.71575927734375,274.22381591796875,39.77862548828125,275.2920227050781,39.29833984375,276.6872863769531C39.1104736328125,277.233154296875,39.18121337890625,278.0348205566406,38.81549072265625,278.5009460449219C38.43060302734375,278.991943359375,37.67938232421875,279.0504150390625,37.16357421875,279.34344482421875C36.29193115234375,279.83837890625,35.6243896484375,280.6191101074219,35.1900634765625,281.5177917480469C34.86669921875,282.1875,34.7117919921875,282.8905029296875,34.56982421875,283.61212158203125C33.94561767578125,286.78704833984375,35.15228271484375,289.90814208984375,38.16510009765625,291.29095458984375C38.607177734375,291.494140625,39.09649658203125,291.5529479980469,39.563232421875,291.66107177734375C41.596435546875,292.13214111328125,43.28497314453125,292.1102294921875,45.3511962890625,292.1102294921875C45.9080810546875,291.2099304199219,46.3800048828125,290.2161865234375,47.12152099609375,289.4481506347656C47.62115478515625,288.9303894042969,48.59783935546875,288.3773498535156,48.8753662109375,287.69622802734375C49.23272705078125,286.8180847167969,48.3255615234375,282.79803466796875,47.86566162109375,281.92193603515625C47.1949462890625,280.6439514160156,45.31756591796875,280.3731384277344,44.8641357421875,278.943603515625C44.78912353515625,278.7077331542969,44.7978515625,278.4300842285156,44.77618408203125,278.1864013671875C45.0633544921875,278.14520263671875,45.4090576171875,278.0413513183594,45.702392578125,278.0955505371094C46.26971435546875,278.200439453125,47.48248291015625,279.337890625,47.9730224609375,279.72076416015625C49.1285400390625,278.3117980957031,49.70166015625,277.2216796875,51.6614990234375,277.0345153808594C51.67413330078125,277.4075927734375,51.748779296875,277.8472900390625,51.61688232421875,278.209228515625C51.4764404296875,278.5947265625,51.05029296875,278.7900695800781,50.7440185546875,279.01873779296875C50.20587158203125,279.4208984375,49.63018798828125,280.003662109375,49.468505859375,280.6811828613281C49.3212890625,281.2969665527344,49.7679443359375,281.8595275878906,49.8924560546875,282.4338073730469C50.2142333984375,283.91693115234375,50.5108642578125,285.3980407714844,50.80609130859375,286.8880310058594C52.69317626953125,286.86712646484375,55.1878662109375,286.701171875,56.31500244140625,284.9223937988281C56.580810546875,284.5029602050781,56.6978759765625,284.00970458984375,56.8153076171875,283.5340576171875C58.15545654296875,283.5340576171875,60.18682861328125,283.75555419921875,61.40057373046875,283.2890319824219C62.255615234375,282.9600830078125,62.4736328125,281.77978515625,63.3865966796875,281.5916442871094C63.6505126953125,281.537109375,63.95574951171875,281.5795593261719,64.2213134765625,281.5815124511719C64.1656494140625,282.45111083984375,63.962890625,283.1250305175781,63.42926025390625,283.820556640625C62.15118408203125,285.48529052734375,60.0247802734375,284.7466735839844,58.2861328125,285.2850341796875C57.75445556640625,285.4496765136719,57.60504150390625,286.0798034667969,57.3223876953125,286.4865417480469C56.9876708984375,286.9677429199219,56.5155029296875,287.4492492675781,55.96673583984375,287.67303466796875C55.0552978515625,288.0437927246094,54.0950927734375,288.3266906738281,53.11065673828125,288.41815185546875C52.35809326171875,288.48773193359375,51.49139404296875,288.43646240234375,50.76983642578125,288.68475341796875C50.43865966796875,288.7984313964844,50.18548583984375,289.0382080078125,49.8873291015625,289.2103576660156C49.59228515625,289.38055419921875,49.27020263671875,289.5252685546875,49.00213623046875,289.7379150390625C47.53125,290.9054870605469,46.70623779296875,292.8589782714844,47.25701904296875,294.7144775390625C47.63409423828125,295.9849548339844,48.83660888671875,296.9910888671875,50.059326171875,297.3785400390625C50.35333251953125,297.47161865234375,50.64990234375,297.4866638183594,50.9483642578125,297.5477600097656C51.43798828125,297.6483459472656,51.94415283203125,297.75323486328125,52.44769287109375,297.7372131347656C52.97845458984375,297.7205810546875,53.53912353515625,297.5751953125,54.05889892578125,297.4719543457031C54.63848876953125,297.3569641113281,55.13909912109375,296.80914306640625,55.7225341796875,296.7709045410156C56.32080078125,296.7317199707031,56.77069091796875,297.24786376953125,57.29974365234375,297.4494323730469C57.67681884765625,297.59283447265625,58.1470947265625,297.642822265625,58.54742431640625,297.6607666015625C59.16058349609375,297.6885681152344,59.75054931640625,297.5862731933594,60.3585205078125,297.5392761230469C60.7171630859375,297.5115051269531,61.09234619140625,297.5379638671875,61.4471435546875,297.4853515625C63.7254638671875,297.1475830078125,65.8486328125,295.8042907714844,66.97412109375,293.7432861328125C67.31109619140625,293.1255798339844,67.52325439453125,292.41143798828125,67.73504638671875,291.7437438964844C69.21270751953125,292.0187683105469,70.80682373046875,292.442138671875,72.30322265625,291.98675537109375C75.5860595703125,290.98779296875,77.24163818359375,287.0425109863281,76.06927490234375,283.8603820800781C75.75750732421875,283.013671875,75.08575439453125,282.1989440917969,74.33416748046875,281.7105407714844C73.86749267578125,281.4070739746094,73.131103515625,281.284912109375,72.88177490234375,280.7249755859375C72.6275634765625,280.1539306640625,72.89508056640625,279.4692077636719,72.79669189453125,278.86358642578125C72.53863525390625,277.27691650390625,71.83489990234375,275.756591796875,70.566162109375,274.7242736816406C69.18426513671875,273.599853515625,67.0927734375,272.8876953125,65.37066650390625,273.5139465332031C64.66436767578125,273.7707214355469,64.1895751953125,274.5077209472656,63.6258544921875,274.6694030761719C63.3409423828125,274.7507629394531,62.98883056640625,274.7017517089844,62.698974609375,274.70306396484375C62.66729736328125,273.0677185058594,63.22711181640625,272.92034912109375,64.5181884765625,272.1170654296875C62.97100830078125,270.6659851074219,61.15087890625,269.60235595703125,58.9888916015625,269.5634765625C58.59600830078125,269.5566101074219,58.16583251953125,269.5249328613281,57.7806396484375,269.61407470703125C57.2227783203125,269.7434387207031,56.633544921875,269.9205322265625,56.11639404296875,270.1701354980469C55.6190185546875,270.4105224609375,55.03656005859375,270.8744201660156,54.4764404296875,270.9302673339844C54.1248779296875,270.9652404785156,53.7852783203125,270.6810302734375,53.47125244140625,270.56341552734375C52.92083740234375,270.35760498046875,52.30865478515625,270.1596374511719,51.727783203125,270.06817626953125C50.60687255859375,269.89178466796875,49.0218505859375,270.21453857421875,48.05487060546875,270.8149719238281C47.39349365234375,271.2255859375,46.8712158203125,271.7815856933594,46.33111572265625,272.3369445800781C47.094970703125,272.83544921875,48.18328857421875,273.44012451171875,48.4371337890625,274.4071044921875C48.5263671875,274.7477722167969,48.520263671875,275.1231384277344,48.54388427734375,275.4714050292969Z" />
    <Path fill="#6882A1" d="M57.632568359375,272.1644592285156C57.735107421875,272.46270751953125,57.89678955078125,272.7857971191406,57.89776611328125,273.1085205078125C57.89874267578125,273.4045104980469,57.7298583984375,273.639404296875,57.65228271484375,273.91607666015625C57.4925537109375,274.48809814453125,57.5623779296875,274.9699401855469,57.659423828125,275.5451965332031C57.73699951171875,276.0058288574219,57.99285888671875,276.42132568359375,58.10601806640625,276.8747863769531C58.3990478515625,278.04754638671875,58.03802490234375,279.3277893066406,57.381591796875,280.3048400878906C56.90521240234375,281.0137634277344,55.91845703125,282.28192138671875,55.12548828125,281.1114196777344C55.00421142578125,280.9324035644531,54.964111328125,280.68707275390625,55.0372314453125,280.4796447753906C55.1180419921875,280.251953125,55.3311767578125,280.0882873535156,55.47479248046875,279.90240478515625C55.8660888671875,279.3966979980469,56.18658447265625,278.8714294433594,56.33984375,278.24517822265625C56.744140625,276.5909118652344,55.21636962890625,275.0777282714844,56.11029052734375,273.2300720214844C56.4957275390625,272.4339599609375,56.78167724609375,272.3431396484375,57.632568359375,272.1644592285156Z" />
    <Path fill="#6882A1" d="M60.40020751953125,289.14306640625C61.67608642578125,289.28973388671875,62.94122314453125,289.5350646972656,64.23394775390625,289.41583251953125C65.1636962890625,289.3302307128906,66.15753173828125,288.8859558105469,66.88128662109375,288.3025207519531C68.43365478515625,287.051025390625,69.379638671875,284.8848571777344,68.5419921875,282.9345703125C68.2156982421875,282.1744079589844,67.59576416015625,281.4747009277344,67.01678466796875,280.900390625C66.4517822265625,280.3404846191406,65.85223388671875,279.8348083496094,65.1478271484375,279.4630126953125C64.6009521484375,279.174560546875,63.8428955078125,278.98248291015625,63.226806640625,278.9772644042969C62.98358154296875,278.9749755859375,62.746826171875,279.0445556640625,62.504638671875,279.0416259765625C61.59393310546875,279.03021240234375,61.55352783203125,278.2651062011719,61.52667236328125,277.5362854003906C62.26080322265625,277.43145751953125,63.027587890625,277.33050537109375,63.76885986328125,277.44482421875C65.11871337890625,277.65325927734375,66.3350830078125,278.3356628417969,67.3851318359375,279.18341064453125C70.544189453125,281.7334289550781,71.68902587890625,285.5581359863281,68.6959228515625,288.8016662597656C68.12738037109375,289.41778564453125,67.353759765625,289.9848937988281,66.593505859375,290.33380126953125C65.0242919921875,291.0541076660156,63.18994140625,291.0443115234375,61.5089111328125,290.89141845703125C60.82196044921875,291.8498840332031,59.77154541015625,293.56787109375,58.475341796875,293.6926574707031C58.2431640625,293.7151794433594,58.00347900390625,293.6201171875,57.78192138671875,293.5646057128906L57.63800048828125,292.4676208496094C59.3773193359375,291.4699401855469,59.547119140625,290.8940124511719,60.40020751953125,289.14306640625Z" />
    <Path fill="#6882A1" d="M36.8330078125,283.2955627441406C37.124755859375,283.2936096191406,37.470458984375,283.2423400878906,37.75604248046875,283.3298645019531C38.09271240234375,283.4334411621094,38.32745361328125,283.70294189453125,38.615966796875,283.88751220703125C39.20587158203125,284.2644958496094,40.09747314453125,284.58233642578125,40.80218505859375,284.4840087890625C41.56927490234375,284.377197265625,42.1776123046875,284.0688171386719,42.5631103515625,283.36907958984375C42.7115478515625,283.0995788574219,42.87847900390625,282.7725524902344,43.1497802734375,282.60888671875C43.37713623046875,282.47137451171875,43.67755126953125,282.47039794921875,43.9317626953125,282.43316650390625C44.0491943359375,282.6961364746094,44.2266845703125,282.9836120605469,44.27069091796875,283.27435302734375C44.38128662109375,284.00347900390625,43.71929931640625,284.72509765625,43.29754638671875,285.2392883300781C43.10546875,285.4735107421875,42.88946533203125,285.6999206542969,42.83447265625,286.0108947753906C42.7384033203125,286.5557861328125,43.21160888671875,287.60638427734375,43.31793212890625,288.20159912109375C43.415283203125,288.7464599609375,43.3499755859375,289.35504150390625,43.3470458984375,289.9048767089844C43.00909423828125,289.9048767089844,42.52496337890625,289.9855651855469,42.196044921875,289.8623962402344C41.473876953125,289.59259033203125,41.55926513671875,288.1499938964844,41.34869384765625,287.5011901855469C41.2371826171875,287.15753173828125,41.01434326171875,286.7691345214844,40.7659912109375,286.5080871582031C40.36456298828125,286.0867004394531,39.8018798828125,286.05303955078125,39.2744140625,285.941650390625C38.338134765625,285.7436828613281,37.12115478515625,285.14617919921875,36.8543701171875,284.141357421875C36.7841796875,283.8760681152344,36.8291015625,283.56475830078125,36.8330078125,283.2955627441406Z" />
    <Path fill="#FEFEFD" d="M62.756591796875,308.7556457519531L69.3065185546875,308.7520446777344L69.3065185546875,308.99639892578125L62.756591796875,309Z" />
  </Svg>
);

const ClipboardIcon = () => (
  <Svg width={42} height={51} viewBox="33 396 42 51">
    <Path fill="#98B0CC" d="M69.65020751953125,435.07586669921875C69.32623291015625,434.57330322265625,68.4073486328125,434.79010009765625,67.82208251953125,434.7881774902344C66.5576171875,434.78436279296875,65.2935791015625,434.75408935546875,64.0286865234375,434.7552185058594C63.52691650390625,434.755615234375,62.94293212890625,434.68170166015625,62.4554443359375,434.80963134765625C62.2283935546875,434.869384765625,62.0421142578125,435.0118408203125,61.908935546875,435.18731689453125C61.24658203125,436.05987548828125,61.4395751953125,440.894287109375,61.40380859375,442.2272644042969C61.53863525390625,442.25946044921875,61.6810302734375,442.2973937988281,61.82513427734375,442.3211364746094L61.8023681640625,442.8033447265625C55.85430908203125,442.8064270019531,49.89404296875,442.7589111328125,43.94683837890625,442.8378601074219C42.651611328125,442.8550720214844,39.8834228515625,443.00982666015625,38.74456787109375,442.7145080566406C38.39361572265625,442.62335205078125,38.07373046875,442.4364318847656,37.87152099609375,442.157958984375C37.3634033203125,441.4577331542969,37.54541015625,440.3564758300781,37.55926513671875,439.55670166015625C37.593017578125,437.6414794921875,37.60272216796875,435.7258605957031,37.6094970703125,433.81024169921875C37.6309814453125,427.4881286621094,37.591796875,421.1671447753906,37.605224609375,414.84503173828125C37.60821533203125,413.305908203125,37.32122802734375,408.1673889160156,37.958740234375,407.06500244140625C38.58782958984375,405.9779357910156,42.1102294921875,406.3222961425781,43.318603515625,406.4073181152344C43.31988525390625,407.3963317871094,43.48626708984375,408.5382080078125,44.68841552734375,408.8856201171875C45.9532470703125,409.2509765625,48.490966796875,408.8944091796875,49.8868408203125,408.8829040527344C52.98114013671875,408.857666015625,56.0738525390625,408.98785400390625,59.16900634765625,408.9334716796875C60.11529541015625,408.9170227050781,62.294921875,409.0001525878906,63.10052490234375,408.7208557128906C64.13238525390625,408.36273193359375,64.1690673828125,407.21820068359375,64.1702880859375,406.3762512207031C65.050048828125,406.2797546386719,67.9122314453125,406.2108154296875,68.685791015625,406.43756103515625C69.03973388671875,406.5409851074219,69.38897705078125,406.76275634765625,69.60638427734375,407.0373840332031C69.798583984375,407.2798767089844,69.98016357421875,407.5702209472656,70.0450439453125,407.8651428222656C70.21441650390625,408.6416015625,70.1019287109375,409.5157165527344,70.0985107421875,410.3043518066406C70.0926513671875,411.7890625,70.10107421875,413.27374267578125,70.10107421875,414.7584228515625C70.10107421875,419.4993591308594,69.93212890625,424.2380065917969,70.0067138671875,428.97930908203125C70.03790283203125,430.9626770019531,69.93548583984375,432.9518737792969,70.1571044921875,434.9249267578125Z" />
    <Path fill="#6781A0" d="M75,406.6310119628906L74.68402099609375,406.6310119628906L74.68402099609375,443.12091064453125L75,443.12091064453125C74.451416015625,445.6049499511719,73.78070068359375,446.5047302246094,70.89111328125,446.64642333984375C70.16644287109375,446.51123046875,69.3553466796875,446.59246826171875,68.61376953125,446.60125732421875C67.4542236328125,446.6154479980469,66.29345703125,446.61236572265625,65.13348388671875,446.6073913574219C60.91546630859375,446.5890197753906,56.69696044921875,446.6334228515625,52.47894287109375,446.61236572265625C48.89337158203125,446.5943908691406,45.30816650390625,446.6154479980469,41.72259521484375,446.6065979003906C40.5626220703125,446.6038818359375,39.40264892578125,446.59320068359375,38.24273681640625,446.5905456542969C37.64697265625,446.5890197753906,37.02294921875,446.525390625,36.44189453125,446.6414489746094C35.3919677734375,446.55987548828125,34.1810302734375,446.2339172363281,33.63665771484375,445.3280029296875C32.623291015625,443.64263916015625,33.1234130859375,431.64068603515625,33.1234130859375,428.8862609863281L33.1234130859375,410.92718505859375C33.1234130859375,409.1023864746094,32.59466552734375,405.3405456542969,33.82037353515625,403.8773193359375C35.96246337890625,401.3197021484375,40.34600830078125,403.2705383300781,43.2196044921875,402.5726623535156C43.67291259765625,402.46234130859375,44.03448486328125,400.8773193359375,44.9866943359375,400.4590148925781C45.92877197265625,400.0449523925781,47.38873291015625,400.21466064453125,48.41937255859375,400.1675109863281C49.243896484375,397.1579284667969,50.76873779296875,396,54.15673828125,396C55.54254150390625,396,56.44842529296875,396.0647277832031,57.56707763671875,396.8798522949219C58.463623046875,397.5325622558594,58.85467529296875,399.55389404296875,59.55157470703125,399.9495544433594C60.59442138671875,400.5413513183594,62.17315673828125,400.0115966796875,63.2791748046875,400.63751220703125C64.00848388671875,401.0500183105469,63.9853515625,402.3117980957031,64.68646240234375,402.56231689453125C65.25946044921875,402.7668762207031,66.099609375,402.6642150878906,66.71014404296875,402.6864013671875C70.8603515625,402.8373107910156,74.2567138671875,401.9027099609375,75,406.6310119628906ZM55.21136474609375,402.3210144042969C58.44134521484375,397.9427795410156,49.56915283203125,397.808349609375,52.7347412109375,402.3210144042969ZM69.65020751953125,435.07586669921875L70.1571044921875,434.9249267578125C69.93548583984375,432.9518737792969,70.03790283203125,430.9626770019531,70.0067138671875,428.97930908203125C69.93212890625,424.2380065917969,70.10107421875,419.4993591308594,70.10107421875,414.7584228515625C70.10107421875,413.27374267578125,70.0926513671875,411.7890625,70.0985107421875,410.3043518066406C70.1019287109375,409.5157165527344,70.21441650390625,408.6416015625,70.0450439453125,407.8651428222656C69.98016357421875,407.5702209472656,69.798583984375,407.2798767089844,69.60638427734375,407.0373840332031C69.38897705078125,406.76275634765625,69.03973388671875,406.5409851074219,68.685791015625,406.43756103515625C67.9122314453125,406.2108154296875,65.050048828125,406.2797546386719,64.1702880859375,406.3762512207031C64.1690673828125,407.21820068359375,64.13238525390625,408.36273193359375,63.10052490234375,408.7208557128906C62.294921875,409.0001525878906,60.11529541015625,408.9170227050781,59.16900634765625,408.9334716796875C56.0738525390625,408.98785400390625,52.98114013671875,408.857666015625,49.8868408203125,408.8829040527344C48.490966796875,408.8944091796875,45.9532470703125,409.2509765625,44.68841552734375,408.8856201171875C43.48626708984375,408.5382080078125,43.31988525390625,407.3963317871094,43.318603515625,406.4073181152344C42.1102294921875,406.3222961425781,38.58782958984375,405.9779357910156,37.958740234375,407.06500244140625C37.32122802734375,408.1673889160156,37.60821533203125,413.305908203125,37.605224609375,414.84503173828125C37.591796875,421.1671447753906,37.6309814453125,427.4881286621094,37.6094970703125,433.81024169921875C37.60272216796875,435.7258605957031,37.593017578125,437.6414794921875,37.55926513671875,439.55670166015625C37.54541015625,440.3564758300781,37.3634033203125,441.4577331542969,37.87152099609375,442.157958984375C38.07373046875,442.4364318847656,38.39361572265625,442.62335205078125,38.74456787109375,442.7145080566406C39.8834228515625,443.00982666015625,42.651611328125,442.8550720214844,43.94683837890625,442.8378601074219C49.89404296875,442.7589111328125,55.85430908203125,442.8064270019531,61.8023681640625,442.8033447265625L61.82513427734375,442.3211364746094C62.7369384765625,441.8641357421875,63.86865234375,440.50970458984375,64.6480712890625,439.7983703613281C65.82281494140625,438.72662353515625,67.0400390625,437.695068359375,68.2109375,436.6202697753906C68.72833251953125,436.1452941894531,69.28619384765625,435.6890869140625,69.727783203125,435.15362548828125Z" />
    <Path fill="#D2DFED" d="M69.65020751953125,435.07586669921875L69.727783203125,435.15362548828125C69.28619384765625,435.6890869140625,68.72833251953125,436.1452941894531,68.2109375,436.6202697753906C67.0400390625,437.695068359375,65.82281494140625,438.72662353515625,64.6480712890625,439.7983703613281C63.86865234375,440.50970458984375,62.7369384765625,441.8641357421875,61.82513427734375,442.3211364746094C61.6810302734375,442.2973937988281,61.53863525390625,442.25946044921875,61.40380859375,442.2272644042969C61.4395751953125,440.894287109375,61.24658203125,436.05987548828125,61.908935546875,435.18731689453125C62.0421142578125,435.0118408203125,62.2283935546875,434.869384765625,62.4554443359375,434.80963134765625C62.94293212890625,434.68170166015625,63.52691650390625,434.755615234375,64.0286865234375,434.7552185058594C65.2935791015625,434.75408935546875,66.5576171875,434.78436279296875,67.82208251953125,434.7881774902344C68.4073486328125,434.79010009765625,69.32623291015625,434.57330322265625,69.65020751953125,435.07586669921875Z" />
    <Path fill="#D2DFED" d="M36.44189453125,446.6414489746094C37.02294921875,446.525390625,37.64697265625,446.5890197753906,38.24273681640625,446.5905456542969C39.40264892578125,446.59320068359375,40.5626220703125,446.6038818359375,41.72259521484375,446.6065979003906C45.30816650390625,446.6154479980469,48.89337158203125,446.5943908691406,52.47894287109375,446.61236572265625C56.69696044921875,446.6334228515625,60.91546630859375,446.5890197753906,65.13348388671875,446.6073913574219C66.29345703125,446.61236572265625,67.4542236328125,446.6154479980469,68.61376953125,446.60125732421875C69.3553466796875,446.59246826171875,70.16644287109375,446.51123046875,70.89111328125,446.64642333984375C70.89068603515625,446.764404296875,70.88775634765625,446.88201904296875,70.884765625,447L36.44281005859375,447C36.4423828125,446.8804626464844,36.44189453125,446.7609558105469,36.44189453125,446.6414489746094Z" />
    <Rect x={74.68399510443214} y={406.6310010214504} width={0.3160048955678576} height={36.48991317671101} fill="#B7C4D1" />
  </Svg>
);

const ChatIcon = () => (
  <Svg width={52} height={46} viewBox="33 540 52 46.1">
    <Path fill="#95ADCA" d="M81.532958984375,544.70703125C81.53546142578125,545.13232421875,81.66845703125,545.5330200195312,81.68115234375,545.951904296875C81.7279052734375,547.482421875,81.623046875,549.8197021484375,80.91046142578125,551.18017578125C80.70635986328125,551.56982421875,80.4315185546875,552.03466796875,80.1492919921875,552.3687744140625C80.0560302734375,552.479248046875,79.9169921875,552.53662109375,79.8248291015625,552.6521606445312C79.2198486328125,553.4111938476562,78.4273681640625,554.0753173828125,77.5233154296875,554.4471435546875C75.84295654296875,555.1377563476562,74.17138671875,555.07177734375,72.41009521484375,554.7783813476562C71.87445068359375,554.6892700195312,71.4046630859375,554.443603515625,70.84161376953125,554.5009765625C70.5748291015625,554.5281372070312,70.36724853515625,554.4144287109375,70.10894775390625,554.4090576171875C69.4375,554.3951416015625,68.40252685546875,554.6257934570312,68.470458984375,553.6657104492188C68.577392578125,553.6889038085938,68.68511962890625,553.7088623046875,68.79205322265625,553.73095703125C68.76776123046875,553.2935180664062,68.56121826171875,553.043212890625,68.4000244140625,552.6521606445312C68.18505859375,552.1287841796875,67.9718017578125,551.586181640625,67.8271484375,551.0364990234375C67.0096435546875,547.93017578125,66.81787109375,545.3961181640625,68.5745849609375,542.5675659179688C71.59613037109375,538.7240600585938,80.7763671875,539.00537109375,81.532958984375,544.70703125Z" />
    <Path fill="#D4D8E2" d="M64.00537109375,546.387939453125C63.68267822265625,546.39794921875,63.4508056640625,546.249267578125,63.13653564453125,546.1943359375C62.5308837890625,546.0888671875,61.911865234375,546.0660400390625,61.2991943359375,546.0460205078125C58.66339111328125,545.9597778320312,56.02301025390625,546.0699462890625,53.3875732421875,546.06494140625C50.48779296875,546.0592041015625,47.58282470703125,546.0692138671875,44.68341064453125,546.1173095703125C43.72198486328125,546.1334228515625,42.74261474609375,546.1205444335938,41.7840576171875,546.1822509765625C41.35577392578125,546.2100830078125,40.9144287109375,546.2952270507812,40.4847412109375,546.2820434570312C40.2490234375,546.2745361328125,40.01287841796875,546.1907958984375,39.7763671875,546.1683349609375C39.7763671875,546.03466796875,39.7763671875,545.9009399414062,39.7763671875,545.7672119140625C40.49322509765625,545.7298583984375,41.20123291015625,545.55224609375,41.90997314453125,545.5177001953125C43.092041015625,545.4595947265625,44.2850341796875,545.5340576171875,45.46746826171875,545.5145263671875C49.70867919921875,545.4431762695312,53.94744873046875,545.37548828125,58.19110107421875,545.37548828125C58.51422119140625,545.37548828125,58.83795166015625,545.2271728515625,59.1427001953125,545.2410278320312C59.36016845703125,545.2506713867188,59.52801513671875,545.391845703125,59.75677490234375,545.3679809570312C59.92498779296875,545.35009765625,60.064697265625,545.243896484375,60.23431396484375,545.222900390625C61.2911376953125,545.090576171875,63.67315673828125,545.0578002929688,64.00537109375,546.387939453125Z" />
    <Path fill="#95ADCA" d="M65.1832275390625,558.2115478515625L65.3218994140625,558.723876953125C66.4683837890625,558.8247680664062,67.715576171875,558.8118896484375,68.86529541015625,558.7435302734375C69.08416748046875,558.7303466796875,69.25238037109375,558.5827026367188,69.47125244140625,558.568115234375C71.53839111328125,558.431884765625,73.65582275390625,558.499267578125,75.72894287109375,558.513916015625C77.204833984375,558.5245971679688,79.034423828125,558.2703857421875,80.33294677734375,559.1107177734375C82.12628173828125,560.2718505859375,81.641357421875,563.4921875,81.6473388671875,565.3507080078125C81.658935546875,568.960693359375,81.49005126953125,572.5660400390625,81.50555419921875,576.1739501953125C81.5150146484375,578.467041015625,81.52099609375,580.760498046875,81.51995849609375,583.054931640625C81.6202392578125,583.0663452148438,81.71771240234375,583.078857421875,81.82330322265625,583.0816650390625L81.82330322265625,583.616455078125L81.42742919921875,583.616455078125C81.42742919921875,583.9059448242188,81.56640625,584.6467895507812,81.16278076171875,584.7123413085938C81.02093505859375,584.7355346679688,80.87841796875,584.6731567382812,80.7352294921875,584.6842041015625C80.518798828125,584.700927734375,80.362548828125,584.8553466796875,80.1365966796875,584.8250122070312C79.683349609375,584.764404296875,79.394775390625,584.4667358398438,78.919677734375,584.50341796875C78.44921875,584.4200439453125,73.477783203125,581.58251953125,73.34051513671875,581.3433227539062C73.024169921875,580.5764770507812,69.88372802734375,580.3551025390625,69.064453125,580.3621826171875C66.27203369140625,580.3868408203125,63.48492431640625,580.3489990234375,60.69464111328125,580.37109375C59.43865966796875,580.381103515625,57.9644775390625,580.7112426757812,56.80780029296875,580.09375C55.46527099609375,579.377197265625,55.3104248046875,577.6217041015625,55.29388427734375,576.2723388671875C55.2738037109375,574.6712646484375,55.22314453125,573.0694580078125,55.20550537109375,571.4669189453125C55.1932373046875,570.3197021484375,55.291748046875,569.1357421875,55.1717529296875,567.9938354492188C55.14886474609375,567.777099609375,55.06756591796875,567.57177734375,55.0386962890625,567.354248046875C57.02557373046875,567.29296875,59.05120849609375,567.44482421875,61.05389404296875,567.344970703125C61.533203125,567.3211059570312,62.09417724609375,567.393798828125,62.56011962890625,567.2779541015625C63.161865234375,567.1282348632812,63.81854248046875,566.81591796875,64.23870849609375,566.3414306640625C64.5350341796875,566.0070190429688,64.837646484375,565.520751953125,64.94073486328125,565.080078125C65.1318359375,564.26513671875,65.06781005859375,563.38525390625,65.06146240234375,562.55810546875C65.050537109375,561.1131591796875,64.9967041015625,559.6640014648438,64.99530029296875,558.221923828125Z" />
    <Path fill="#6781A0" d="M39.32415771484375,546.1109619140625L39.7763671875,546.1683349609375C40.01287841796875,546.1907958984375,40.2490234375,546.2745361328125,40.4847412109375,546.2820434570312C40.9144287109375,546.2952270507812,41.35577392578125,546.2100830078125,41.7840576171875,546.1822509765625C42.74261474609375,546.1205444335938,43.72198486328125,546.1334228515625,44.68341064453125,546.1173095703125C47.58282470703125,546.0692138671875,50.48779296875,546.0592041015625,53.3875732421875,546.06494140625C56.02301025390625,546.0699462890625,58.66339111328125,545.9597778320312,61.2991943359375,546.0460205078125C61.911865234375,546.0660400390625,62.5308837890625,546.0888671875,63.13653564453125,546.1943359375C63.4508056640625,546.249267578125,63.68267822265625,546.39794921875,64.00537109375,546.387939453125C64.46075439453125,546.7052001953125,64.75494384765625,546.9608154296875,64.9256591796875,547.513427734375C65.2166748046875,548.4571533203125,65.06463623046875,549.6560668945312,65.05657958984375,550.6346435546875C65.0428466796875,552.34912109375,65.05230712890625,554.0650024414062,65.05902099609375,555.7794189453125C65.06146240234375,556.364501953125,64.9217529296875,557.7570190429688,65.1832275390625,558.2115478515625L64.99530029296875,558.221923828125C64.9967041015625,559.6640014648438,65.050537109375,561.1131591796875,65.06146240234375,562.55810546875C65.06781005859375,563.38525390625,65.1318359375,564.26513671875,64.94073486328125,565.080078125C64.837646484375,565.520751953125,64.5350341796875,566.0070190429688,64.23870849609375,566.3414306640625C63.81854248046875,566.81591796875,63.161865234375,567.1282348632812,62.56011962890625,567.2779541015625C62.09417724609375,567.393798828125,61.533203125,567.3211059570312,61.05389404296875,567.344970703125C59.05120849609375,567.44482421875,57.02557373046875,567.29296875,55.0386962890625,567.354248046875C53.68280029296875,567.2715454101562,49.6298828125,566.9677734375,48.52490234375,567.4251708984375C46.20574951171875,568.3856201171875,44.126708984375,569.8380737304688,41.9635009765625,571.0943603515625C41.461669921875,571.3856811523438,40.98870849609375,571.9282836914062,40.44219970703125,572.117919921875C39.89495849609375,572.3072509765625,39.23480224609375,572.1368408203125,38.6717529296875,572.1236572265625C38.650634765625,571.3525390625,38.78082275390625,570.5917358398438,38.76708984375,569.8238525390625C38.752685546875,569.0437622070312,38.66156005859375,568.269775390625,38.6343994140625,567.4901123046875C38.56402587890625,565.4437255859375,38.54998779296875,563.384521484375,38.53167724609375,561.3367309570312C38.524658203125,560.5659790039062,38.50421142578125,559.768798828125,38.55279541015625,559.001220703125C38.59326171875,558.357421875,38.6766357421875,557.6461181640625,38.5784912109375,557.0083618164062L39.067626953125,546.0460205078125Z" />
    <Path fill="#FEFEFD" d="M68.5745849609375,542.5675659179688C66.81787109375,545.3961181640625,67.0096435546875,547.93017578125,67.8271484375,551.0364990234375C67.9718017578125,551.586181640625,68.18505859375,552.1287841796875,68.4000244140625,552.6521606445312C68.56121826171875,553.043212890625,68.76776123046875,553.2935180664062,68.79205322265625,553.73095703125C68.68511962890625,553.7088623046875,68.577392578125,553.6889038085938,68.470458984375,553.6657104492188C68.40252685546875,554.6257934570312,69.4375,554.3951416015625,70.10894775390625,554.4090576171875C70.36724853515625,554.4144287109375,70.5748291015625,554.5281372070312,70.84161376953125,554.5009765625C71.4046630859375,554.443603515625,71.87445068359375,554.6892700195312,72.41009521484375,554.7783813476562C74.17138671875,555.07177734375,75.84295654296875,555.1377563476562,77.5233154296875,554.4471435546875C78.4273681640625,554.0753173828125,79.2198486328125,553.4111938476562,79.8248291015625,552.6521606445312C79.9169921875,552.53662109375,80.0560302734375,552.479248046875,80.1492919921875,552.3687744140625C80.4315185546875,552.03466796875,80.70635986328125,551.56982421875,80.91046142578125,551.18017578125C81.623046875,549.8197021484375,81.7279052734375,547.482421875,81.68115234375,545.951904296875C81.66845703125,545.5330200195312,81.53546142578125,545.13232421875,81.532958984375,544.70703125L81.796875,544.70703125C82.1104736328125,546.2620849609375,81.87469482421875,547.9344482421875,82.24383544921875,549.4674682617188C82.455322265625,550.3462524414062,83.3199462890625,551.0054931640625,83.5782470703125,551.91064453125C83.84112548828125,552.8311767578125,83.8739013671875,553.8026123046875,84.0565185546875,554.7388305664062C84.28594970703125,555.915283203125,84.67767333984375,557.0571899414062,84.83001708984375,558.2554321289062C85.11083984375,560.4639892578125,84.98980712890625,564.200927734375,84.85040283203125,566.4729614257812C84.75897216796875,567.9617919921875,84.146240234375,569.4430541992188,83.83062744140625,570.8890380859375C83.61279296875,571.88623046875,83.6993408203125,572.93896484375,83.50860595703125,573.9422607421875C83.384033203125,574.5985107421875,83.116943359375,575.2210083007812,83.00042724609375,575.8759155273438C82.79071044921875,577.056640625,82.76715087890625,578.274169921875,82.5162353515625,579.448486328125C82.4285888671875,579.8591918945312,82.09710693359375,580.14794921875,81.99151611328125,580.5550537109375C81.7880859375,581.3380126953125,81.86517333984375,582.2745361328125,81.82330322265625,583.0816650390625C81.71771240234375,583.078857421875,81.6202392578125,583.0663452148438,81.51995849609375,583.054931640625C81.52099609375,580.760498046875,81.5150146484375,578.467041015625,81.50555419921875,576.1739501953125C81.49005126953125,572.5660400390625,81.658935546875,568.960693359375,81.6473388671875,565.3507080078125C81.641357421875,563.4921875,82.12628173828125,560.2718505859375,80.33294677734375,559.1107177734375C79.034423828125,558.2703857421875,77.204833984375,558.5245971679688,75.72894287109375,558.513916015625C73.65582275390625,558.499267578125,71.53839111328125,558.431884765625,69.47125244140625,558.568115234375C69.25238037109375,558.5827026367188,69.08416748046875,558.7303466796875,68.86529541015625,558.7435302734375C67.715576171875,558.8118896484375,66.4683837890625,558.8247680664062,65.3218994140625,558.723876953125L65.1832275390625,558.2115478515625C64.9217529296875,557.7570190429688,65.06146240234375,556.364501953125,65.05902099609375,555.7794189453125C65.05230712890625,554.0650024414062,65.0428466796875,552.34912109375,65.05657958984375,550.6346435546875C65.06463623046875,549.6560668945312,65.2166748046875,548.4571533203125,64.9256591796875,547.513427734375C64.75494384765625,546.9608154296875,64.46075439453125,546.7052001953125,64.00537109375,546.387939453125C63.67315673828125,545.0578002929688,61.2911376953125,545.090576171875,60.23431396484375,545.222900390625C60.064697265625,545.243896484375,59.92498779296875,545.35009765625,59.75677490234375,545.3679809570312C59.52801513671875,545.391845703125,59.36016845703125,545.2506713867188,59.1427001953125,545.2410278320312C58.83795166015625,545.2271728515625,58.51422119140625,545.37548828125,58.19110107421875,545.37548828125C53.94744873046875,545.37548828125,49.70867919921875,545.4431762695312,45.46746826171875,545.5145263671875C44.2850341796875,545.5340576171875,43.092041015625,545.4595947265625,41.90997314453125,545.5177001953125C41.20123291015625,545.55224609375,40.49322509765625,545.7298583984375,39.7763671875,545.7672119140625C39.7763671875,545.9009399414062,39.7763671875,546.03466796875,39.7763671875,546.1683349609375L39.32415771484375,546.1109619140625C39.73974609375,544.3519287109375,44.85406494140625,544.78759765625,46.37890625,544.7619018554688C50.11517333984375,544.6987915039062,53.9376220703125,544.8663330078125,57.6611328125,544.5551147460938C59.8450927734375,544.37255859375,62.0015869140625,543.8837890625,64.1591796875,543.5140991210938C64.9967041015625,543.3704833984375,65.8870849609375,543.427490234375,66.71124267578125,543.2185668945312C67.3397216796875,543.058837890625,67.9443359375,542.7468872070312,68.5745849609375,542.5675659179688Z" />
    <Path fill="#FEFEFD" d="M38.5784912109375,557.0083618164062C38.6766357421875,557.6461181640625,38.59326171875,558.357421875,38.55279541015625,559.001220703125C38.50421142578125,559.768798828125,38.524658203125,560.5659790039062,38.53167724609375,561.3367309570312C38.54998779296875,563.384521484375,38.56402587890625,565.4437255859375,38.6343994140625,567.4901123046875C38.66156005859375,568.269775390625,38.752685546875,569.0437622070312,38.76708984375,569.8238525390625C38.78082275390625,570.5917358398438,38.650634765625,571.3525390625,38.6717529296875,572.1236572265625C39.23480224609375,572.1368408203125,39.89495849609375,572.3072509765625,40.44219970703125,572.117919921875C40.98870849609375,571.9282836914062,41.461669921875,571.3856811523438,41.9635009765625,571.0943603515625C44.126708984375,569.8380737304688,46.20574951171875,568.3856201171875,48.52490234375,567.4251708984375C49.6298828125,566.9677734375,53.68280029296875,567.2715454101562,55.0386962890625,567.354248046875C55.06756591796875,567.57177734375,55.14886474609375,567.777099609375,55.1717529296875,567.9938354492188C55.291748046875,569.1357421875,55.1932373046875,570.3197021484375,55.20550537109375,571.4669189453125C55.22314453125,573.0694580078125,55.2738037109375,574.6712646484375,55.29388427734375,576.2723388671875C55.3104248046875,577.6217041015625,55.46527099609375,579.377197265625,56.80780029296875,580.09375C57.9644775390625,580.7112426757812,59.43865966796875,580.381103515625,60.69464111328125,580.37109375C63.48492431640625,580.3489990234375,66.27203369140625,580.3868408203125,69.064453125,580.3621826171875C69.88372802734375,580.3551025390625,73.024169921875,580.5764770507812,73.34051513671875,581.3433227539062C70.322509765625,580.947998046875,67.2894287109375,580.9422607421875,64.25244140625,580.9422607421875C62.56292724609375,580.9422607421875,60.85577392578125,580.83349609375,59.18988037109375,581.1561889648438C58.3023681640625,581.3280029296875,57.5897216796875,582.028564453125,56.69903564453125,582.2855834960938C55.46240234375,582.6424560546875,54.22369384765625,583.126220703125,52.95684814453125,583.35693359375C49.75762939453125,583.939453125,44.823486328125,583.8521118164062,41.82733154296875,582.4716796875C33.29595947265625,578.54150390625,30.29522705078125,568.6790771484375,35.73822021484375,560.7349853515625C36.59686279296875,559.4818115234375,37.18280029296875,557.76416015625,38.5784912109375,557.0083618164062Z" />
  </Svg>
);


const SERVICOS_INICIAIS = [
  { id: 'psicoterapia', nome: 'Psicoterapia', descricao: 'Sessões semanais de atendimento psicológico.', minutos: 50, preco: 150, pacientes: 12, ativo: true, Icon: BrainIcon },
  { id: 'avaliacao', nome: 'Avaliação', descricao: 'Avaliação psicológica e devolução inicial.', minutos: 60, preco: 200, pacientes: 5, ativo: true, Icon: ClipboardIcon },
  { id: 'acompanhamento', nome: 'Acompanhamento', descricao: 'Acompanhamento breve e monitoramento.', minutos: 50, preco: 120, pacientes: 0, ativo: false, Icon: ChatIcon },
];

export default function ServicosScreen(
  { onNavegar }: { onNavegar: (to: 'painel' | 'pacientes' | 'agenda' | 'servicos') => void } = { onNavegar: () => {} }
) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [servicos, setServicos] = useState(SERVICOS_INICIAIS);

  const ativos = servicos.filter((s) => s.ativo).length;
  const inativos = servicos.length - ativos;

  const drawerItems: DrawerItem[] = useMemo(
    () => [
      { key: 'painel',        label: 'Painel',        icon: 'grid-outline',      onPress: () => onNavegar('painel') },
      { key: 'pacientes',     label: 'Pacientes',     icon: 'people-outline',    onPress: () => onNavegar('pacientes') },
      { key: 'agenda',        label: 'Agenda',        icon: 'calendar-outline',  onPress: () => onNavegar('agenda') },
      { key: 'servicos',      label: 'Serviços',      icon: 'medkit-outline', active: true, onPress: () => onNavegar('servicos') },
      { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
    ],
    [onNavegar]
  );

  const toggleServico = (id: string) =>
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ativo: !s.ativo } : s)));

  const termo = search.trim().toLowerCase();
  const filtrados = servicos.filter((s) => {
    const passaFiltro = filtro === 'todos' || (filtro === 'ativos' ? s.ativo : !s.ativo);
    const passaBusca = !termo || s.nome.toLowerCase().includes(termo);
    return passaFiltro && passaBusca;
  });

  const emBreve = (titulo: string, mensagem: string) =>
    Alert.alert(titulo, mensagem, [{ text: 'Entendi' }]);

  return (
    <AppScreen>
      {/* Barra superior (☰ + busca + ⋮) — componente compartilhado (GUIA_12) */}
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        search={search}
        onChangeSearch={setSearch}
        placeholder="Buscar serviço..."
        rightActionIcon="ellipsis-vertical"
        onRightActionPress={() => emBreve('Serviços', 'Opções do catálogo entram quando a persistência for conectada.')}
        rightActionLabel="Mais ações"
      />

      {/* Título + ação principal */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Serviços</Text>
          <Text style={styles.subtitle}>Gerencie os serviços oferecidos aos seus pacientes.</Text>
        </View>
        <TouchableOpacity
          style={styles.newServiceBtn}
          onPress={() => emBreve('Novo serviço', 'O cadastro de serviços entra quando a persistência for conectada.')}
          accessibilityRole="button"
          accessibilityLabel="Novo serviço"
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newServiceText}>Novo serviço</Text>
        </TouchableOpacity>
      </View>

      {/* Contador */}
      <Text style={styles.count}>{servicos.length} serviços cadastrados</Text>

      {/* Chips de filtro */}
      <View style={styles.chips}>
        <TouchableOpacity style={[styles.chip, filtro === 'todos' && styles.chipActive]} onPress={() => setFiltro('todos')} accessibilityRole="button" accessibilityState={{ selected: filtro === 'todos' }}>
          <Text style={[styles.chipText, filtro === 'todos' && styles.chipTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, filtro === 'ativos' && styles.chipActive]} onPress={() => setFiltro('ativos')} accessibilityRole="button" accessibilityState={{ selected: filtro === 'ativos' }}>
          <Text style={[styles.chipText, filtro === 'ativos' && styles.chipTextActive]}>Ativos ({ativos})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.chip, filtro === 'inativos' && styles.chipActive]} onPress={() => setFiltro('inativos')} accessibilityRole="button" accessibilityState={{ selected: filtro === 'inativos' }}>
          <Text style={[styles.chipText, filtro === 'inativos' && styles.chipTextActive]}>Inativos ({inativos})</Text>
        </TouchableOpacity>
      </View>

      {/* Cards de serviço */}
      <View style={styles.list}>
        {filtrados.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}><s.Icon /></View>
              <View style={styles.cardBody}>
                <Text style={styles.serviceTitle}>{s.nome}</Text>
                <Text style={styles.serviceDesc}>{s.descricao}</Text>
              </View>
              <Switch
                value={s.ativo}
                onValueChange={() => toggleServico(s.id)}
                trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E2E8F0"
                accessibilityLabel={`${s.ativo ? 'Desativar' : 'Ativar'} ${s.nome}`}
              />
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{s.minutos} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaDollar}>$</Text>
                <Text style={styles.metaText}>R$ {s.preco}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={15} color={colors.textMuted} />
                <Text style={styles.metaText}>{s.pacientes > 0 ? `${s.pacientes} paciente${s.pacientes > 1 ? 's' : ''} ativo${s.pacientes > 1 ? 's' : ''}` : 'nenhum paciente'}</Text>
              </View>
              <View style={styles.metaSpacer} />
              <TouchableOpacity
                onPress={() => emBreve('Serviços', 'Editar ou excluir serviço entra quando a persistência for conectada.')}
                accessibilityRole="button"
                accessibilityLabel={`Mais ações de ${s.nome}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {filtrados.length === 0 ? (
          <Text style={styles.emptySearch}>Nenhum serviço para “{search.trim()}”.</Text>
        ) : null}
      </View>

      {/* Menu lateral */}
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} items={drawerItems} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
    gap: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  newServiceBtn: {
    height: 40, borderRadius: 10, paddingHorizontal: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  newServiceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 12, marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 8, paddingBottom: 12 },
  chip: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.08)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  serviceDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 15 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.textMuted },
  metaDollar: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  metaSpacer: { flex: 1 },
  emptySearch: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
});
```

**Explicação rápida:** a tela é o catálogo do mock (`Serviços Mobile 360x760 (S21 FE).png`): `AppToolbar` com busca controlada (`search`/`onChangeSearch`) e ação `ellipsis-vertical` à direita; cabeçalho "Serviços" + `+ Novo serviço`; contador derivado do state (`{servicos.length} serviços cadastrados`); chips `Todos`/`Ativos (N)`/`Inativos (N)` filtrando em combinação com a busca (ambos derivados de `servicos` — nada de contador em state separado); cards brancos com sombra (`elevation` no Android **e** `shadow*` no iOS), toggle `Switch` do próprio RN (`trackColor={{ false: '#E2E8F0', true: '#22C55E' }}`, `ios_backgroundColor` para o iOS) e meta `$`/pessoas/tempo com ⋮ à direita; ícones vetoriais do Penpot inline como `BrainIcon`/`ClipboardIcon`/`ChatIcon` (mesmo estilo do `AgendaArt`, `rn-svg` já instalado no GUIA_12); a rota `servicos` vive no `App.js` §3.7; o drawer marca `Serviços` como ativo (`active: true` em `servicos`). `+ Novo serviço` e os ⋮ avisam (`Alert`) até a persistência ser ligada; o item `Serviços` do drawer navega de verdade (`onNavegar('servicos')`).

---

## 4. Verificação final (checklist de aceite do app inteiro)

Rode no Expo Go (ou no Snack com **Run**):

1. **Abre na tela de Login** — marca CP + "Prontuário psicológico"
2. **Cadastrar-se** → Cadastro Passo 1 (stepper `1 Seus dados` ativo)
3. **Continuar** (com dados válidos) → Cadastro Passo 2 (`✓ Seus dados` verde + `2 Dados da clínica` ativo)
4. **Concluir e entrar** → **Painel** vazio — cabeçalho com a faixa branca contínua (toolbar + "Painel / Visão geral da clínica / + Novo Paciente") separado do conteúdo por hairline, hero, 3 cards
5. **☰** → menu abre deslizando da esquerda; backdrop fecha ao tocar fora; "Painel" aparece ativo
5.1. **☰ → Agenda** → tela de Agenda (empty state do mock v2); item "Agenda" ativo no drawer; ☰ e ⋮ funcionam
5.2. **☰ → Serviços** → lista de serviços com toggles funcionais (Psicoterapia e Avaliação ligados, Acompanhamento desligado); chips `Todos`/`Ativos (2)`/`Inativos (1)` filtram; item `Serviços` ativo no drawer
6. **☰ → Pacientes** → tela de `Pacientes` (vazio, contador `0`) — item `Pacientes` marcado ativo
7. **☰ → Painel** → volta para o Painel — item `Painel` ativo
8. **+ Novo Paciente** (botão da toolbar, do hero ou da tela de Pacientes) → modal abre sobre tudo; **Cadastrar paciente** com nome+telefone+serviço preenche → fecha e reseta
9. **Entrar** (tela de Login com dados válidos) → **Painel**
10. **Android**: botão Voltar com modal/drawer abertos fecha-os primeiro; nunca fecha o app direto

**Sign-off**: qualquer item falhando acima volta ao guia da fase correspondente (GUIA_11 troubleshooting §7 cobre o caso clássico "tocar em Pacientes não navega").

---

## 5. Troubleshooting consolidado (os 7 erros que derrubam no Telefone)

| Sintoma | Causa | Fix |
|---|---|---|
| `Element type is invalid` | Nome do componente errado no import ou arquivo sem `export default` | Conferir PascalCase e o `export default function Nome` em cada componente |
| `Unable to resolve module '../theme'` | `theme.js` fora de `src/` ou nome errado (`theme.ts` x `theme.js`) | `src/theme.js` exato; tudo neste guia usa `theme.js` |
| `useAuthScroll is not a function` | `AuthScreen.tsx` sem o bloco `ScrollContext` exportado antes do componente | Colar o arquivo §2.2 integralmente |
| Tocar em `Pacientes` no drawer não troca de tela | Itens do drawer sem `onPress` (telas montando `AppDrawer` sem `items`) | Colar `PainelScreen`/`PacientesScreen` do §3.4/§3.5 — o `items={drawerItems}` liga o `onNavegar` |
| Conteúdo atrás da barra do sistema | Falta `SafeAreaProvider` na raiz ou telas sem `SafeAreaView` | `App.js` §3.6 + `AuthScreen`/`AppScreen` §2.2/§2.3 — nunca wrappers fora deles |
| `Agenda` nunca abre (cai sempre no Painel) | `else if (tela === 'agenda')` ficou depois do `else` final | `App.js` §3.7 — condição `agenda` antes do `else` |
| Tocar em `Serviços` no drawer não troca de tela | Item do drawer sem `onPress` (mesmo caso de `Pacientes` e `Agenda`) | `PainelScreen`/`PacientesScreen`/`AgendaScreen` do §3.4–§3.6 — o `items={drawerItems}` liga o `onNavegar('servicos')` |
| Toggle do card de serviço não fica verde no Android | `trackColor` sem a chave `false` (e/ou sem `ios_backgroundColor` no iOS) | `ServicosScreen.tsx` §3.8 — o par `{ false: '#E2E8F0', true: '#22C55E' }` |
| O `⋮` da Agenda não aparece | Faltou `rightActionIcon`/`onRightActionPress` (os dois juntos) | `AppToolbar` §2.14 — sem o trio, o botão não renderiza (por design) |
| `Unable to resolve module react-native-svg` | No projeto local blank, o `react-native-svg` não vem declarado | `npx expo install react-native-svg` (no Expo Go/Snack, nada a instalar) |
| Ilustração da Agenda não aparece (tela vazia sem arte) | O `Svg`/`Path` não foi importado — ou o grupo do `AgendaArt` ficou fora do `<View>` | Confira `import Svg, { Path } from 'react-native-svg'` e a posição do `<AgendaArt />` antes de `<Text style={styles.emptyTitle}>` |

---

## 6. O que ainda não existe (próximas fases, por ordem)

1. **Auth local real** (espelhando o web app): PBKDF2 + `AsyncStorage` + guardas de rota — substitui os `setTimeout` de mock
2. **Persistência** (GUIA_05): SQLite via `expo-sqlite` + `Repository` — `enabled` no campo, nome validado, exclusão com `Apagar Dados Locais` em Configurações
3. **Persistência geral** — Agenda vazia já existe (GUIA_12) e Serviços já existe com toggles locais (GUIA_13); com dados reais, ambos entram junto da persistência. Configurações segue a mesma família `AppScreen`
4. **Painel com dados** — os mesmos cards preenchidos a partir do repositório (o esqueleto não muda)

---

**Fim do retrato consolidado.** Para qualquer dúvida sobre *por que* algo está assim, volte aos guias da pasta `Tela 1`…`Tela 9` — cada linha deste código tem a explicação registrada lá.
