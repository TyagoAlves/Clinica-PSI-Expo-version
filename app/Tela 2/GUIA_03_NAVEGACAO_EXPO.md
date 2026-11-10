# Guia 03 — Conectando as telas (Login ↔ Cadastro ↔ Painel) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Pasta:** `Tela 2` (mesmos recursos do Guia 02: mock, tema, componentes)
**Objetivo:** parar de "trocar de tela no `App.js`" e deixar cada botão levar de verdade à tela certa. Sem alterar o visual de nada — menos de 100 linhas de delta no total.

---

## 0. O que muda nesta fase

| Antes | Depois |
|---|---|
| `App.js` aponta na navalha para uma tela temporária | `App.js` vira o **roteador**; tocar nos botões navega de verdade |
| Screens recebem nenhuma prop entre elas | Screens recebem `navigation`/`onContinuar` etc. por props e usam-nas nos botões |
| `Alert.alert('Cadastro (demonstração)')` como fim de tudo | O fluxo termina num **Painel** mínimo de verdade |
| `Voltar` simula com `Alert` | `Voltar` usa o histórico (`goBack()`) ou o stack |

**Antirregras deste guia:**

- Não mexer em `theme.ts`, nem em qualquer componente de `componentes/` — conexão é código de **orquestração**, não de desenho
- `App.js` (o do seu projeto) continua o entry; não é renomeado nem convertido
- Não usar `window.location`, `localStorage`, nem qualquer API web — não existe no Expo
- Uma tela não importa outra tela diretamente (acoplação) — passam a ser conectadas SEMPRE por rotas/props da raiz

---

## 1. As duas rotas (escolha uma)

| | **Rota A — manual, zero dependências** | **Rota B — React Navigation (recomendada)** |
|---|---|---|
| O que é | `App.js` com `useState` + `switch` + callbacks passados por props às telas | `NavigationContainer` + Stack; o sistema de rotas do RN |
| Dependências | **nenhuma** (core React Native) | `@react-navigation/native` + `@react-navigation/native-stack` + `react-native-screens` + `react-native-safe-area-context` |
| Funciona no Expo Go? | Sim | **Sim** (esses módulos estão no binário do Expo Go) |
| Funciona em React Native puro? | Sim | Sim, mas exige `pod install` (iOS) + autolinking (Android) |
| Histórico/Android back | Não (você controla tudo à mão) | Sim — automático |
| Passar dados entre telas | Props da raiz | `route.params` (padrão de mercado) |
| Escala para Painel/Pacientes/…? | Não, bagunça com várias telas | Sim, é o padrão da indústria |
| Esforço hoje | ~30 min | ~45 min (ou ~30 se já veio familiar de Expo) |

**Recomendação deste guia:** faça **Rota A hoje** para validar o fluxo e o binding dos botões, e migre para **Rota B quando o Painel existir de verdade** (ou já faça Rota B se preferir fazer certo de primeira). Os dois caminhos levam ao mesmo lugar; só a encanadura muda.

---

## 2. O stub do Painel (provisório)

Tela mínima só para o fluxo fechar — não é a tela final do Penpot, é andaime funcional equivalente ao `Alert` que estava no lugar.

### `src/screens/PainelScreen.tsx`

```tsx
// src/screens/PainelScreen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen from '../componentes/AuthScreen';
import PrimaryButton from '../componentes/PrimaryButton';

export default function PainelScreen() {
  return (
    <AuthScreen>
      <View style={styles.wrap}>
        <Ionicons name="checkmark-circle-outline" size={56} color={colors.primary} />
        <Text style={styles.title}>Painel</Text>
        <Text style={styles.subtitle}>
          Você chegou ao fim do caminho. O painel real (do Penpot) substitui esta tela na próxima fase.
        </Text>
        {/* O botão "Sair" entra na Rota A e na Rota B com a mesma assinatura
            (variante apropriada em cada rota) */}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
```

> Na Rota A o stub não precisa de botão (você controla de fora); na Rota B ele recebe `navigation` por prop e terá um `TextButton` "Sair" → `navigation.replace('Login')`.

---

# ROTA A — Navegação por estado (zero dependências)

## 3. Como funciona

A raiz (`App.js`) mantém `currentScreen: 'login' | 'cadastro1' | 'cadastro2' | 'painel'` e renderiza um switch. Cada tela recebe props-callback para pedir "ir para X":

- `LoginScreen`: `onCadastrar()`, `onEntrar()`
- `CadastroPasso1Screen`: `onVoltar()`, `onContinuar(payload?)`
- `CadastroPasso2Screen` (provisória — ver §3.3): `onVoltar()`, `onContinuar(payload?)`
- `PainelScreen`: nada (fim do caminho nesta fase)

Os `Alert.alert` de demonstração são substituídos por esses callbacks.

## 3.1 `App.js` (o seu entry point real)

