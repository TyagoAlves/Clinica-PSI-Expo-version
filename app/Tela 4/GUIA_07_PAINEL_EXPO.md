# Guia 07 — Painel (tela inicial em estado vazio) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Imagem de referência:** `painel-vazio-mobile.png` (nesta mesma pasta)
**Série:** GUIA_07 (GUIA_04 = Cadastro passo 2 · GUIA_05 = SQLite do conector · GUIA_06 = Refatorar Login[pasta Tela 2] · GUIA_07 = esta tela)
**Objetivo desta fase:** implementar o Painel em estado vazio (a tela para onde o usuário cai após login ou cadastro), sem navegação nova, sem backend — só o que aparece no mock de verdade.
**Formato:** passo a passo, arquivo por arquivo, com todo o código pronto para colar. Nenhuma outra tela é modificada; `theme.ts` segue intocado.

---

## 0. O que muda nesta fase

| Item | Status |
|---|---|
| `theme.ts` | inalterado |
| `screens/` | **1 arquivo novo** (`PainelScreen.tsx`) |
| `componentes/` | **3 componentes novos** (`AppScreen`, `SectionCard`, `EmptyHero`) |
| `App.js` | delta mínimo (**apague a Pilha tela temporária ou redirecione Login/Cadastro para `Painel`**) |
| Telas anteriores (Login, Cadastro 1 e 2) | nenhuma mudança de código |

**Regra desta tela:** a chrome é diferente das telas de auth — não tem marca nem rodapé de privacidade. É por isso que nasce `AppScreen.tsx` (a família "pós-login"), separada de `AuthScreen.tsx` (família "pré-login"). Não force `AuthScreen` a virar dupla personalidade.

---

## 1. O que a tela precisa ter (referência do mock `painel-vazio-mobile.png`)

| Elemento | Detalhe visual exato |
|---|---|
| Barra de status | `9:41` + ícones (manter `barStyle="dark-content"`) |
| Toolbar | fundo branco, 56px: `☰` à esquerda (borda cinza, raio 8) · caixinha de busca à direita com placeholder `⌕ Buscar paciente pelo nome ou telefone…` |
| Linha de título | à esquerda: `Painel` (negrito) sobre `Visão geral da clínica` (cinza) · à direita: `+ Novo Paciente` (indigo, branco, raio 8) |
| Hero vazio | cartão branco: círculo indigo claro com `+` grande, título `Crie seu primeiro paciente para começar`, texto `Cadastre o primeiro paciente para acompanhar sessões, evoluções e termos LGPD em um só lugar.`, botão `+ Novo paciente` indigo |
| Card 1 | `Sessões de hoje` à esquerda e chip `Abrir agenda` à direita; corpo `Nenhuma sessão agendada para hoje.` |
| Card 2 | `Últimos registros`; corpo `Nenhuma evolução registrada.` |
| Card 3 | `Pacientes por serviço`; corpo `Nenhum paciente por serviço ainda.` |
| Rodapé | só indicador nativo (S21 FE sem barra de navegação do sistema) |
| Fundo | `#F1F3F8` |

Texto dos títulos: `Painel` / `Sessões de hoje` / `Últimos registros` / `Pacientes por serviço` — todos negrito 15, escuros. Corpo dos cartões: cinza, centralizado, ~40% da altura do card.

---

## 2. Arquitetura — os 3 componentes novos

```text
src/
├── theme.ts
├── componentes/
│   ├── AuthScreen.tsx          ← (sem mudança) família "pré-login"
│   ├── AppScreen.tsx           ← novo: família "pós-login" (statusbar + scroll)
│   ├── SectionCard.tsx         ← novo: cartão padronizado (título + ação + corpo)
│   ├── EmptyHero.tsx           ← novo: hero de "crie seu primeiro paciente"
│   └── (existentes…)           ← BrandHeader, FormField, PrimaryButton, etc.
└── screens/
    └── PainelScreen.tsx        ← a tela
```

### `SectionCard` — o desenho do cartão genérico

```tsx
interface Props {
  title: string;
  actionLabel?: string;      // ex.: "Abrir agenda"
  onActionPress?: () => void;
  children: React.ReactNode;
}
```

- título à esquerda, chip de ação à direita (opcional)
- corpo centralizado, padding vertical generoso (estados vazios cabem bem)
- cartão único reuso por todas as seções da Home

### `EmptyHero` — o bloco hero do mock

Componente autocontido (sem props) — texto fixo conforme o mock:

- círculo `#EEF2FF` (indigo-50) com `+` indigo, 72×72
- título + subtítulo (centralizados)
- botão `+ Novo paciente` centralizado (largura auto, não total)

