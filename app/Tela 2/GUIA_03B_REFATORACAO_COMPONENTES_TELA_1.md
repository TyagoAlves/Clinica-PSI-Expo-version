# Guia 03B — Login usando os componentes compartilhados (refatoração)

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Pasta:** `Tela 2` (propositalmente: o guia fica aqui, na mesma pasta em que os componentes nascem e são usados pela primeira vez — você vê o resultado completo da decisão de design antes de voltar para aplicar no Login)
**Objetivo:** converter a tela de Login existente (implementada inline no GUIA_01) para usar os componentes da pasta `src/componentes`, como já acontece no seu projeto
**Formato:** somente as mudanças, seção por seção, com **"Apague estes trechos"** → **"Cole no lugar"** — sem repetir a explicação de cada componente (cada um já tem o seu comentário nos arquivos da Tela 2).
**Pré-requisito:** `src/theme.ts` presente e `src/componentes/{AuthScreen, BrandHeader, FormField, PasswordField, PrimaryButton, Stepper}.tsx` criados (ver GUIA_02 da Tela 2).

---

## 0. Por que esta refatoração?

- **Mantém duas telas em sincronia** (Login e Cadastro1) sem que mudanças de design empilhem: mexeu no `AuthScreen` uma vez, vale para as duas
- **Reduz a tela para o que é só dela**: estado (`email`, `password`, `loading`, `error`), handlers, validação e teclado. Nada de geometria, marca ou aparência
- **É a mesma estrutura** da tela de cadastro (passo 1) — comparação sem erro

---

## 1. Tabela de deltas

| Bloco | Antes (GUIA_01) | Depois |
|---|---|---|
| Imports do RN | vários (Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, StatusBar) | quase só `useCallback, useState` + RN mínimo (Text, View, StyleSheet, Alert) |
| `Ionicons` | usado para olho/erro/alerta | removido (o `PasswordField` já lida com o olho; mostrar ícone da mesma forma) |
| Marca (logo+"Clínica Psi"+subtítulo) | JSX inline + styles | `BrandHeader` via `AuthScreen` (nem precisa ficar na tela) |
| `KeyboardAvoidingView` | escrito na tela | `AuthScreen` |
| `ScrollView` + `StatusBar` | escrito na tela | `AuthScreen` |
| Rótulos+inputs E-mail/Senha | JSX inline | `FormField`, `PasswordField` |
| Botão Entrar | JSX inline com `ActivityIndicator` | `PrimaryButton` (`loading`) |
| "Cadastrar-se" link | JSX inline com ícone | `TextButton` |
| Rodapé de privacidade | JSX inline | `AuthScreen` |
| Bloco `styles` | logo, title, subtitle, footer, input, inputFlex, passwordRow, eyeButton, button, buttonDisabled, buttonText, link, linkText, keyboardWrap, scroll | **quase nada** — só `errorBox` e `errorText` (ainda há erro inline de validação) |
| Props na função | `LoginScreen()` | `LoginScreen({ onCadastrar, onEntrar, navigation })` opcional |

---

## 2. Mudanças no topo do arquivo

### 2.1 Apague a lista de imports atual e cole esta:

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
```

> `Alert` continua porque a tela usa `onEntrar`/`onCadastrar` com fallback de Alert quando não há navegação. `View`, `Text`, `Ionicons`, `StyleSheet`, `colors` — usados só pelo box de erro; mantenha.


### 2.2 (Opcional) tipagem de props de navegação/callbacks — cole logo acima de `export default function LoginScreen`

```tsx
// Props opcionais: funciona sozinha (Alert de demonstração) e conectada à navegação
type Props = {
  onCadastrar?: () => void;
  onEntrar?: () => void;
};

export default function LoginScreen({ onCadastrar, onEntrar }: Props = {}) {
```

> Sem essas props, a tela continua funcionando no MODO standalone (Alert), exatamente como hoje. Elas só ligam o encontro com navegação.

### 2.3 Estados

Permanecem os mesmos (`email`, `password`, `loading`, `error`). **Apague** `showPassword` — quem cuida do olho agora é o `PasswordField`.

```tsx
// apague:
// const [showPassword, setShowPassword] = useState(false);
```

---

## 3. Mudanças nas funções (handlers)

### 3.1 `handleEntrar`

Apague as linhas `Keyboard.dismiss();` … `setLoading(true);` **da seguinte forma — mantenha as validações de e-mail/senha de antes (iguais)** mas mova a chamada do Alert para dentro do `setTimeout` apenas se não houver `onEntrar`:

```tsx
  const handleEntrar = useCallback(() => {
    if (!EMAIL_REGEX.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    if (password.length < 6) { setError('A senha precisa de ao menos 6 caracteres.'); return; }

    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (onEntrar) return onEntrar();
      Alert.alert('Login (demonstração)', 'Estrutura, UX e validação prontas. Navegue/conecte para prosseguir.', [{ text: 'OK' }]);
    }, 900);
  }, [email, password, onEntrar]);