```js
// App.js — comentar o anterior (não deletar): ele era o andaime
import { useState, useCallback } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import PainelScreen from './src/screens/PainelScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
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
    // Passo 2 provisória (substitua pelo CadastroPasso2Screen quando pronto):
    conteudo = <View style={styles.placeholder}><Text style={styles.texto}>CadastroPasso2Screen será implementada aqui (mesmos componentes da Tela 2).</Text></View>;
  } else {
    conteudo = <PainelScreen />;
  }

  return <SafeAreaView style={styles.safe}>{conteudo}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F3F8' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { textAlign: 'center', color: '#64748B', fontSize: 14, lineHeight: 20 },
});
```

> `react-native-safe-area-context` NÃO é obrigatório; se não estiver no projeto, troque por `View style={{ flex: 1 }}`.

## 3.2 Deltas nas telas existentes

### LoginScreen (`src/screens/LoginScreen.tsx`)
Trocar a interface e os `Alert` pelos callbacks:

```tsx
type Props = {
  onCadastrar: () => void;
  onEntrar: () => void;
};

export default function LoginScreen({ onCadastrar, onEntrar }: Props) {
  // ...
  // no lugar de: onPress={handleCadastrar} com Alert → direto no callback
  // botão Cadastrar-se:
  <TouchableOpacity ... onPress={onCadastrar}>
  // botão Entrar:
  const handleEntrar = () => {
    // validar...
    onEntrar(); // no lugar do Alert
  };
}
```

### CadastroPasso1Screen
```tsx
type Props = {
  onVoltar: () => void;
  onContinuar: () => void;
};

export default function CadastroPasso1Screen({ onVoltar, onContinuar }: Props) {
  // handleVoltar = () => onVoltar();
  // handleContinuar = () => onContinuar();  // mantêm validações da tela
}
```

## 3.3 CadastroPasso2Screen (provisória para o teste)

Crie um stub `src/screens/CadastroPasso2Screen.tsx` idêntico à estrutura do CadastroPasso1Screen, só com título `Complete os dados da clínica` e `TextButton` de voltar → `onVoltar()`. Quando chegar a hora do Guia 04, ele vira o real (mesmas peças: `AuthScreen/FormField/PrimaryButton/Stepper active={1}`).

## 3.4 Limites da Rota A (seja honesto)

- **Não há histórico**: Android *back* fecha o app, não volta de tela
- **Sem params**: não passa dados entre telas — passe pelo estado da raiz (`const [dados, setDados] = useState({})`) se precisar
- **Telas novas = alterar a raiz a cada vez** (você ainda mexe no `App.js`, só que menos)
- Cada tela fica acoplada à interface raiz — não dá para navegar sem passar por `App.js`

---

# ROTA B — React Navigation (recomendada para escalar)

## 4. Instalação

No Snack (app): **Dependencies → Add dependency** → digite, um por vez, e espere cada um instalar:

```
@react-navigation/native
@react-navigation/native-stack
react-native-screens
react-native-safe-area-context
```

Fora do Snack (local):

```
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
```

> `expo install` alinha versões com o SDK atual — sempre prefira a `npm install` direto.

## 5. `App.js` (o seu entry)

```js
// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import PainelScreen from './src/screens/PainelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro1" component={CadastroPasso1Screen} />
        <Stack.Screen name="Painel" component={PainelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

Regras: **headers OFF** (`headerShown: false`) porque as telas já têm o cabeçalho de auth custom; a raiz de um Stack é a primeira rota declarada (`Login`).

### Explicando o que cada parte faz
- `NavigationContainer` — contexto global de navegação; envolve TUDO o que é navegável do app (um por app)
- `createNativeStackNavigator()` — cria o "tipo" do navegador nativo; `Stack.Navigator` renderiza as telas conforme a pilha
- `headerShown: false` — remove a barra padrão (você quer iOS-style custom; o seu `AuthScreen` faz esse papel)
- Ordem das `Stack.Screen` = pilha de navegação; top = primeira exibida

## 6. Deltas nas telas (Rota B)

### LoginScreen
```tsx
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types'; // seção 8

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  // Cadastrar-se:
  // <TouchableOpacity onPress={() => navigation.navigate('Cadastro1')}>…
  // Entrar:
  // const handleEntrar = () => { onValidar(); navigation.replace('Painel'); };
}
```

### CadastroPasso1Screen
```tsx
type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro1'>;

