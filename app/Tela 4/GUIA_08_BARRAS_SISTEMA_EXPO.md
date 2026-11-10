# Guia 08 — Barras do sistema (status bar + navegação Android) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Pasta:** `Tela 4` (transversal; vale para todas as telas que existam na família auth e pós-login)
**Problema:** o conteúdo está migrando para trás da barra de status (relógio/bateria) e da barra de navegação do Android (3 botões Samsung: Voltar · Home · Recentes). No S21 FE, a barra do Samsung está sobre o app; no iPhone, o notch/Dynamic Island e o Home Indicator farão o mesmo.
**Meta:** o conteúdo nunca entra na área de sistema — independente de 3-botão, gestos ou iPhone — com **uma mudança só em dois componentes** (`AuthScreen`, `AppScreen`) e na raiz (`App.js`).

---

## 0. O que muda nesta fase

| Antes | Depois |
|---|---|
| `KeyboardAvoidingView` é o root da árvore (em `AuthScreen`) ou `<View>` como raiz (em `AppScreen`) | `SafeAreaView` (de `react-native-safe-area-context`) é o wrapper principal |
| `StatusBar barStyle="dark-content"` sem translucência | `StatusBar translucent barStyle="dark-content" backgroundColor="transparent"` |
| Fundo da área da barra Samsung herdado do sistema | Fundo explicitamente definido pelo próprio `SafeAreaView` (mantém o visual do mock) |
| Último cartão some atrás de botões | Último cartão fica visível com respiro |
| No iPhone: o Home Indicator cortará o texto do rodapé | No iPhone: o rodapé escapa do Home Indicator automaticamente |

**Nada** muda na lógica das telas (validações, eventos, callbacks). Só a moldura.

---

## 1. Contexto: o S21 FE e o Samsung Navigation Bar

Nos aparelhos Samsung recentes (S21 FE incluso), o usuário pode escolher entre:

- **Navegação com 3 botões** (Voltar ⊖ · Home ○ · Recentes ☐) — a sua opção atual
- **Gestos** (subir e soltar = Home, arrastar para cima e segurar = Recentes, arrastar de cima = Voltar)

Quando o aplicativo é desenhado em modo **edge-to-edge** (Expo Go faz isso em Android recente por padrão agora), o conteúdo do app desenha **atrás** de todas as áreas de sistema: status bar (relógio/bateria) e a barra de navegação (3 botões). Não há translucência garantida; a sobreposição é real.

**Por que Route B já resolveu para quem usa React Navigation:**
A Stack (do `@react-navigation/native-stack`) configura, por baixo, `SafeAreaProvider` e `SafeAreaInsetsContext` automaticamente. Você nunca liga no código, mas a Stack consome isso para o headers.

**Rota A (a sua) tem o mesmo problema sem o provider.**

---

## 2. As três abordagens possíveis

| Abordagem | Cobertura topo | Cobertura fundo | Cobertura iPhone | Complexidade | Recomendação |
|---|---|---|---|---|---|
| **`SafeAreaView` (`react-native-safe-area-context`)** | ✅ | ✅ (3-botão, gesto e iPhone) | ✅ | baixa (uma vez por componente) | **Recomendada** |
| `StatusBar.currentHeight` + padding fixo | ✅ só Android | ❌ nenhum suporte nativo | ❌ manual fraquíssimo | baixa (mas hack) | **Só de emergência** |
| `expo-navigation-bar` (cor/transparência) | ❌ (só Android) | ✅ só Android (3-botão) | ❌ | média | Complemento opcional |
| ❌ hardcode `paddingTop: 28`/`paddingBottom: 34` | ✅ qualquer device | ✅ mas funcionará até quebrar | ❌ má geometria no iPhone | virtualmente zero | **Não usar** |

`StatusBar.currentHeight` **não existe no iOS**, e no Android só identifica a barra de status. **Nunca** vai identificar as 3 teclas do Samsung ou o Home Indicator do iPhone. Se você pular o principal caminho, terá conteúdo obstruído em todo release.

---

## 2.1 Delta compacto — antes → depois

Só para ver o tamanho real da mudança (3 arquivos, sem nenhuma lógica nova):

**App.js**

