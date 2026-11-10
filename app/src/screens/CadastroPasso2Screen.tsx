// src/screens/CadastroPasso2Screen.tsx
import { useCallback, useState } from 'react';
import { Alert, Keyboard, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen, { useAuthScroll } from '../componentes/AuthScreen';
import FormField from '../componentes/FormField';
import PrimaryButton from '../componentes/PrimaryButton';
import Stepper from '../componentes/Stepper';
import TextButton from '../componentes/TextButton';
import { useDatabase } from '../database/DatabaseProvider';
import { ClinicService } from '../services/clinic';

const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11}|\d{14})$/;

type Props = {
  onVoltar?: () => void;
  onConcluir?: () => void;
  navigation?: { replace?: (name: string) => void; goBack?: () => void };
};

export default function CadastroPasso2Screen({ onVoltar, onConcluir, navigation }: Props = {}) {
  const { clinicRepo, userRepo } = useDatabase();
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

  const handleVoltar = useCallback(() => {
    if (onVoltar) return onVoltar();
    if (navigation?.goBack) return navigation.goBack();
    Alert.alert('Voltar', 'Sem navegação, este fluxo termina aqui.', [{ text: 'Entendi' }]);
  }, [onVoltar, navigation]);

  const handleConcluir = useCallback(async () => {
    if (!nome.trim()) {
      setError('Informe o nome da clínica.');
      return;
    }
    if (cnpj.trim() && !CNPJ_REGEX.test(cnpj.trim())) {
      setError('CNPJ no formato 00.000.000/0001-90.');
      return;
    }
    setError(null);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const clinicService = new ClinicService(clinicRepo, userRepo);
      const res = await clinicService.createClinic({
        name: nome.trim(),
        cnpj: cnpj.trim() || undefined,
        address: endereco.trim() || undefined,
        phone: telefone.trim() || undefined,
      });

      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Erro ao registrar clínica no SQLite.');
        return;
      }

      if (onConcluir) return onConcluir();
      if (navigation?.replace) return navigation.replace('Painel');
      Alert.alert('Clínica Registrada no SQLite', 'Dados persistidos na tabela clinics.');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Erro ao gravar clínica no banco de dados.');
    }
  }, [nome, cnpj, endereco, telefone, onConcluir, navigation, clinicRepo, userRepo]);

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
        onChangeText={(t) => {
          setCnpj(t);
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
        placeholder="(11) 3000-0000"
        value={telefone}
        onChangeText={(t) => {
          setTelefone(t);
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
          setEmail(t);
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
          setSigla(t.toUpperCase());
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
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  helper: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 15,
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
