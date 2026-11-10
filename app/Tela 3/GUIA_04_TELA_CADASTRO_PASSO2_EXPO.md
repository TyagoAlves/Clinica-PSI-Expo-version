# Guia 04 — Tela de Cadastro (Passo 2: Dados da clínica) — Expo + React Native

**Projeto:** Clínica Psi — Prontuário para Psicólogos
**Imagem de referência:** `cadastro-passo2-mobile.png` (nesta mesma pasta)
**Série:** GUIA_04 (o auth local fica para depois deste guia)
**Meta:** implementar a tela exatamente como o mock, reutilizando os componentes da Tela 2 e adicionando só o necessário para o Stepper mostrar o passo concluído (`✓ Seus dados`).
**Foco do guia:** somente nas modificações em relação à Tela 2. Cada mudança aparece como "apague X" → "cole Y" — sem reescrever o arquivo inteiro.

---

## 0. O que muda nesta fase (resumo)

| Item | Status |
|---|---|
| `theme.ts` | inalterado |
| `componentes/` | **1 componente modificado** (`Stepper.tsx`, ganha estado "concluído") |
| `screens/CadastroPasso1Screen.tsx` | **nenhum** (o Passo 1 chama Passo 2 pela navegação) |
| `screens/CadastroPasso2Screen.tsx` | **novo arquivo** (tela do mock) |
| `App.js` | delta em Rota A **ou** Rota B (ver §6) |
| Login | nenhuma (já usa componentes — ver `GUIA_03B_REFATORACAO_COMPONENTES_TELA_1.md`, pasta `Tela 2`) |

---

## 1. O que a tela precisa ter (referência do mock)

| Elemento | Detalhe visual |
|---|---|
| Barra de status | `9:41` |
| Marca | `CP` + `Clínica Psi` + `Prontuário psicológico` |
| Stepper | `✓ Seus dados` (concluído, verde) · `2  Dados da clínica` (ativo, indigo) |
| Título | `Sua clínica` — negrito, alinhado à esquerda |
| Texto de apoio | `Estes dados aparecem no cabeçalho das fichas, nos termos e no rodapé dos documentos. Dá para ajustar depois em Configurações.` — cinza, 2 linhas |
| Campos (8) | `Nome da clínica *` (placeholder `ClínicaPsi`) · `Unidade` (`Unidade Pinheiros`) · `Responsável técnico` (sem placeholder) · `CNPJ / documento` (`12.345.678/0001-90`) · `Telefone` (`(11) 3000-0000`) · `E-mail da clínica` (`contato@clinica.com.br`) · `Endereço` (`Rua das Acácias, 120 - São Paulo/SP`) · `Sigla (aparece no ícone)` (`CP`) |
| CTA | `Concluir e entrar  →` — indigo cheio, branco, largura total |
| Voltar | `Voltar` — texto simples, cinza, abaixo do CTA |
| Rodapé | local apenas (identico ao resto do fluxo) |

Ordem dos campos conforme o mock; a Sigla é exibida em maiúsculas no ícone do sistema (`CP`).

---

## 2. Componente modificado — `src/componentes/Stepper.tsx`

Apenas ele ganha estado "concluído" (índices anteriores ao ativo). É a única mudança em `componentes/`.

### 2.1 Apague estes dois trechos do arquivo atual:

```tsx
        return (
          <View key={step.n} style={[styles.chip, isActive ? styles.chipActive : null]}>
            <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>
              {step.n}  {step.label}
            </Text>
          </View>
        );
```

```tsx
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.06)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
```

### 2.2 Cole no lugar:

```tsx
        const isDone = i < active;
        return (
          <View key={step.n} style={[styles.chip, isDone ? styles.done : isActive ? styles.chipActive : null]}>
            {isDone
              ? <Text style={[styles.chipText, styles.chipTextDone]}>✓  {step.label}</Text>
              : <Text style={[styles.chipText, isActive ? styles.chipTextActive : null]}>{step.n}  {step.label}</Text>}
          </View>
        );
```

```tsx
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.06)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  done: { borderColor: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.10)' },
  chipTextDone: { color: '#16A34A' },
```

**Por que assim?** Compatível com a Tela 2 sem tocar em nenhuma chamada existente: `active={0}` desenha igual a antes; `active={1}` mostra o primeiro chip como concluído (verde + ✓). Não adicione prop nova — o “concluído” é derivado de `i < active`, o padrão de todo stepper denso.

---

## 3. O arquivo novo — `src/screens/CadastroPasso2Screen.tsx`

Cole o conteúdo inteiro abaixo (copia/cola único, sem precisar misturar com código antigo):