```diff
 import { useState, useCallback } from 'react';
+import { SafeAreaProvider } from 'react-native-safe-area-context';
 import { View, StyleSheet } from 'react-native';
 import LoginScreen from './src/screens/LoginScreen';
 ...
-export default function App() {
+function AppContent() {
   const [tela, setTela] = useState('login');
   ...
-  return <View style={styles.safe}>{conteudo}</View>;
+  return <View style={styles.safe}>{conteudo}</View>;
+}
+
+export default function App() {
+  return (
+    <SafeAreaProvider>
+      <AppContent />
+    </SafeAreaProvider>
+  );
 }
```

**AuthScreen.tsx**

```diff
 import {
   KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text,
 } from 'react-native';
+import { SafeAreaView } from 'react-native-safe-area-context';

 export default function AuthScreen({ children }: { children: ReactNode }) {
   return (
-    <KeyboardAvoidingView
-      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
-      style={styles.keyboardWrap}
-    >
+    <SafeAreaView style={styles.safeArea}>
+      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
+      <KeyboardAvoidingView
+        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
+        style={styles.keyboardWrap}
+      >
         ...
-    </KeyboardAvoidingView>
+      </KeyboardAvoidingView>
+    </SafeAreaView>
   );
 }
 const styles = StyleSheet.create({
+  safeArea: { flex: 1, backgroundColor: colors.bg },
   keyboardWrap: { flex: 1, backgroundColor: colors.bg },
   ...
 });
```

**AppScreen.tsx**

```diff
-import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
+import { ScrollView, StatusBar, StyleSheet } from 'react-native';
+import { SafeAreaView } from 'react-native-safe-area-context';

 export default function AppScreen({ children }: { children: ReactNode }) {
   return (
-    <View style={styles.container}>
-      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
+    <SafeAreaView style={styles.safeArea}>
+      <StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />
+      <ScrollView
         ...
       </ScrollView>
+    </SafeAreaView>
   );
 }
```

Ou seja: **nada de negócio** — só a moldura e 2 linhas por componente.

---

## 3. A correção (completa, segura e compatível com Expo Go)

`react-native-safe-area-context` **já está incluído no Expo Go** — nenhum `npm install` é necessário. Se você só estiver no Expo Go, basta importar e usar. Se for buildar para produção via `eas build`, ele já está listado em `expo-dependencies`.

### 3.1 Roteiro rápido (somente no S21 FE com 3-botão)

1. Adicione `<SafeAreaProvider>` no `App.js` (uma vez por app)
2. Em `AuthScreen` e `AppScreen`, troque o wrapper externo por `<SafeAreaView>`
3. Coloque `StatusBar translucent barStyle="dark-content" backgroundColor="transparent"`
4. Salve, recarregue o Expo Go, verifique no S21 FE (3 botões)
5. Troque para **Gestos** → verifique → volte para **3 botões** → verifique

### 3.2 `App.js` — o provider global (uma vez por app)