### `AppScreen` — a moldura da família pós-login

Mais parecido com `AuthScreen` em espírito, mas: **sem BrandHeader**, sem rodapé de privacidade, sem `justifyContent: 'center'`, `paddingHorizontal: 16` (cartões largos como no mock), `paddingTop: 0` (o toolbar manda). Estrutura:

```tsx
export default function AppScreen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}
```

---

## 3. O código completo

### 3.1 `src/componentes/AppScreen.tsx`

```tsx
// src/componentes/AppScreen.tsx
import type { ReactNode } from 'react';
import { View, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../theme';

export default function AppScreen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 24,
  },
});
```

### 3.2 `src/componentes/SectionCard.tsx`

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
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  body: { alignItems: 'center', paddingVertical: 20 },
});
```

### 3.3 `src/componentes/EmptyHero.tsx`

```tsx
// src/componentes/EmptyHero.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function EmptyHero({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.circle}>
        <Text style={styles.plus}>+</Text>
      </View>
      <Text style={styles.title}>Crie seu primeiro paciente para começar</Text>
      <Text style={styles.subtitle}>
        Cadastre o primeiro paciente para acompanhar sessões, evoluções e termos LGPD em um só lugar.
      </Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Novo paciente"
      >
        <Text style={styles.buttonText}>+ Novo paciente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  plus: { fontSize: 30, color: colors.primary, fontWeight: '700' },
  title: {
    fontSize: 18, fontWeight: '800', color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13, color: colors.textMuted, lineHeight: 19,
    textAlign: 'center', marginTop: 8, marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
```

### 3.4 `src/screens/PainelScreen.tsx`

```tsx
// src/screens/PainelScreen.tsx
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import PrimaryButton from '../componentes/PrimaryButton';

const emBreve = () =>
  Alert.alert('Em breve', 'Nesta fase, os dados aparecem só depois que a persistência for conectada.', [{ text: 'Entendi' }]);

export default function PainelScreen() {
  return (
    <AppScreen>
      {/* Toolbar (☰ + busca) */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => Alert.alert('Menu', 'O menu lateral entra quando a navegação global estiver ligada.', [{ text: 'Entendi' }])}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.search}
          placeholder="⌕ Buscar paciente pelo nome ou telefone…"
          placeholderTextColor={colors.placeholder}
          editable={false}
          accessibilityLabel="Buscar paciente"
        />
      </View>

      {/* Linha de título + ação */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Painel</Text>
          <Text style={styles.subtitle}>Visão geral da clínica</Text>
        </View>
        <TouchableOpacity
          style={styles.newPatientBtn}
          onPress={emBreve}
          accessibilityRole="button"
          accessibilityLabel="Novo Paciente"
        >
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Hero estado vazio */}
      <EmptyHero onPress={emBreve} />

      {/* Sessões de hoje */}
      <SectionCard title="Sessões de hoje" actionLabel="Abrir agenda" onActionPress={emBreve}>
        <Text style={styles.muted}>Nenhuma sessão agendada para hoje.</Text>
      </SectionCard>

      {/* Últimos registros */}
      <SectionCard title="Últimos registros">
        <Text style={styles.muted}>Nenhuma evolução registrada.</Text>
      </SectionCard>

      {/* Pacientes por serviço */}
      <SectionCard title="Pacientes por serviço">
        <Text style={styles.muted}>Nenhum paciente por serviço ainda.</Text>
      </SectionCard>
    </AppScreen>
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
    marginHorizontal: -16,
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
    paddingHorizontal: 12, fontSize: 13, color: colors.placeholder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newPatientBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
```

> `TextInput search` copy-paste do mock com `editable={false}` — o search interativo entra na próxima fase junto da lista de pacientes. `emBreve()` centraliza as mensagens de "em breve" desta fase.

### 3.5 `App.js` — delta compacto e código completo da Rota A

**Delta compacto (uma única linha):**

```diff
  // antes
- conteudo = <PainelScreen onSair={irLogin} />;
  // depois
+ conteudo = <PainelScreen />;
```

Somente essa linha mudou. Os callbacks `onEntrar={irPainel}` (Login) e `onConcluir={irPainel}` (Cadastro Passo 2) já apontavam para `setTela('painel')` — não precisam mudar, e o import de `PainelScreen` já estava certo.

**Código completo (para quem vai do zero ao fim, sem adivinhar partes):**

```js
// App.js
import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
import PainelScreen from './src/screens/PainelScreen';

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
    conteudo = <CadastroPasso2Screen onVoltar={irCadastro1} onConcluir={irPainel} />;
  } else {
    conteudo = <PainelScreen />;
  }

  return <View style={styles.safe}>{conteudo}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F3F8' },
});
```

> Teste rápido no Expo Go: **Login → Entrar** (com qualquer senha válida) ou **Cadastro → Concluir** — ambos fecham no Painel.

Se estiver usando a **Rota B** (React Navigation), o delta continua sendo apenas registrar a tela:

```tsx
import PainelScreen from './src/screens/PainelScreen';
…
        <Stack.Screen name="Painel" component={PainelScreen} />
