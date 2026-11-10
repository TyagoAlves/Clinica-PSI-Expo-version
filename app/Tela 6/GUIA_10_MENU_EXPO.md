# Guia 10 — Menu lateral (drawer) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Arquivo de referência:** `menu-mobile.png` (nesta mesma pasta)
**Objetivo desta fase:** criar o menu lateral que o hambúrguer (`☰`) do `PainelScreen` abre, como **componente reutilizável** (`src/componentes/AppDrawer.tsx`), alinhado à filosofia do projeto: sem `react-navigation`/`Drawer` nativo enquanto estiver na Rota A.

---

## 0. Decisões já tomadas (para não reinventar)

| Tema | Regra |
|---|---|
| **Onde mora?** | `src/componentes/AppDrawer.tsx` — reutilizável para qualquer tela de pós-login |
| **Como abre?** | Estado controlado no pai (`const [drawerOpen, setDrawerOpen] = useState(false)`). Nada de `navigation.dispatch` |
| **Quem dispara?** | O botão `☰` da toolbar do `PainelScreen` (já existe) — basta trocar o `Alert.alert` por `setDrawerOpen(true)` |
| **Conteúdo?** | `Painel` (ativo por padrão), `Pacientes`, `Agenda`, `Serviços`, `Configurações`, e rodapé fixo com avatar `AS` + nome + função + seta |
| **Fundo do painel?** | Verde-escuro (`#0F172A`), largura ~72% do viewport com `maxWidth: 270`, altura total |
| **`onPress` dos itens?** | Nesta fase os itens apenas fecham o drawer; ligar à navegação entra quando usarmos a Rota B (`GUIA_03`) ou quando o alcance de dados estiver pronto |
| **Ícones** | `Ionicons` do Expo (já vem com a runtime do Expo Go) — sem instalar nada |
| **Animação** | Abertura: panel desliza da esquerda (`translateX`) + backdrop com fade — sem dependências novas; fechar é o inverso |
| **Safe area do rodapé?** | O rodapé precisa de `paddingBottom: Math.max(18, insets.bottom + 12)`, mesmo padrão dos botões do `NovoPacienteModal` |

---

## 1. O que a tela precisa ter (referência do mock `menu-mobile.png`)

| Elemento | Detalhes |
|---|---|
| **backdrop** | Camada escura semi-transparente (`rgba(15, 23, 42, 0.48)`) cobrindo o `PainelScreen` por trás do drawer |
| **marca** | `CP` em indigo + `Clínica Psi` + `Unidade Pinheiros`, alinhados na horizontal |
| **itens** | 5 itens na vertical: `Painel` (ativo), `Pacientes`, `Agenda`, `Serviços`, `Configurações` |
| **rodapé** | Avatar `AS` (indigo) + `Ana Souza` + `Psicóloga · CRP 06/123456` + seta (`→`) |

---

