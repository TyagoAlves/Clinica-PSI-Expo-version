# Guia 02 — Tela de Cadastro (Passo 1: Seus dados) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Imagem de referência:** `cadastro-passo1-mobile.png` (nesta mesma pasta)
**Base:** `Tela 1` (guia/arquivos de login) — o fluxo é o mesmo; o que muda é o conteúdo e a introdução da pasta **`componentes`/`src/componentes`** para reuso.
**Objetivo desta fase:** implementar a tela Cadastro Passo 1 exatamente como o mock, já extraindo os componentes reutilizáveis (logo, inputs, botão, stepper, nota, rodapé) que as telas 1, 2 e 3 vão compartilhar.

![cadastro-passo1-mobile.png](cadastro-passo1-mobile.png)

---

## 0. Regras da fase

- Sem backend, sem navegação, sem auth real (igual à Tela 1)
- **Fonte única de verdade para cores**: `src/theme.ts` (copiado do Tela 1, inalterado)
- **Componentes reutilizáveis vivem em `src/componentes/`** — um arquivo por componente, export default
- Lógica da tela fica em `src/screens/CadastroPasso1Screen.tsx`; componentes **não** carregam estado de negócio, só props e estilo
- App base em `App.js` aponta **temporariamente** para a tela nova (sem navegação)

---

## 1. O que a tela precisa ter (referência do mock)

| Elemento | Detalhe visual (`cadastro-passo1-mobile.png`) |
|---|---|
| Barra de status | `9:41` + sinal/bateria (manter `dark-content`) |
| Marca | Quadrado indigo com `CP` + `Clínica Psi` + `Prontuário psicológico` |
| Stepper | Chip `1  Seus dados` (ativo: indigo transparente + borda) e chip `2  Dados da clínica` (inativo: branco + borda cinza) |
| Título | `Quem vai usar o sistema` — negrito, ancorado à esquerda |
| Campos (6) | `Nome completo *` (placeholder "Como você quer aparecer no sistema") · `E-mail de acesso *` (placeholder "nome@clinica.com.br") · `Senha * (mínimo 6)` · `Repetir a senha *` · `CRP` (placeholder "CRP 06/00000") · `Função` (placeholder "Psicólogo(a), administrador…") |
| Nota | ⓘ `A senha não é guardada: o sistema guarda só um derivado dela, e é esse derivado que compara no login.` — cinza, pequeno, 2 linhas |
| CTA | `Continuar  →` — indigo cheio, branco, largura total |
| Voltar | `Voltar` — texto simples (sem botão, sem borda) abaixo do CTA |
| Rodapé | `O sistema guarda tudo apenas local. Nada é enviado para servidores.` (idêntico ao Login) |
| Fundo | `#F1F3F8` |

Rótulos de campo com `*` para obrigatórios; campos vazios usam o placeholder do mock (texto em cinza claro).

---

## 2. Arquitetura — a pasta `src/componentes/`

Até a Tela 1 toda a UI morava na tela. A partir de agora, tudo que **repete** vai virar componente:

```text
App.js
src/
├── theme.ts
├── componentes/
│   ├── AuthScreen.tsx      ← "chrome" comum das telas de auth (bg, ScrollView, StatusBar, rodapé)
│   ├── BrandHeader.tsx     ← logo CP + Clínica Psi + Prontuário psicológico
│   ├── FormField.tsx       ← rótulo + TextInput (com asterisco opcional)
│   ├── PasswordField.tsx   ← rótulo + TextInput senha + olho mostrar/ocultar
│   ├── PrimaryButton.tsx   ← botão indigo com loading
│   ├── Stepper.tsx         ← chips de etapa (Seus dados → Dados da clínica)
│   ├── InfoNote.tsx        ← ⓘ + texto de apoio (cinza, 2 linhas)
│   └── TextButton.tsx      ← botão de texto puro (Voltar)
└── screens/
    └── CadastroPasso1Screen.tsx
```

