// src/telas/CadastroPasso2Screen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen, { useAuthScroll } from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import TextButton from '../componentes/TextButton';
import { useAuth } from '../login/AuthProvider';
import { isValidCpfCnpj, isValidPhone, maskAcronym, maskCpfCnpj, maskEmail, maskName, maskPhone } from '../utils/masks';


type Props = {
  onVoltar?: () => void;
  onConcluir?: () => void;
  navigation?: { replace?: (name: string) => void; goBack?: () => void };
};

export default function CadastroPasso2Screen({ onVoltar, onConcluir, navigation }: Props = {}) {
  const { createClinic, logout } = useAuth();
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

  const clearError = () => {
    if (error) setError(null);
  };

  // A conta já existe no servidor; "Voltar" sai da sessão e o passo 2 é retomado no próximo login.
  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert(
      'Concluir depois?',
      'Sua conta já foi criada. Para cadastrar a clínica depois, é só entrar com seu e-mail e senha.',
      [
        { text: 'Continuar aqui', style: 'cancel' },
        { text: 'Sair', onPress: () => logout() },
      ]
    );
  }, [onVoltar, navigation, logout]);

  const handleConcluir = useCallback(async () => {
    if (!nome.trim()) {
      setError('Informe o nome da clínica.');
      return;
    }
    if (cnpj.trim() && !isValidCpfCnpj(cnpj)) {
      setError('CNPJ ou CPF inválido (confira os números).');
      return;
    }
    if (telefone.trim() && !isValidPhone(telefone)) {
      setError('Telefone incompleto. Use DDD + número, ex.: 61 3000-0000.');
      return;
    }
    setError(null);
    setLoading(true);
    Keyboard.dismiss();

    try {
      // Sucesso: a sessão ganha a clínica e o App abre o Painel.
      await createClinic({
        name: nome.trim(),
        unit: unidade.trim() || null,
        technicalResponsible: responsavel.trim() || null,
        cnpj: cnpj.trim() || null,
        phone: telefone.trim() || null,
        email: email.trim() || null,
        address: endereco.trim() || null,
        acronym: sigla.trim() || null,
      });
      onConcluir?.();
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Não foi possível cadastrar a clínica. Tente de novo.');
    }
  }, [nome, unidade, responsavel, cnpj, telefone, email, endereco, sigla, onConcluir, createClinic]);

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
        onChangeText={(t) => {
          setNome(t);
          clearError();
        }}
        onFocus={() => scrollToEnd?.()}
        maxLength={120}
        returnKeyType="next"
      />
      <FormField
        id="unidade"
        label="Unidade"
        placeholder="Unidade Pinheiros"
        value={unidade}
        onChangeText={(t) => {
          setUnidade(t);
          clearError();
        }}
        onFocus={() => scrollToEnd?.()}
        maxLength={64}
        returnKeyType="next"
      />
      <FormField
        id="responsavel"
        label="Responsável técnico"
        placeholder=""
        value={responsavel}
        onChangeText={(t) => setResponsavel(maskName(t))}
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
        onChangeText={(t) => {
          setCnpj(maskCpfCnpj(t));
          clearError();
        }}
        onFocus={() => scrollToEnd?.()}
        autoCorrect={false}
        maxLength={18}
        returnKeyType="next"
      />
      <FormField
        id="telefone"
        label="Telefone"
        placeholder="61 3000-0000"
        value={telefone}
        onChangeText={(t) => {
          setTelefone(maskPhone(t));
          clearError();
        }}
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
        onChangeText={(t) => {
          setEmail(maskEmail(t));
          clearError();
        }}
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
        onChangeText={(t) => {
          setEndereco(t);
          clearError();
        }}
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
        onChangeText={(t) => {
          setSigla(maskAcronym(t));
          clearError();
        }}
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.label,
    marginBottom: 8,
  },
  helper: {
    alignSelf: 'flex-start',
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 14,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
});