## 2. O código completo — `src/componentes/AppDrawer.tsx`

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
  onPress?: () => void;
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

  if (!mounted) return null;

  const activeItem =
    items.find((i) => i.active)?.key ??
    items[0]?.key;

  return (
    <Modal
      visible
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.backdrop, { opacity: fade }]}
        accessibilityViewIsModal
      >
        {/* Área fora do painel que fecha ao tocar */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fechar menu"
        />

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidthRef.current,
              maxWidth: panelWidthRef.current,
              paddingBottom: Math.max(18, insets.bottom + 12),
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Marca */}
          <View style={styles.brandRow}>
            <View style={styles.logo} accessibilityLabel="Clínica Psi">
              <Text style={styles.logoText}>CP</Text>
            </View>
            <View>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicUnit}>{clinic.unit}</Text>
            </View>
          </View>

          {/* Itens */}
          <View style={styles.items}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.item, item.key === activeItem && styles.itemActive]}
                onPress={() => {
                  item.onPress?.();
                  onClose();
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

          {/* Rodapé */}
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  panel: {
    flex: 1,
    maxWidth: 270,
    width: '72%',
    backgroundColor: '#0F172A',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  logo: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  clinicName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  clinicUnit: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  items: { flex: 1, gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: '#4F46E5' },
  itemIcon: { width: 22, textAlign: 'center' },
  itemLabel: { fontSize: 15, color: '#CBD5E1', fontWeight: '500' },
  itemLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 8,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#4F46E5',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerMeta: { flex: 1 },
  footerName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerRole: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  footerArrow: { color: '#CBD5E1', fontSize: 18 },
});
```

### 2.1 A animação (slide da esquerda → direita + fade do backdrop)

O React Native não deixa `animationType="slide"` vir da esquerda — o padrão é sempre bottom-to-top. Por isso o `AppDrawer` usa `<Modal animationType="none">` e anima manualmente via `Animated`:

- **Panel** desliza do eixo `x = -panelWidth` → `0` (260ms, `useNativeDriver: true`)
- **Backdrop** faz fade-in opacidade `0 → 1` em paralelo (240ms)
- Ao fechar, a animação reversa roda antes da desmontagem (`useEffect` com `[visible, fade, translateX]`); `mounted` controla se o painel é desenhado
- `useWindowDimensions()` calcula `panelWidth = Math.min(270, Math.round(width * 0.72))`, guardado em `panelWidthRef` — atende 360dp e telas maiores sem esticar o painel além de 270dp (e não entra no array de deps do effect)

> Se quiser a animação mais rápida/lenta, mexa só nos `duration` dentro de `useEffect`. O `useNativeDriver: true` garante 60fps sem bloquear a JS thread.

> **Por que `useSafeAreaInsets` está embutido aqui**: o rodapé do drawer toca no mesmo canto inferior da tela que o rodapé do `NovoPacienteModal`; o mesmo princípio se aplica. O provider (`<SafeAreaProvider>`) precisa estar na raiz do app — veja o `App.js` atualizado no **Guia 08**.
>
> **Reutilização dos mesmos ícones do app web** (Gride — Ícones Fa): `grid-outline`, `people-outline`, `calendar-outline`, `medkit-outline`, `settings-outline`. Se quiser glyph de uma família específica (ex.: `shield-outline` para LGPD), basta trocar pelo nome do Ionicons correspondente; o componente continua igual.

---

## 3. Ligando o `☰` do `PainelScreen` ao drawer

### 3.1 Imports + estado

No seu `PainelScreen.tsx`, adicione `AppDrawer` e o `useState`:

```tsx
import AppDrawer from '../componentes/AppDrawer';

// dentro do componente:
const [drawerOpen, setDrawerOpen] = useState(false);
```

Substitua a `Alert` do botão `☰` pelo controle do estado:

```tsx
// antes:
onPress={() => Alert.alert('Menu', 'O menu lateral entra quando a navegação global estiver ligada.', [{ text: 'Entendi' }])}
// depois:
onPress={() => setDrawerOpen(true)}
```

### 3.2 Renderizar o `AppDrawer` ao lado de `NovoPacienteModal`

```tsx
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={() => setNovoPacienteOpen(false)}
      />

      {/* menu lateral */}
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </AppScreen>
```

---

## 4. Delta unificado para o `PainelScreen.tsx`

```diff
 import AppScreen from '../componentes/AppScreen';
 import SectionCard from '../componentes/SectionCard';
 import EmptyHero from '../componentes/EmptyHero';
 import NovoPacienteModal from '../componentes/NovoPacienteModal';
+import AppDrawer from '../componentes/AppDrawer';

 export default function PainelScreen() {
   const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
+  const [drawerOpen, setDrawerOpen] = useState(false);
...
-           onPress={() => Alert.alert('Menu', 'O menu lateral entra quando a navegação global estiver ligada.', [{ text: 'Entendi' }])}
+           onPress={() => setDrawerOpen(true)}
...
       <NovoPacienteModal
         visible={novoPacienteOpen}
         onClose={() => setNovoPacienteOpen(false)}
         onSaved={() => setNovoPacienteOpen(false)}
       />
+      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
     </AppScreen>
   );
 }