### Como decidir "componente aqui ou na tela"?

| Critério | Vai para `componentes/` | Fica na tela |
|---|---|---|
| Repete em 2+ telas (logo, input, botão…) | ✅ | |
| Possui estado local próprio (mostrar/ocultar senha) | ✅ | |
| Depende do domínio (validar email? listar pacientes?) | | ✅ |
| Recebe variação por props e entrega visual fixo | ✅ | |
| Precisa de cor/estilo nunca antes usado | | ✅ (via `theme.ts` se for cor nova) |

Regra: **um componente por arquivo, nome de arquivo = nome do componente (PascalCase), export default**.

---

## 3. Preparando o Snack (ordem e truque de teste)

Sem navegação, o `App.js` aponta **temporariamente** para a tela nova. Faça assim:

1. copie `src/theme.ts` da Tela 1 para dentro do projeto (idêntico);
2. crie os arquivos de `componentes/` exatamente como abaixo;
3. crie `src/screens/CadastroPasso1Screen.tsx`;
4. em `App.js`, aponte para a nova tela:
   ```tsx
   import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
   export default function App() { return <CadastroPasso1Screen />; }
   ```
5. teste no Expo Go → **só troque de tela no fim** (voltar a Login editando o `App.js`).

## 4. O código completo

### 4.1 `src/componentes/BrandHeader.tsx`

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

### 4.2 `src/componentes/AuthScreen.tsx` (versão corrigida — teclado no Android)

```tsx
// src/componentes/AuthScreen.tsx
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, StatusBar, Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import BrandHeader from './BrandHeader';

// useAuthScroll: era do GUIA_02 — preservado na versão segura. O erro de hoje (`_AuthScreen.useAuthScroll is not a function`) aconteceu porque o AuthScreen novo (GUIA_08) rescreveu sem ele.
const ScrollContext = createContext<((opts?: { animated?: boolean }) => void) | null>(null);
export const useAuthScroll = () => useContext(ScrollContext);

export default function AuthScreen({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollToEnd = useCallback((opts?: { animated?: boolean }) => {
    scrollRef.current?.scrollToEnd({ animated: true, ...opts });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
    paddingBottom: 72,      // espaço extra para o último campo não ficar atrás do teclado
  },
  footer: {
    width: '100%',
    fontSize: 11, color: colors.textMuted,
    textAlign: 'center', marginTop: 20, lineHeight: 16,
  },
});
```

**O que mudou e por que**

| Antes | Agora | Motivo |
|---|---|---|
| `Platform.OS === 'ios' ? 'padding' : undefined` | `... : 'height'` | No Android, `undefined` delega ao `adjustResize` do Expo Go, que nem sempre encolhe o que precisa; `'height'` reduz a altura útil da tela pelo teclado e sobra rolagem real |
| `paddingBottom: 24` | `paddingBottom: 72` | Dá ~48px de folga acima do rodapé para rolar o último campo acima do teclado |
| Sem rolagem automática | `ScrollContext` + `useAuthScroll` | Ao focar um campo baixo (ex.: `Função`), a tela rola até ele — sem dependência nova (nada de `keyboard-aware-scroll-view`) |

Regra: telas de auth **nunca** escrevem `KeyboardAvoidingView`/`ScrollView`/`StatusBar` — vêm todas de `AuthScreen`.

### 4.3 `src/componentes/FormField.tsx`

```tsx
// src/componentes/FormField.tsx
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '../theme';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  id?: string;                 // nativeID do input (para accessibilityLabelledBy)
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

### 4.4 `src/componentes/PasswordField.tsx`

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
  const [show, setShow] = useState(false);
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

> `show` fica dentro do componente — antes o estado morava na tela; agora fica encapsulado e a tela só passa `value/onChangeText`.

### 4.5 `src/componentes/PrimaryButton.tsx`

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

### 4.6 `src/componentes/Stepper.tsx`

```tsx
// src/componentes/Stepper.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export interface Step {
  n: number;
  label: string;
}

