// src/screens/LoginScreen.tsx
import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

// Regex prática para validação de e-mail em nível de UX.
// Não tenta validar RFC completo — só o suficiente para barrar erro de digitação.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEntrar = useCallback(() => {
    // 1) Validação de formato — antes de qualquer outra coisa
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa de ao menos 6 caracteres.');
      return;
    }

    // 2) Feche o teclado antes de qualquer transição
    Keyboard.dismiss();
    setError(null);
    setLoading(true);

    // 3) AQUI É MOCK: não há servidor nesta fase.
    //    Simula latência e mostra o sucesso. Troque por `AuthService.login` quando houver auth real.
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Login (demonstração)',
        'Nesta fase não há backend. Estrutura, UX e validação estão prontas.',
        [{ text: 'OK' }]
      );
    }, 900);
  }, [email, password]);

  const handleCadastrar = useCallback(() => {
    Alert.alert(
      'Cadastro',
      'O fluxo de cadastro em 2 passos (Seus dados → Dados da clínica) entra depois do login.',
      [{ text: 'Entendi' }]
    );
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardWrap}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="dark-content" />

        {/* Marca */}
        <View style={styles.logo} accessibilityLabel="Clínica Psi">
          <Text style={styles.logoText}>CP</Text>
        </View>
        <Text style={styles.title}>Clínica Psi</Text>
        <Text style={styles.subtitle}>Prontuário psicológico</Text>

        {/* Formulário */}
        <View style={styles.form}>
          <Text style={styles.label} nativeID="email-label">E-mail</Text>
          <TextInput
            accessibilityLabelledBy="email-label"
            style={styles.input}
            placeholder="nome@clinica.com.br"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(null);
            }}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            maxLength={80}
            returnKeyType="next"
            onSubmitEditing={() => {
              // avança para a senha sem fechar o teclado
              // (implementado depois com ref; nesta fase só não trava)
            }}
          />

          <Text style={[styles.label, styles.labelSpacing]} nativeID="senha-label">Senha</Text>
          <View style={styles.passwordRow}>
            <TextInput
              accessibilityLabelledBy="senha-label"
              style={[styles.input, styles.inputFlex]}
              placeholder="••••••••"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              textContentType="password"
              maxLength={64}
              returnKeyType="go"
              onSubmitEditing={handleEntrar}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Erro inline — a régua das mensagens do web app (app usa “E-mail ou senha inválidos.”) */}
          {error ? (
            <View style={styles.errorBox} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            activeOpacity={0.85}
            onPress={handleEntrar}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Entrar"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.link}
            onPress={handleCadastrar}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar-se"
          >
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={styles.linkText}>Cadastrar-se</Text>
          </TouchableOpacity>
        </View>

        {/* Rodapé — mesmo texto do web app */}
        <Text style={styles.footer}>
          O sistema guarda tudo apenas local. Nada é enviado para servidores.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 28,
  },
  form: { width: '100%', maxWidth: 400 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  labelSpacing: { marginTop: 14 },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputFlex: { flex: 1 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: {
    position: 'absolute',
    right: 10,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1 },
  button: {
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 8,
  },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 16,
  },
});