```

**`App.js` não muda.** Continua a máquina de estados com `login | cadastro1 | cadastro2 | painel`.

### 4.1 `src/screens/PainelScreen.tsx` — arquivo completo (para quem vai substituir o arquivo inteiro)

Se você prefere copiar o arquivo inteiro do PainelScreen de uma vez, aqui está o arquivo com tudo que os Guias 07/09/10 já haviam adicionado **e** com o `AppDrawer` integrado — substituição segura (as explicações seguem em §4.0):

```tsx
// src/screens/PainelScreen.tsx
import { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import NovoPacienteModal from '../componentes/NovoPacienteModal';
import AppDrawer from '../componentes/AppDrawer';

const emBreve = () =>
  Alert.alert('Em breve', 'Nesta fase, os dados aparecem só depois que a persistência for conectada.', [{ text: 'Entendi' }]);

export default function PainelScreen() {
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AppScreen>
      {/* Toolbar (☰ + busca) */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerOpen(true)}
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
          onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo Paciente"
        >
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Hero estado vazio */}
      <EmptyHero onPress={() => setNovoPacienteOpen(true)} />

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

      {/* Modal Novo Paciente */}
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={() => setNovoPacienteOpen(false)}
      />

      {/* Menu lateral */}
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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

> Este arquivo substitui a versão mais recente do `PainelScreen.tsx` (Tela 5 / GUIA_09 §4.4), **acrescentando** somente as 3 linhas do drawer: o import, o `useState` `drawerOpen`, o `onPress={() => setDrawerOpen(true)}` no botão `☰` e a renderização `<AppDrawer … />` na raiz. Todo o resto (toolbar, headerRow, hero vazio, os 3 `SectionCard`, `NovoPacienteModal`) permanece idêntico ao arquivo anterior — nenhum texto ou explicação de passos foi alterado.

---

## 5. Construindo os itens com navegação (quando quiser)

```tsx
// src/navigation/drawerItems.ts (opcional)
import type { DrawerItem } from '../componentes/AppDrawer';

export const items: DrawerItem[] = [
  { key: 'painel',        label: 'Painel',        icon: 'grid-outline',      active: true },
  { key: 'pacientes',     label: 'Pacientes',     icon: 'people-outline',    onPress: () => navigation.navigate('Pacientes') },
  { key: 'agenda',        label: 'Agenda',        icon: 'calendar-outline',  onPress: () => navigation.navigate('Agenda') },
  { key: 'servicos',      label: 'Serviços',      icon: 'medkit-outline',    onPress: () => navigation.navigate('Serviços') },
  { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline',  onPress: () => navigation.navigate('Configurações') },
];
```

Esta é literalmente a lista de navegação da tela `☰` da web — basta trocar por funções de destino.

---

## 6. Checklist de aceite (contra `menu-mobile.png`)

**Visual**
- [ ] Drawer abre sobre o conteúdo (backdrop escuro)
- [ ] Marca: avatar `CP` (indigo) + `Clínica Psi` + `Unidade Pinheiros` em linha
- [ ] Item ativo: `Painel` com fundo indigo e borda arredondada
- [ ] Demais itens sem destaque
- [ ] Rodapé fixado: `AS` (circle indigo) + `Ana Souza` + `Psicóloga · CRP 06/123456` + seta `→`
- [ ] Largura: `72%` do viewport com `maxWidth: 270`
- [ ] Altura total (ou quase — rodapé ancorado ao bottom com insets)

**Funcional**
- [ ] Tocar no backdrop fecha
- [ ] Android Voltar (`onRequestClose`) fecha
- [ ] Tocar em `Painel`/`Pacientes`/`Agenda`/… fecha o drawer
- [ ] `Painel` começa marcado como ativo
- [ ] Drawer respeita `<SafeAreaProvider>`/`insets.bottom` do device
- [ ] Abertura do drawer vem **da esquerda → direita** (não bottom → top)
- [ ] Backdrop faz **fade** gradual ao abrir e fechar (não aparece "de uma vez")

**Integração**
- [ ] `AppScreen` contém o drawer como filho direto — não dentro do `ScrollView`
- [ ] Nenhuma dependência nova foi adicionada (`@expo/vector-icons` já vem com Expo Go)
- [ ] O pai continua sendo a `PainelScreen` — não introduzimos provider global

---

## 7. Troubleshooting direto

- **"Cannot find module @expo/vector-icons"** → confirme que está no Expo Go; se for build local, `npx expo install @expo/vector-icons`. Também garante que `Ionicons` está importado do `@expo/vector-icons`, não de outra família
- **Drawer fecha ao tocar em qualquer item, mas o conteúdo muda?** → nesta fase não troca de tela; só fecha. Para navegação real, ver §5
- **Área clicável fora não fecha (mesmo clicando no cantinho escuro)** → o `absoluteFill` está cobrindo o conteúdo — a `StyleSheet.absoluteFill` tem que ser irmã direta do `<View style={absoluteFill}>` (irmã do panel), não aninhada
- **Rodapé não respeita o 3-botão** → você provavelmente esqueceu de adicionar `paddingBottom: Math.max(18, insets.bottom + 12)` no `styles.panel` — mesmo padrão que o rodapé do `NovoPacienteModal`
- **"`useSafeAreaInsets` retorna zero"** → o `SafeAreaProvider` precisa estar na raiz do app (`App.js`); caso contrário, `useSafeAreaInsets()` devolve 0/0/0/0 — confirme se passou pela fase de barras de sistema (`Tela 4/GUIA_08_BARRAS_SISTEMA_EXPO.md`)
- **O backdrop cobre só a metade da tela** → confirme que o `Modal` tem `animationType="none"` (não `slide`/`fade`, que limitariam a animação) e que o `View` interno usa `StyleSheet.absoluteFill` como irmão direto do panel

### React Hook `useEffect` has missing dependencies: `fade`, `mounted`, and `translateX`

- **Causa**: o linter exige que toda referência estável dentro do efeito seja declarada no array de deps (mesmo que o valor seja um ref/Stable)
- **Fix (aplicado no código deste guia)**:
  - `panelWidthRef` guarda o valor em `useRef` (`panelWidthRef.current = …`), nunca lido dentro do effect diretamente
  - no effect: all externals são `[visible, fade, translateX]` — todos refs estáveis; `mounted` é definido internamente pelo `setMounted()`, sem ser lido
  - Panel só renderiza após `if (!mounted) return null`
- **Regra prática**: se você pode trocar um valor mutável por `useRef` e usar `….current` dentro do effect, faça isso — o linter fica feliz e o efeito não re-executa por valor irrelevante. As refs em `panelWidthRef`/`translateX`/`fade` nunca mudam de identidade, então o problema era só o array incompleto

---

## 8. O que ainda NÃO entra aqui

- Navegação por item (`navigate`, `replace`, `navigateWithDebounce`) — entra quando usarmos a Rota B (`GUIA_03_NAVEGACAO_EXPO.md`)
- Gesture swipe-to-open — não está no mock, e adiciona complexidade (hooks de gesture) sem benefício para este momento
- `theme.ts` — nenhuma mudança; o drawer usa as cores diretamente (`#0F172A`, `#4F46E5`) para preservar exatamente a identidade visual do menu
- Haptic feedback ao abrir — local opcional; não está no mock

---

## 9. Próximo passo

- Passe para a **Tela 7** (`Pacientes` lista, já no mock novo) ou ligue a **navegação** (GUIA_03) para que os itens do Drawer cheguem a algum lugar. Uma boa sequência: Tela 7 (lista) → Tela 8 (detalhe do paciente) → navegação — assim você fecha o ciclo `☰` → `Painel` → lista de pacientes → detalhe do paciente sem voltar.
