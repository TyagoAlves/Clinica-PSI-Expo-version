// src/screens/CadastroPasso1Screen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PasswordField from '../componentes/PasswordField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import InfoNote from '../componentes/InfoNote';
import TextButton from '../componentes/TextButton';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// CRP no formato CRP 06/00000 (06/0000 até 06/999999) — validação de UX, não de conselho
const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;

export default function CadastroPasso1Screen() {
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
      Alert.alert(
        'Cadastro (demonstração)',
        'E-mail válido, senha confirmada. O passo 2 (Dados da clínica) entra na próxima tela.',
        [{ text: 'OK' }]
      );
    }, 900);
  }, [nome, email, senha, confirmarSenha, crp]);

  const handleVoltar = useCallback(() => {
    Alert.alert('Voltar', 'A navegação entra na próxima fase. Por enquanto, a tela de login é onde tudo começa.', [{ text: 'Entendi' }]);
  }, []);

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