interface Props {
  steps: Step[];
  active: number;      // índice da etapa ativa (0-based)
}

export default function Stepper({ steps, active }: Props) {
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Etapas do cadastro">
      {steps.map((step, i) => {
        const isActive = i === active;
        return (
          <View key={step.n} style={[styles.chip, isActive ? styles.chipActive : null]}>
            <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
              {step.n}  {step.label}
            </Text>
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
});
```

### 4.7 `src/componentes/InfoNote.tsx`

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

### 4.8 `src/componentes/TextButton.tsx`

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

### 4.9 `src/screens/CadastroPasso1Screen.tsx`

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
// CRP no formato CRP 06/00000 (06/0000 até 06/999999) — validação de UX, não de conselho
const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;

// Props opcionais: a tela funciona sozinha (Alert de demonstração), ligada à
// navegação por props (Rota A: o pai passa onVoltar/onContinuar) ou à navegação
// por stack nativa (Rota B: o React Navigation passa `navigation` com goBack()).
// Estrutura compatível, sem importar @react-navigation.
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
    // mesma ordem de validação do web app: nome → email → senha → confirmação → crp
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

    // MOCK: simula a validação de backend; troca por signup real na fase de auth
    setTimeout(() => {
      setLoading(false);
      if (onContinuar) {
        onContinuar();
      } else {
        Alert.alert(
          'Cadastro (demonstração)',
          'E-mail válido, senha confirmada. O passo 2 (Dados da clínica) entra na próxima tela.',
          [{ text: 'OK' }]
        );
      }
    }, 900);
  }, [nome, email, senha, confirmarSenha, crp, onContinuar]);

  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert('Voltar', 'A navegação entra na próxima fase. Por enquanto, a tela de login é onde tudo começa.', [{ text: 'Entendi' }]);
  }, [onVoltar, navigation]);

  return (
    <AuthScreen>
      <Stepper
        steps={[
          { n: 1, label: 'Seus dados' },
          { n: 2, label: 'Dados da clínica' },
        ]}
        active={0}
      />

      <Text style={styles.sectionTitle}>Quem vai usar o sistema</Text>

      <FormField
        id="nome"
        label="Nome completo"
        required
        placeholder="Como você quer aparecer no sistema"
        value={nome}
        onChangeText={(t) => { setNome(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="words"
        maxLength={80}
        returnKeyType="next"
      />
      <FormField
        id="email"
        label="E-mail de acesso"
        required
        placeholder="nome@clinica.com.br"
        value={email}
        onChangeText={(t) => { setEmail(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        textContentType="emailAddress"
        maxLength={80}
        returnKeyType="next"
      />
      <PasswordField
        id="senha"
        label="Senha (mínimo 6)"
        required
        value={senha}
        onChangeText={(t) => { setSenha(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoComplete="password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={64}
        returnKeyType="next"
      />
      <PasswordField
        id="confirmar"
        label="Repetir a senha"
        required
        value={confirmarSenha}
        onChangeText={(t) => { setConfirmarSenha(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        onSubmitEditing={handleContinuar}
      />
      <FormField
        id="crp"
        label="CRP"
        placeholder="CRP 06/00000"
        value={crp}
        onChangeText={(t) => { setCrp(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={24}
        returnKeyType="next"
      />
      <FormField
        id="funcao"
        label="Função"
        placeholder="Psicólogo(a), administrador…"
        value={funcao}
        onChangeText={(t) => { setFuncao(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="sentences"
        maxLength={80}
        returnKeyType="go"
        onSubmitEditing={handleContinuar}
      />

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

      <PrimaryButton
        label="Continuar  →"
        onPress={handleContinuar}
        loading={loading}
        accessibilityLabel="Continuar para o passo Dados da clínica"
      />

      <TextButton label="Voltar" onPress={handleVoltar} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 15, fontWeight: '700', color: colors.text,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

### 4.10 `App.js` (temporariamente apontando para a tela nova)

```tsx
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';

export default function App() {
  return <CadastroPasso1Screen />;
}
```

---

## 5. Controles e validações (espelhando o sistema web)

| Campo | Validação | Mensagem (igual ao web app) |
|---|---|---|
| Nome | preenchido | `Informe o nome.` |
| E-mail | regex de UX | `Informe um e-mail válido.` |
| Senha | ≥ 6 caracteres | `A senha precisa de ao menos 6 caracteres.` |
| Repetir a senha | deve casar | `As senhas não são iguais.` |
| CRP | opcional; se preenchido, `CRP 06/00000` | `CRP no formato CRP 06/00000…` |

Ordenação: nome → e-mail → senha → confirmação → CRP (mesma ordem do wizard web).
Erros somen na primeira falha; limpar ao digitar (`clearError`).

---

## 6. Acessibilidade e UX no teclado

- Rótulos com `nativeID` + `accessibilityLabelledBy` emparelhados (em cada `FormField`/`PasswordField`)
- Dois campos de senha têm olhos independentes (encapsulados, não duplica `showPassword` na tela)
- `KeyboardAvoidingView` herdado de `AuthScreen` — no Android usa `behavior="height"` (encolhe a altura útil pelo teclado); no iOS, `behavior="padding"`
- `useAuthScroll` rola a tela para o campo focado (invariavelmente para o fim) — resolve campos baixos atrás do teclado sem dependência nova
- `ScrollView` com `keyboardShouldPersistTaps="handled"` — o botão `Continuar` funciona mesmo com teclado aberto
- Erros anunciam com `accessibilityLiveRegion="polite"`
- `ActivityIndicator` no lugar do texto durante o moc (900ms)

---

## 7. Troubleshooting específico desta tela

### 7.1 O formulário cresce e o botão some atrás do teclado
Tela com 6 campos é alta. No S21 FE (vertical ~665pt útil) tudo cabe com `AuthScreen` (ScrollView + `paddingBottom: 72`). Se usar um device menor, reduza `paddingTop` para 24 e o `BrandHeader` ganha `marginBottom: 12`.

### 7.11 O campo fica ATRÁS do teclado (Android)
**Sintoma do usuário:** tocar em `Função`/`Senha` e ver o texto existir, mas não aparecer. **Causa:** na versão anterior, o Android estava com `behavior={undefined}` e o teclado sobrepunha a área do `ScrollView` sem reduzir o layout; e a `paddingBottom` era só 24px, então não havia espaço para rolar o campo para cima.

**Fix (já incorporada no guia e no seu Snack):**
1. `KeyboardAvoidingView` com `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` — o Android passa a reduzir a altura útil pelo teclado, e o `ScrollView` ganha área rolável real.
2. `paddingBottom: 72` no `contentContainerStyle` — folga acima do rodapé.
3. `useAuthScroll()` + `onFocus={() => scrollToEnd?.()}` em cada campo — ao focar, a tela rola até o campo focado (Função anda para cima, senha deixa de ser parcialmente coberta).

**Por que sem lib nova** (ex.: `react-native-keyboard-aware-scroll-view`): o remédio é ~30 linhas dentro da própria `AuthScreen`, mantendo o projeto Expo Go/Snack sem dependência nativa — e o padrão funciona em iOS e Android sem ramificação por plataforma.

**Validação rápida no seu aparelho:** tocar em `Função` → a tela deve rolar sozinha até o campo; digitar → o texto fica visível acima do teclado; tocar em `Senha` → mesma coisa; o rodapé pode sumir atrás do teclado (comportamento correto — volta quando o teclado fecha).

### 7.2 O Stepper está "estourando" / quebra a linha feia
`flexWrap: 'wrap', gap: 12` do componente já cobre 2 chips. Se traduzir (labels longos), eles quebram para baixo um sob o outro — comportamento correto.

### 7.3 `CRP parte com CRP CRP` ou espaços demais
Regex aceita `CRP 06/123456`, `06/12345` e `CRP06/123456`. Se quiser padronizar, normalized no `onChangeText` com `toUpperCase()` + colapsar espaços — detalhe opcional, não exigido pelo mock.

### 7.4 Usuário digita a confirmação errada e não percebe
Fora da fase atual (sem mensagens por campo), o erro aparece no box global após tocar em `Continuar`. É o mesmo comportamento do web app (mostra o erro geral, não atribui a campo).

### 7.5 `Continuar` com `→` renderiza como `→` estranho
O glifo `→` é Unicode puro; texto aceita normal. Se algum device renderizar tofu, troque por `Continuar ›` ou o ícone `Ionicons 'arrow-forward'` inline — tesou-se no mock, mas escolha consistente.

### 7.6 `TextButton` desalinhado em relação ao botão indigo
`alignSelf: 'flex-start'` já deixa `Voltar` encostado à esquerda, como no mock; se quiser centrar igual ao mock do web app (Voltar abaixo, alinhado à esquerda), mantenha assim.

### 7.7 Recycling de componentes de Telas anteriores
Ainda não. Mas o `LoginScreen` já possui o mesmo cabeçalho/inputs/botão — a refatoração está registrada na seção 9.

### 7.8 `…` ou `…` exaparecendo "�"
Sempre UTF-8; é a mesma causa do Tela 1 (mojibake em copy/paste). Consulte Tela 1 §8.10.

### 7.9 Senha com texto visível no autofill
`textContentType="password"` e `autoComplete="password"` trancam o campo com pontos no iOS/Android também ao preencher pelo chaveiro.

### 7.10 Duplicated `error` box na tela
Só existe um — na página. Componentes não sabem do erro; quem chama `setError` renderiza o `<View styles.errorBox>`.

---

## 8. Checklist de aceite (contra `cadastro-passo1-mobile.png`)

**Visual**
- [ ] Fundo `#F1F3F8`, igual ao mock
- [ ] Marca + nome + subtítulo idênticos ao login (mesma `BrandHeader`)
- [ ] Stepper: chip ativo indigo, inativo branco, gap entre eles
- [ ] Título `Quem vai usar o sistema` ancorado à esquerda, negrito
- [ ] 6 campos na ordem do mock, mesmas alturas (48px) e placeholders
- [ ] Campos obrigatórios com asterisco indigo (`*`)
- [ ] Nota `A senha não é guardada…` em cinza, com ícone ⓘ, 2 linhas
- [ ] Botão `Continuar  →` indigo cheio, branco, largura total
- [ ] `Voltar` em texto cinza abaixo
- [ ] Rodapé centralizado, 11px

**Funcional**
- [ ] Ao focar `Função`/`Repetir a senha`, a tela rola sozinha até o campo (texto visível acima do teclado) — o bug reportado foi corrigido nesta seção
- [ ] Continuar bloqueia em cada regra, na ordem nome→email→senha→confirm
- [ ] Senha mostrar/ocultar funciona em ambos os campos
- [ ] Teclado `next` entre campos; `go` no último dispara o Continuar
- [ ] Erro some ao digitar; `accessibilityLiveRegion` anuncia
- [ ] Loading troca `Continuar →` por spinner e desabilita
- [ ] Telas Seus dados → Dados da clínica ainda não avança (Fase 3 — navegação)

---

## 9. Refactor do LoginScreen para os componentes (opcional, mesma base)

Quando a Tela 2 estiver validando, o `LoginScreen` pode adotar os mesmos componentes. Antes/depois curto:

**Antes (`LoginScreen.tsx`)**: ~200 linhas, marca/form/botão inline.  
**Depois**:

```tsx
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // ... estado

  return (
    <AuthScreen>
      <FormField id="email" label="E-mail" placeholder="nome@clinica.com.br"
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <PasswordField id="senha" label="Senha" value={password} onChangeText={setPassword} />
      <PrimaryButton label="Entrar" onPress={handleEntrar} />
      <TextButton label="Cadastrar-se" onPress={handleCadastrar} />
    </AuthScreen>
  );
}
```

Token de regra: **Login usa os mesmos componentes; nada de variação ad-hoc para ele.** Qualquer ajuste visual que surgir na tela 2 vai para o componente e vale para as duas.

---

## 10. O que NÃO entra nesta fase

- Navegação/step to stepper (o `Stepper` é só visual aqui)
- Auth real (PBKDF2, AsyncStorage, sessão)
- Etapa 2: `Dados da clínica` (tela 3)
- Design System completo (`ui/Button`, `ui/Input` global) — vai surgir naturalmente como `componentes/` quando a lista crescer

## 11. Próximos passos (ordem estrita)

1. Validar a Tela 2 no Expo Go com o checklist §8
2. Refatorar o `LoginScreen` para usar os componentes (§9)
3. Tela 3: `CadastroPasso2Screen` (Dados da clínica — mesma base, `Stepper active={1}`)
4. Navegação simples com expo-router (`/login`, `/cadastro-passos`, `/painel`)
5. Auth local (espelho do web app: PBKDF2, sessão, homologação)
6. **Tela 4: Painel vazio** (`GUIA_07_PAINEL_EXPO.md`, pasta `Tela 4`) — sem ela o fluxo login→cadastro→Painel não se fecha

---

## 12. Erros comuns ao implementar os componentes novos

Fluxos de referência entre as telas desta fase: Login → Cadastro 1 → Cadastro 2 → **Painel** (GUIA_07).
Erros frequentes nesta etapa:

- **Esqueceu o `default` export** em um componente → erro `Element type is invalid` no import
- **`labelId` com espaços** (`label` com espaço na composição do `nativeID`) — mantemos como está no guia (`${label}-label` preserva espaço; funciona internamente, mas fica feio pelo sanitizer de alguns test runners: prefira passar `id` explícito em todos)
- **Dois `<StatusBar>`** (AuthScreen põe uma, e a tela põe outra) — tela NÃO põe `<StatusBar>`; mora só na `AuthScreen`
- **Import circular**: componente importa `colors` de `theme.ts` e nada de componente importa tela (regra: fluxo sempre componentes → theme → (nada), telas → componentes)
- **`Stepper` com steps acionáveis** — não é um botão; é um indicador. Não adjudicar `onPress`

---

## Anexo D — Por que o entry é chamado `App.js` ou `App.tsx`, e o que muda no React Native puro

### D.1 — Por que o seu projeto tem `App.js` (e às vezes `App.tsx`)

O nome do entry point depende do template que você usou ao criar o projeto:

| Como o projeto foi criado | Entry |
|---|---|
| Template JavaScript do Expo (`create-expo-app` padrão, **o do Snack**) | `App.js` |
| Template TypeScript (`create-expo-app --template typescript`) | `App.tsx` |
| Snack quando você cria o arquivo como `App.tsx` | `App.tsx` |
| Projeto com Expo Router (`app/`) | nenhum dos dois — o `main` é `expo-router/entry` e a raiz é `app/_layout.tsx` |

Os dois fazem exatamente o mesmo: o Metro aponta para `App`, renderiza o componente padrão exportado, que é o ponto de entrada da árvore React. **Não tem diferença de API, de comportamento ou de performance** — é o mesmo arquivo com a extensão conforme o template.

Renomear a qualquer momento (`App.js` ↔ `App.tsx`) não quebra nada, desde que não haja dependência do nome fora do entry.

**Motivo prático de manter `.tsx` nos arquivos do projeto:** o editor valida tipos, o autocomplete funciona, e a disciplina de interface `Props`/`interface` que os componentes novos usam só funciona em TS. O entry `.js` importando `.tsx` também funciona (o Metro transpila TS independente do entry), então pode manter `App.js` na raiz e tudo o resto em `.tsx` — é o que este guia recomenda.

### D.2 — Se você usar React Native puro (bare, sem Expo)

Contexto antes de decidir: o Expo Go roda binários já compilados com o conjunto de módulos nativos que o Expo suporta. Um app React Native puro exige compilar Android/iOS a partir do zero — **nada** está linkado por padrão.

O que teria de mudar e o porquê de cada mudança:

1. **Registro do componente raiz**
   - Expo: `export default function App() { ... }` com `"main": "expo/AppEntry.js"` ou alias Expo
   - RN puro: `AppRegistry.registerComponent(appName, () => App)` em `index.js`; `package.json` com `"main": "index.js"`
   - **Motivo**: o Metro RN não conhece "default export de App" sozinho — o binário nativo precisa de um nome de componente nativo registrado via `AppRegistry` para montar a árvore

2. **StatusBar nativa**
   - Expo: `StatusBar` de `expo-status-bar` (ou nativa via prop)
   - RN puro: `StatusBar` de `react-native` (já usada neste guia) — sem `expo-status-bar`
   - **Motivo**: o componente do expo depende do bridge Expo; o RN nativo já expõe a API completa

3. **Ícones — `@expo/vector-icons`**
   - Expo: funciona sem config (o Expo Go carrega as fontes no binário)
   - RN puro: `react-native-vector-icons` (nativo) ou `@expo/vector-icons` com `expo-font` configurado no build, linkando fontes manualmente via `react-native.config.js`
   - **Motivo**: ícones são fontes nativas; o sistema precisa registrar as fontes no projeto nativo

4. **Navegação**
   - Expo: `@react-navigation/*` com `react-native-screens` e `react-native-safe-area-context` — funciona no Expo Go porque os módulos estão no binário
   - RN puro: os mesmos pacotes, mas exigem `pod install` (iOS) e autolinking + `minSdkVersion` adequada (Android), além de `react-native-gesture-handler` configurado se for usado
   - **Motivo**: são módulos nativos (uma `View` especial + informações de insets); o código JS sozinho não cria essas views

5. **Storage**
   - Expo: `@react-native-async-storage/async-storage` funciona sem config (suportado no Expo Go)
   - RN puro: o mesmo pacote, com autolinking; no iOS `pod install`

6. **Reload e depuração**
   - Expo: tecla `r`/Fast Refresh no terminal; `npx expo start`
   - RN puro: Metro (`npx react-native start`) + build nativa (`npx react-native run-android` / `run-ios`); hot reload configurado no app nativo
   - **Motivo**: não existe container Expo Go — o app é um binário nativo próprio

7. **Capacidades nativas extras**
   - Expo: tudo que não estiver no Expo Go/SDK fica inacessível (JIT widgets, notificações locais avançadas, sensores custom)
   - RN puro: acesso total ao Kotlin/Swift/Java — usar apenas quando o requisito exigir
   - **Motivo**: o Expo gerencia o binário; o RN puro não

**Regra prática deste guia:** o Clínica Psi, nesta fase (telas de auth, navegação JS, UI, storage local), não precisa de RN puro em lugar nenhum. A migração para bare/EAS existe para quando aparecer exigência nativa real — e toda migração ES deve/projeto-config tem custo. Não migrar agora.

**Checklist se algum dia precisar de RN puro:**
- [ ] `npx react-native init ClinicaPsi` ou eject (`npx expo prebuild`) — decisão consciente e separada
- [ ] `index.js` + `AppRegistry` no lugar do `App.js/tsx` de expo
- [ ] Ícones re-linkados; `react-native-screens` e `safe-area-context` linkados
- [ ] Build própria em Android Studio/Xcode ou CI; sem Expo Go
- [ ] CI/cd passando com a nova stack

**Resumo em 3 linhas**: `App.tsx` e `App.js` são o mesmo entry para dois templates (TS vs JS); a diferença é cosmética e reversível. RN puro muda a **cadeia inteira** — quem compila o binário, como ícones e navegação se linkam e como o app roda no device. Não use RN puro agora.