```tsx
// src/screens/CadastroPasso2Screen.tsx
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen, { useAuthScroll } from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import InfoNote from '../componentes/InfoNote';
import TextButton from '../componentes/TextButton';

const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11}|\d{14})$/;

// Props opcionais — mesma regra da Tela 2: funciona sozinha (Alert) e conectada (Rota A/B)
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
    setTimeout(() => {
      setLoading(false);
      if (onConcluir) return onConcluir();
      if (navigation?.replace) return navigation.replace('Painel');
      Alert.alert('Cadastro concluído', 'Fluxo avançará para o Painel quando a navegação estiver ligada.', [{ text: 'OK' }]);
    }, 900);
  }, [nome, cnpj, onConcluir, navigation]);

  return (
    <AuthScreen>
      <Stepper
        steps={[
          { n: 1, label: 'Seus dados' },
          { n: 2, label: 'Dados da clínica' },
        ]}
        active={1}
      />

      <Text style={styles.sectionTitle}>Sua clínica</Text>
      <Text style={styles.helper}>
        Estes dados aparecem no cabeçalho das fichas, nos termos e no rodapé dos documentos.
        Dá para ajustar depois em Configurações.
      </Text>

      <FormField
        id="clinica"
        label="Nome da clínica"
        required
        placeholder="ClínicaPsi"
        value={nome}
        onChangeText={(t) => { setNome(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        maxLength={120}
        returnKeyType="next"
      />
      <FormField
        id="unidade"
        label="Unidade"
        placeholder="Unidade Pinheiros"
        value={unidade}
        onChangeText={(t) => { setUnidade(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        maxLength={64}
        returnKeyType="next"
      />
      <FormField
        id="responsavel"
        label="Responsável técnico"
        placeholder=""
        value={responsavel}
        onChangeText={setResponsavel}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="words"
        maxLength={80}
        returnKeyType="next"
      />
      <FormField
        id="cnpj"
        label="CNPJ / documento"
        placeholder="12.345.678/0001-90"
        value={cnpj}
        onChangeText={(t) => { setCnpj(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCorrect={false}
        maxLength={18}
        returnKeyType="next"
      />
      <FormField
        id="telefone"
        label="Telefone"
        placeholder="(11) 3000-0000"
        value={telefone}
        onChangeText={(t) => { setTelefone(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        keyboardType="phone-pad"
        maxLength={16}
        returnKeyType="next"
      />
      <FormField
        id="emailclinica"
        label="E-mail da clínica"
        placeholder="contato@clinica.com.br"
        value={email}
        onChangeText={(t) => { setEmail(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={80}
        returnKeyType="next"
      />
      <FormField
        id="endereco"
        label="Endereço"
        placeholder="Rua das Acácias, 120 - São Paulo/SP"
        value={endereco}
        onChangeText={(t) => { setEndereco(t); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="sentences"
        maxLength={160}
        returnKeyType="next"
      />
      <FormField
        id="sigla"
        label="Sigla (aparece no ícone)"
        placeholder="CP"
        value={sigla}
        onChangeText={(t) => { setSigla(t.toUpperCase()); clearError(); }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={3}
        returnKeyType="go"
        onSubmitEditing={handleConcluir}
      />

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Concluir e entrar  →"
        onPress={handleConcluir}
        loading={loading}
        accessibilityLabel="Concluir e entrar no Painel"
      />

      <TextButton label="Voltar" onPress={handleVoltar} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 15, fontWeight: '700', color: colors.text,
    marginBottom: 8,
  },
  helper: {
    alignSelf: 'flex-start',
    fontSize: 11, color: colors.textMuted, marginBottom: 12, lineHeight: 15,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorBg, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
```

> Unidade/Responsável/CNPJ/Telefone/E-mail/Endereço/Sigla são **opcionais**, como no mock (só `Nome da clínica` tem asterisco). Sigla transforma automaticamente em maiúsculas (`CP`).

---

## 4. InfoNote ou não?

O mock **não** tem a nota "A senha não é guardada…" — a Tela Passo 2 é sobre dados da clínica, sem senha. Em vez do `<InfoNote>`, o texto de apoio é um `<Text>` simples (estilo `helper`), mantendo a tela fiel ao mock.

---

## 5. Validações (mesmas regras do web app)

| Campo | Regra | Mensagem |
|---|---|---|
| Nome da clínica | obrigatório, `trim() ≥ 1` | `Informe o nome da clínica.` |
| CNPJ / documento | opcional; se preenchido, `00.000.000/0001-90` (ou 11/14 dígitos corridos) | `CNPJ no formato 00.000.000/0001-90.` |
| Demais | livres — mock não marca obrigatoriedade além do nome | — |

Validação na mesma ordem visual; primeira falha para (como na Tela 2).

---

## 6. Conexão no `App.js` — delta por rota

### 6.1 Rota A (máquina de estados — sem dependência de navegação)