```tsx
// App.js
import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
import PainelScreen from './src/screens/PainelScreen';

function AppContent() {
  const [tela, setTela] = useState('login');

  const irLogin = useCallback(() => setTela('login'), []);
  const irCadastro1 = useCallback(() => setTela('cadastro1'), []);
  const irCadastro2 = useCallback(() => setTela('cadastro2'), []);
  const irPainel = useCallback(() => setTela('painel'), []);

  let conteudo;
  if (tela === 'login') {
    conteudo = <LoginScreen onCadastrar={irCadastro1} onEntrar={irPainel} />;
  } else if (tela === 'cadastro1') {
    conteudo = <CadastroPasso1Screen onVoltar={irLogin} onContinuar={irCadastro2} />;
  } else if (tela === 'cadastro2') {
    conteudo = <CadastroPasso2Screen onVoltar={irCadastro1} onConcluir={irPainel} />;
  } else {
    conteudo = <PainelScreen />;
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

> Para melhorar a velocidade do primeiro render (opcional): `initialWindowMetrics` do próprio package
> import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
> const App = () => <SafeAreaProvider initialMetrics={initialWindowMetrics}>...</SafeAreaProvider>;

### 3.3 `src/componentes/AuthScreen.tsx` — o wrapper "pré-login" (com `useAuthScroll`)

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import BrandHeader from './BrandHeader';

// useAuthScroll: era do GUIA_02 e precisa ser preservado aqui
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
    paddingBottom: 24,
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

### 3.4 `src/componentes/AppScreen.tsx` — o wrapper "pós-login"

```tsx
// src/componentes/AppScreen.tsx
import type { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export default function AppScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
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
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
});
```

`SafeAreaView` **herda as bordas** de `edges` de `['top', 'right', 'bottom', 'left']` por padrão (serve tanto para iPhone quanto para o Samsung com qualquer modo de navegação).

### 3.5 O que mudou em cada arquivo

| Arquivo | Antes | Depois |
|---|---|---|
| `App.js` | `<View>` (ou `SafeAreaProvider` envolvendo `<View>`) | `<SafeAreaProvider>` envolve `AppContent()` — toda a árvore registra o provider |
| `AuthScreen.tsx` | `<KeyboardAvoidingView>` era a raiz | `<SafeAreaView>` é a raiz; `KeyboardAvoidingView` vai **dentro** |
| `AuthScreen.tsx` | `<StatusBar barStyle="dark-content" />` | `<StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />` |
| `AppScreen.tsx` | `<View style={styles.container}>` era a raiz | `<SafeAreaView style={styles.safeArea}>` é a raiz |
| `AppScreen.tsx` | `StatusBar backgroundColor={colors.surface}` | `StatusBar` transparente (`backgroundColor="transparent"`) |

### 3.6 O que muda nos mocks

- O mock PNG de cada tela foi desenhado já com o status bar acima (9:41…). Isso não muda; o `SafeAreaView` respeita o mock
- A única diferença visível: no S21 FE com 3 botões, o conteúdo para **logo antes** da barra do sistema, e o rodapé/UX finalmente alinha com a borda inferior

---

## 4. (Opcional) Mudar a cor dos botões do Samsung

O Samsung expõe os seus 3 botões em modo claro/escuro. Como o seu app é claro (fundo `#F1F3F8`), a opção padrão `auto` já deve desenhar botões **escuros sobre fundo** e funcionar. Se você quiser controlar explicitamente (ou testar branco-sobre-branco):

```tsx
// App.js (uma única vez no mount) ou em cada tela, se quiser só lá
import { NavigationBar } from 'expo-navigation-bar';

// declarativo, pode ficar na raiz:
<NavigationBar style="dark" />
```

Componente `<NavigationBar />` é declarativo e aceita `style={'auto' | 'light' | 'dark' | 'inverted'}`. `light` = botões claros (para fundo escuro), `dark` = botões escuros (para fundo claro). **Precondição:** o aparelho tem que estar em **3 botões** para ter efeito; com gestos, o Android não tem controle de cor para o gesto.

> Você não precisa mexer nisso para cumprir este guia. É opcional e útil só se o Samsung enganar a escolha automática.

---

## 5. Teste de aceitação (S21 FE)

### 5.1 3 botões (configuração atual)
- [ ] Status bar (relógio/bateria) sobre fundo claro, ícones escuros (`dark-content`)
- [ ] Voltar/Home/Recentes não cobrem nenhum texto, botão ou ícone em nenhuma tela
- [ ] `Painel` (rodapé do último card) igualmente legível
- [ ] Rodapé admite linha de igualdade com o conteúdo (alinhando às bordas)

### 5.2 Gestos (trocar em Config → Tela → Navegação)
- [ ] Imagem da tela permanece igual; nenhum conteúdo é coberto pelo gesto
- [ ] Reiniciar o app (fechar/reabrir pelo Recentes) também se comporta bem

### 5.3 Firebase/Chrome simulado ou iPhone
- [ ] iPhone: Home Indicator não cobre o rodapé em nenhuma tela de auth ou pós-login
- [ ] iPhone com notch (face ID): conteúdo começa abaixo do notch
- [ ] iOS sem notch (iPhone SE): tudo alinhado, sem cortar barra superior

---

## 6. Colocando para funcionar de verdade (passo a passo no Snack)

1. Abra o seu projeto no Snack
2. **Não precisa** ir em Dependencies — o módulo já está no binário do Expo Go
3. Em `App.js`
   - Adicione `import { SafeAreaProvider } from 'react-native-safe-area-context';`
   - Envolva o conteúdo de `App()` com `<SafeAreaProvider>` … `</SafeAreaProvider>`
4. Em `AuthScreen.tsx`
   - `import { SafeAreaView } from 'react-native-safe-area-context';`
   - Substitua a raiz `<KeyboardAvoidingView>` pelo `<SafeAreaView>` (como no snippet §3.3)
   - `<StatusBar translucent barStyle="dark-content" backgroundColor="transparent" />`
5. Em `AppScreen.tsx` — mesma substituição
6. Salve, recarregue o Expo Go, verifique no S21 FE (3 botões) e depois na configuração de gestos

