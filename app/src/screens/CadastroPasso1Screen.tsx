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
import { useDatabase } from '../database/DatabaseProvider';
import { AuthService } from '../services/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;

type Props = {
  onVoltar?: () => void;
  onContinuar?: () => void;
  navigation?: { goBack: () => void };
};

export default function CadastroPasso1Screen({ onVoltar, onContinuar, navigation }: Props = {}) {
  const { userRepo } = useDatabase();
  const scrollToEnd = useAuthScroll();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [crp, setCrp] = useState('');
  const [funcao, setFuncao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => {
    if (error) setError(null);
  };

  const handleContinuar = useCallback(async () => {
    if (!nome.trim()) {
      setError('Informe o nome.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setError('A senha precisa de ao menos 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não são iguais.');
      return;
    }
    if (crp.trim() && !CRP_REGEX.test(crp.trim())) {
      setError('CRP no formato CRP 06/00000, ex.: CRP 06/123456.');
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      const authService = new AuthService(userRepo);
      const res = await authService.register({
        name: nome.trim(),
        email: email.trim(),
        password: senha,
        crp: crp.trim() || undefined,
        role: funcao.toLowerCase().includes('admin') ? 'admin' : 'psychologist',
      });

      if (!res.success && res.error?.includes('já cadastrado')) {
        // Se já cadastrado, permite avançar no teste
      } else if (!res.success) {
        setError(res.error || 'Erro ao registrar no banco de dados.');
        setLoading(false);
        return;
      }

      setLoading(false);
      if (onContinuar) {
        onContinuar();
      } else {
        Alert.alert('Salvo no SQLite', 'Usuário persistido na tabela users com sucesso.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Erro ao salvar no banco SQLite.');
    }
  }, [nome, email, senha, confirmarSenha, crp, funcao, onContinuar, userRepo]);

  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert(
      'Voltar',
      'A navegação entra na próxima fase. Por enquanto, a tela de login é onde tudo começa.',
      [{ text: 'Entendi' }]
    );
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
        onChangeText={(t) => {
          setNome(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setEmail(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setSenha(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setConfirmarSenha(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setCrp(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setFuncao(t);
          clearError();
        }}
        onFocus={() => scrollToEnd?.()}
        autoCapitalize="sentences"
        maxLength={80}
        returnKeyType="go"
        onSubmitEditing={handleContinuar}
      />

      <InfoNote>
        A senha não é guardada: o sistema guarda só um derivado dela, e é esse derivado que compara
        no login.
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