**Passo 3 do guia 03** passou a renderizar a tela nova com o estado `cadastro2`. Recorte do `App.js` antes/depois:

Antes:
```tsx
  } else if (tela === 'cadastro2') {
    // Passo 2 provisória (substitua pelo CadastroPasso2Screen quando pronto):
    conteudo = <View style={styles.placeholder}>…
```

Depois:
```tsx
  } else if (tela === 'cadastro2') {
    conteudo = <CadastroPasso2Screen onVoltar={irCadastro1} onConcluir={irPainel} />;
```

Adicione/confirme o import no topo:
```tsx
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
```

### 6.2 Rota B (React Navigation)

**Já funciona sem editar a tela** — o Stack passa `navigation` automaticamente. Só registre a tela no `App.js`:

```tsx
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
…
        <Stack.Screen name="Cadastro2" component={CadastroPasso2Screen} />
```

Rota mais curta:
```tsx
// nome da rota EXATAMENTE como está neste guia:
"Cadastro2"
```

> Da Tela 2 (`CadastroPasso1Screen`), o botão `Continuar →` já leva para `Cadastro2` — nenhuma mudança de botão necessária.

---

## 7. Checklist de aceite (contra `cadastro-passo2-mobile.png`)

**Visual**
- [ ] Marca idêntica (Header igual às telas anteriores)
- [ ] Stepper: `✓ Seus dados` (verde + ✓) e `2 Dados da clínica` (indigo ativo)
- [ ] `Sua clínica` à esquerda, negrito
- [ ] Texto de apoio cinza, 2 linhas, com os termos cobertos no mock
- [ ] 8 campos na ordem do mock, mesmos placeholders
- [ ] `Concluir e entrar  →` indigo cheio, largura total, texto branco
- [ ] `Voltar` texto cinza encostado à esquerda
- [ ] Rodapé local idêntico, 11px

**Funcional**
- [ ] Continuar dispara validação de nome (e CNPJ opcional) antes do mock
- [ ] Em erro, o box vermelho aparece com as mensagens exatas do guia
- [ ] Sigla transforma automático para maiúsculas
- [ ] Campos baixos não ficam atrás do teclado (mesmo `useAuthScroll` das telas anteriores)
- [ ] Ao concluir: chama callback (Rota A/B) ou alerta de demonstração

**Integração**
- [ ] Passo 1 (tela Tela 2/GUIA_02) navega para Passo 2 (e não zumbir)
- [ ] Passo 2 volta para Passo 1 (Rota A/B)
- [ ] Passo 2 termina seu fluxo (painel Rota A / `replace('Painel')` Rota B)

---

## 8. Troubleshooting específico

### 8.1 O stepper mostra os dois chips como ativos/inativos errado
`active={1}` — o README exige exatamente esse índice; `Seus dados` vira concluído por `i < active`. Se aparecer o chip com número e sem ✓, o componente não foi salvo (erro de fence/savende) ou está rodando versão antiga: recarregue `r` no Metro / Snack **Reload**.

### 8.2 Sigla não capitaliza
`autoCapitalize="characters"` só pede ao teclado a capitalização; o `toUpperCase()` no `onChangeText` garante antes de gravar. Se o Android ignorar (teclado Google às vezes faz o contrário), o `toUpperCase()` vence porque chega antes do componente.

### 8.3 Voltar recarrega o Login inteiro
Ok — equivale ao comportamento "Voltar na Tela 2" (Rota B → `navigation.goBack()`, Rota A → `irCadastro1`). Com navegação ligada, a tela anterior é mantida na pilha; sem ela, o `replace`/estado pula direto.

### 8.4 Você quer pular Passo 1 e abrir direto Passo 2 em testes
```tsx
// App.js temporário
setTela('cadastro2'); // Rota A
```
   ou no Stack Rota B: `initialRouteName="Cadastro2"` no lugar de `Login`.

### 8.5 As duas barras de ✓ ficarem "double-icon" (Passo 1 ficar com ✓ também)
Isso acontece se você usar `✓ Seus dados` como label fixo em vez de derivar do `i < active`. O guia usa sempre `active`/`i`; persista isso.

---

## 9. Próximo passo: a tela para onde o usuário cai após login/cadastro

Quando a tela estiver pronta, o fluxo se completa com **`GUIA_07_PAINEL_EXPO.md`** na pasta **`Tela 4`** — o Painel em estado vazio, mesma moldura de conteúdo da Home do Penpot (`home-psipront-mobile-variant.png`). Se ainda não estiver lá: a pasta `Tela 4` já traz a referência (`painel-vazio-mobile.png`) e o guia completo (AppScreen + SectionCard + EmptyHero).

O painel abre após o login ou após concluir o cadastro ("Concluir e entrar  →"): Login → Cadastro 1 → Cadastro 2 → **Painel**.
