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
import { useAuth } from '../auth/AuthProvider';
import { maskEmail } from '../services/masks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  onCadastrar?: () => void;
};

export default function LoginScreen({ onCadastrar }: Props = {}) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEntrar = useCallback(async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa de ao menos 6 caracteres.');
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    try {
      // Sucesso troca a tela sozinho (App.tsx observa o status da sessão).
      await login(email.trim(), password);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Não foi possível entrar. Tente de novo.');
    }
  }, [email, password, login]);

  const handleCadastrar = useCallback(() => {
    if (onCadastrar) return onCadastrar();
    Alert.alert(
      'Cadastro',
      'O fluxo de cadastro em 2 passos entra quando a navegação estiver ligada.',
      [{ text: 'Entendi' }]
    );
  }, [onCadastrar]);

  return (
    <AuthScreen>
      <FormField
        id="email"
        label="E-mail"
        required
        placeholder="nome@clinica.com.br"
        value={email}
        onChangeText={(t) => {
          setEmail(maskEmail(t));
          if (error) setError(null);
        }}
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
        onChangeText={(t) => {
          setPassword(t);
          if (error) setError(null);
        }}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