```

E a rota de entrada (qualquer uma das duas) pode ser `Painel` depois de `Login` — o fluxo já fecha Login → Cadastro (1/2) → Painel.

---

## 4. Acessibilidade (mínimo bom para esta tela)

- `☰` e `+ Novo Paciente` / `+ Novo paciente` / `Abrir agenda` têm `accessibilityRole` e `accessibilityLabel`
- Título `Painel` apenas texto — leitores de tela lidam naturalmente como cabeçalho (não é um botão)
- Alvo de toque ≥ 40×40 (CTAs e botão de menu)
- Sem ícones sem significado — o `+` é texto puro, sem `<Ionicons>` que dependa de font link

---

## 5. Checklist de aceite (contra `painel-vazio-mobile.png`)

**Visual**
- [ ] Fundo `#F1F3F8`; toolbar branca com borda por baixo
- [ ] `☰` à esquerda + busca com placeholder exato do mock
- [ ] `Painel` + `Visão geral da clínica` à esquerda; `+ Novo Paciente` (indigo) à direita
- [ ] Hero branco com círculo indigo claro `+`, título e frase exatos, CTA centrado `+ Novo paciente`
- [ ] `Sessões de hoje` + chip `Abrir agenda`; corpo centralizado `Nenhuma sessão agendada…`
- [ ] `Últimos registros` (`Nenhuma evolução registrada.`)
- [ ] `Pacientes por serviço` (`Nenhum paciente por serviço ainda.`)
- [ ] Cores só do theme + `rgba` para tintas (`#EEF2FF` equivalente via `rgba(79,70,229,0.10)`)

**Funcional (nesta fase, tudo "em breve" aberto com `Alert`)**
- [ ] ☰ abre alert amigável
- [ ] Busca desabilitada (placeholder cinza)
- [ ] `+ Novo Paciente` e `+ Novo paciente` → Alert
- [ ] `Abrir agenda` → Alert
- [ ] Tela rola com `ScrollView`; fundo não salta ao abrir o teclado de nenhum campo (não há campo editável)

**Integração**
- [ ] `App.js` aponta para `Painel` (ou `navigation.navigate('Painel')` na Rota B) após login/cadastro
- [ ] Login → Cadastro → Painel navega sem warnings de rota não registrada

---

## 6. Troubleshooting direto

- **"Não encontro `AppScreen`"** → caminho do import do `PainelScreen` está `'../componentes/AppScreen'` (um nível acima da pasta `screens/`); confira o arquivo existe com esse nome exato
- **Search rendered esticada demais** → `marginHorizontal: -16` com `paddingHorizontal: 16` alinha a borda da toolbar ao conteúdo; se ficar torta, remova-os e alinhe ao padding comum
- **Botão `+` do hero centralizado?** → já é `alignSelf: 'center'` por ser filho do card com `alignItems: 'center'` (vem do `EmptyHero` styles). Não mexa
- **Loader/Box em branco / todo branco** → falta `flexGrow: 1` no `contentContainerStyle` ou `container flex: 1`; copie 3.1 literalmente
- **Mudou de cor do círculo para mais saturado** → o mock usa indigo claro; se quiser mais contraste, use `'rgba(79, 70, 229, 0.16)'` (mantendo dentro da família)
- **Teclado abre e fundo lê desnivelado** → `showsVerticalScrollIndicator={false}` e `keyboardShouldPersistTaps="handled"` já estão no `AppScreen`; não adicionar `KeyboardAvoidingView` aqui

---

## 7. Ordem das próximas telas

1. **GUIA_07 (este)** — Painel vazio
2. `Painel com dados` — mesmo layout esqueleto, mas com dados reais vindos do backend/SQLite (quando `auth` estiver pronto)
3. `Pacientes / Listagem com dados`
4. `Prontuário` (v1)

---

## 8. Refatorações esperadas nesta tela (nada de temas agora)

- Nada de instalar `react-native-gesture-handler`, `react-native-safe-area-context` — fora desnecessário para a fase
- `AppScreen`/`AuthScreen` têm claramente propósito diferente; **não misture** só porque ambos têm `StatusBar`
- Se um dia surgir um componente compartilhado entre Home e Painel (ex: `Toolbar`), extraia então; hoje seria generalização prematura