---

## 7. Troubleshooting

### `(0 , _AuthScreen.useAuthScroll) is not a function`
- **Causa**: a versão mais recente do `AuthScreen.tsx` (§3.3) foi rescrita para usar `SafeAreaView` mas acabou descartando o `ScrollContext`/`useAuthScroll` que o `CadastroPasso1Screen` importa
- **Fix (já incorporado neste guia)**: `useAuthScroll` está declarado e exportado no `AuthScreen.tsx` (logo abaixo de `ScrollContext`); certifique-se de que o seu arquivo tem a mesma estrutura — o `import { createContext, useCallback, useContext, useRef } from 'react'` no topo e o bloco:
  ```tsx
  const ScrollContext = createContext<((opts?: { animated?: boolean }) => void) | null>(null);
  export const useAuthScroll = () => useContext(ScrollContext);
  ```
  antes de `export default function AuthScreen`
- **Se continuar quebrando**: confirme que o seu Snack está rodando a versão nova do `AuthScreen.tsx` (compare com §3.3 deste guia); se o arquivo foi sobrescrito pelo seu editor, refaça o paste integral dele

### `Unable to resolve module react-native-safe-area-context`
- **Causa**: o Snack do seu projeto está em um SDK muito antigo ou a sua conta bloqueou módulos nativos (acontece em organizações/números)
- **Fix**: use a versão recomendada no painel → Dependencies → Add dependency → `react-native-safe-area-context` → aguardar instalar; no seu projeto nativo local, `npx expo install react-native-safe-area-context`

### Tela duplicada/overflow ou excesso de padding
- `edges` padrão é `['top','bottom','left','right']` — ela não aplica padding extra em todos os lados a menos que você defina botões próprios; o excesso normalmente indica que outra `SafeAreaView`/inset já estava aplicando padding externo — remova o que for de fora
- Se aparecer top/bottom gaps estranhos, pode ser `useSafeAreaInsets` vazando a classe de uma classe de borda

### Conteúdo some atrás do teclado após a correção
- `KeyboardAvoidingView` com `behavior="height"` **deve** continuar dentro do `SafeAreaView` — não troque por `ScrollView` internamente

### Área inferior ainda fica estranha mesmo com o `SafeAreaView`
- Se o problema persiste, abra Emulação iOS/Android no Snack: confirme que o `SafeAreaView` é o wrapper mais externo
- Em dispositivos raros, o Samsung pode estar mostrando os botões especiais com sobreposição sem transparentes — experimente `<NavigationBar style="dark" />` (Dark = botões escuros, necessita Samsung em 3-botão)

### Navegação ainda toma o espaço no iOS
- Se o mock tiver algo colado na borda inferior (por exemplo, um bitmap de fundo), lembre que o `SafeAreaView` respeita apenas **paddings**, não clipa o conteúdo; mensagens com fundo pleno devem usar `ScrollView.contentContainerStyle.paddingBottom: 34` como fallback visual se precisar

---

## 8. O que não muda

- `src/theme.ts` — identidade visual idêntica
- `componentes/` — o roteamento de root mantenha `SafeAreaView`: os componentes filhos não enxergam a mudança
- `screens/` — cada tela herda com zero edição
- `justifyContent`, `gap`, `paddingHorizontal` — todo layout interno igual, apenas o "chão" do app encolheu consistentemente

---

## 9. Critérios para marcar como pronto

- [ ] Roteiro do S21 FE 3-botões: tudo visível sem cortar rodapé
- [ ] Roteiro do S21 FE gestos: tudo visível
- [ ] Se arqueamento dupla no iOS: ScreenShots com rodapé sem sobreposição
- [ ] Fallbacks de produção: bundle testado em build local `npx expo run:android` (produz APK híbrida e confirma que navegação de sistema não muda o comportamento)

---

## 10. Conclusão técnica

`SafeAreaProvider` + `SafeAreaView` é a API recomendada pela Expo para todas as telas mobiliares — foi criada justamente com o seu cenário em mente (phone com notch/dynamic island/home bar), e está implementada tanto no Expo Go quanto no binário final. Para a sua família de telas (Login → Cadastro → Painel), o custo é editar 2 arquivos (`AuthScreen.tsx`, `AppScreen.tsx`) e o `App.js`. Para a sua família de testes, o ganho é o fluxo inteiro ficar alinhado a qualquer dispositivo real com menos esforço visual.