```

### 3.2 `handleCadastrar`

```tsx
  const handleCadastrar = useCallback(() => {
    if (onCadastrar) return onCadastrar();
    Alert.alert('Cadastro', 'O fluxo de cadastro em 2 passos entra quando a navegação estiver ligada.', [{ text: 'Entendi' }]);
  }, [onCadastrar]);
```

---

## 4. Mudanças no JSX (a parte da tela)

### 4.1 Apague TODO o bloco do `KeyboardAvoidingView` até o fim (`</KeyboardAvoidingView>`) e troque por `<AuthScreen>…</AuthScreen>`

O bloco inteiro (incluindo `ScrollView`, `StatusBar`, marca com logo + textos, e o rodapé de privacidade) é consumido pelo `AuthScreen`. Nada daquela marcação deve ficar no arquivo.

### 4.2 Conteúdo interno do `<AuthScreen>`:

```tsx
  return (
    <AuthScreen>
      <FormField
        id="email"
        label="E-mail"
        required
        placeholder="nome@clinica.com.br"
        value={email}
        onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
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
        label="Senha"
        required
        value={password}
        onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
        autoComplete="password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Entrar"
        onPress={handleEntrar}
        loading={loading}
        accessibilityLabel="Entrar"
      />
      <TextButton
        label="Cadastrar-se"
        onPress={handleCadastrar}
      />
    </AuthScreen>
  );
```

### 4.3 Estilos: apague todo o `const styles`; cole o curto necessário

```tsx
const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

---

## 5. Arquivo final completo (para comparar)

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

    setTimeout(() => {
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
      <FormField
        id="email"
        label="E-mail"
        required
        placeholder="nome@clinica.com.br"
        value={email}
        onChangeText={(t) => { setEmail(t); if (error) setError(null); }}
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
        label="Senha"
        required
        value={password}
        onChangeText={(t) => { setPassword(t); if (error) setError(null); }}
        autoComplete="password"
        textContentType="password"
        autoCapitalize="none"
        autoCorrect={false}
      />
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
    marginBottom: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

---

## 6. Smoke checks (testes rápidos no Expo Go)

- [ ] A tela abre centralizada e idêntica à anterior (o único delta visível: nada)
- [ ] Olho da senha mostra/oculta (vem do `PasswordField` — não há mais lógica de `showPassword` na tela)
- [ ] Tocar em `Entrar` sem nada digitado mostra o erro vermelho do box
- [ ] Correto/vazio: sem vermelho; loading de 900ms; alerta de demonstração (standalone) **ou** navegação (se ligada)
- [ ] Android: `Função`? n/a; teclado de e-mail abre com o teclado `@`; senha aparece pontilhada; o rodapé some atrás do teclado mas volta quando fecha
- [ ] Console do Snack/Metro: **sem** warning de variável não usada (logo/logoText/etc. que sobraram no `styles`)
- [ ] `npm`/Snack **limpo**: nenhum `KeyboardAvoidingView`, `ScrollView` ou `StatusBar` no arquivo
- [ ] Commit único com tudo isso no diff (antes/depois, nada misturado)

---

## 7. Troubleshooting direto (sem rodeio)

- "**Element type is invalid**" após remover imports: você apagou o `Alert` que continua sendo usado pelo handler, ou apagou `View`/`Text` que o error box precisa — adicione de volta
- "**Can't find variable: colors**": `import { colors } from '../theme'` foi apagado junto com o restante — respire e coloque de volta
- "**`AuthScreen` is not a function** / elemento não renderiza": o arquivo do componente não foi salvo ou o nome do default export está errado (`export default function AuthScreen`) — nunca `export function AuthScreen`
- "**StatusBar duplicada ou escondida atrás do conteúdo**": a `AuthScreen` já marca `barStyle="dark-content"` — **apague** qualquer `<StatusBar>` na tela
- "**Rolagem estranha, cabeçalho some**": `BrandHeader` aparece mais de uma vez na tela (não é intencional — mora só no `AuthScreen`)
- "**Ficaram styles mortos**": apague tudo menos `errorBox`/`errorText` — o TS não reclama, mas o arquivo fica sujo e confuso
- "**Removi `showPassword` mas o olho funciona sozinho**" (esperado): o olho agora vive em `PasswordField`; é uma feature do componente
- "**Entrar** fica branco com spinner para sempre": você deixou um `await` permanente ou nunca `setTimeout` no `setLoading(false)` — confira as linhas finais do `handleEntrar`

---

## 8. Próximos passos

Quando a refatoração estiver estável e a navegação ligada, todas as telas de auth ficam deste formato. A próxima tela é a **Tela 3 (GUIA_04_TELA_CADASTRO_PASSO2_EXPO, pasta `Tela 3`)** — o passo 2 do cadastro ("Dados da clínica"), com a mesma estrutura de componentes. A conexão Login → Cadastro 1 → Cadastro 2 → Painel completa-se pelo `GUIA_03_NAVEGACAO_EXPO.md` (pasta `Tela 2`).