export default function CadastroPasso1Screen({ navigation }: Props) {
  // Voltar: <TextButton label="Voltar" onPress={() => navigation.goBack()} />
  // Continuar: onValidar(); navigation.navigate('Cadastro2'); // quando existir
}
```

### CadastroPasso2Screen
Mesma estrutura; `navigation.goBack()` no Voltar e `navigation.replace('Painel')` no Concluir.

### PainelScreen
```tsx
// dentro do stub, adicionar:
import TextButton from '../componentes/TextButton';
<TextButton label="Sair" onPress={() => navigation.replace('Login')} />
```

## 7. Params (por que você NÃO passa a senha e a regra correta)

Dados pequenas e públicos (nome, e-mail) entre telas usam `navigation.navigate('Cadastro2', { nome, email })` e leitura com `const { nome, email } = route.params`. **Nunca passe senha por params** — nem para templates, nem para exercícios:

- Params aparecem no stack nativo e potencialmente em logs/devtools
- Ideal: passa identidade mínima e carregar o resto de um store (Zustand) ou Context
- Se precisar de session completa: `src/store/session.tsx` ou Zustand (o projeto já sabe usar Zustand na versão web) — fora de escopo deste guia; limitamos a `nome`/`email` públicos

```tsx
// Cadastro2 (exemplo)
const { nome = '', email = '' } = route.params ?? {};
```

## 8. Tipagem do Stack (RootStackParamList)

```tsx
// src/navigation/types.ts (opcional, recomendo)
export type RootStackParamList = {
  Login: undefined;
  Cadastro1: undefined;
  Cadastro2: { nome: string; email: string } | undefined;
  Painel: undefined;
};
```

`undefined` = telas sem params. Qualquer param que a tela precise lê pelo mesmo nome do key.

## 9. Constantes de rota (anti-typo)

```tsx
// src/navigation/routes.ts
export const ROUTES = {
  LOGIN: 'Login',
  CADASTRO_1: 'Cadastro1',
  CADASTRO_2: 'Cadastro2',
  PAINEL: 'Painel',
} as const;

export type RouteName = (typeof ROUTES)[keyof typeof ROUTES];
```

Ficar com uma única fonte elimina o erro #1 de navegação (`'Cadastro2'` com typo funciona em dev mas derruba em produção). Use string pura **só na definição**; no resto do código, sempre `ROUTES.X`.

---

## 10. Checklist de validação (vale para as duas rotas)

- [ ] Aberto o app: primeira tela é a de Login
- [ ] `Cadastrar-se` → Tela Cadastro Passo 1
- [ ] `Continuar →` → Tela Cadastro Passo 2 (stub)
- [ ] `Voltar` no Passo 1 → Login
- [ ] `Voltar` no Passo 2 → Passo 1 (e **não** Login)
- [ ] `Entrar` (com qualquer credencial preenchente válida) → Painel
- [ ] Android *back* na tela de Login: fecha o app (raiz) — ok; nas outras: volta de tela — obrigatório
- [ ] Nenhuma tela põe `<StatusBar>` e cabeçalho dourado (vêm de `AuthScreen`)
- [ ] Nenhuma tela importa outra por caminho direto (`import LoginScreen from` em Cadastro)

---

## 11. Troubleshooting

### `The action 'NAVIGATE' with payload { name: ... } was not handled by any navigator`
- **Causa**: nome da rota digitado errado / rota não registrada no `Stack.Navigator`
- **Fix**: conferir §5 (`Stack.Screen name=` e `navigation.navigate('NomeExato')`); usar `ROUTES` §9

### `Screen 'Cadastro2' was not registered in the asset map`
- **Causa**: arquivo não salvo / cache do Metro desatualizado
- **Fix**: Snack — editar + salvar e esperar recompilar; local — `r` no terminal do Metro, ou `npx expo start -c`

### `navigation` é `undefined` dentro da tela
- **Causa**: tela renderizada fora do `NavigationContainer`/Stack (ex.: teste direto no App sem container)
- **Fix**: a tela só existe DENTRO do Stack; testes usam `renderWithProviders` ou isola `NavigationContainer`

### `route.params` é `undefined` ou veio vazio
- **Causa**: `navigation.navigate('Cadastro2', { nome, email })` x `route.params` com nome diferente do que você passou
- **Fix**: imprimir `route.params` no console antes de extrair; cadeia `Cadastro1 → Cadastro2` sem params precisa de default (`?? {}`)

### Voltar no Android sai do app em vez de voltar para tela anterior
- **Causa**: comportamento raiz de stack — `Login` é a primeira tela; Android *back* na raiz fecha o app
- **Fix**: é esperado; se quiser desabilitar, `BackHandler` no mount (não recomendado — ninguém gosta de app que não fecha)

### Painel abre e você pode "voltar" para o Login logado como se fosse /login público
- **Causa**: navegação com `navigate` onde o correto era `replace`
- **Fix**: colocar `navigation.replace('Login')`/`replace('Painel')` onde ninguém deveria poder "voltar" (login ok, painel: sessão; sair do painel: replace para Login)

### `react-native-screens` warning no iOS: "Could not find module"
- Só ocorre fora do Expo Go. No Expo Go está no binário; no bare, `cd ios && pod install`

### Erro "NavigationContainer: only ONE instance allowed"
- **Causa**: dois `NavigationContainer` na árvore (ex.: você deixou o container dentro de cada tela)
- **Fix**: um container só, na raiz (`App.js`)

---

## 12. O que esta fase **NÃO** cobre (e como seguir)

- Autenticação/guardas (redirect para Login quando não logado)
- Logout explícito com limpeza de sessão
- Modal sheets, tabs, drawers
- Deep links (`clinica-psi://painel` — outro universo)
- Expo Router (alternativa file-based, `app/_layout.tsx`; escolha quando as rotas passarem de ~6-7 telas)
- Compartilhamento de estado entre telas (Zustand/Context ainda não montados)

**Próximo guia (04) — Auth local**: PBKDF2 + AsyncStorage + guardas de rota + "Entrar"/"Sair" de verdade, espelhando o web app.
