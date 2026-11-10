// src/componentes/NovoPacienteModal.tsx
import { useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import FormField from './FormField';

// Catálogo para os dropdowns (sem backend nesta fase)
const SERVICES = ['Psicoterapia', 'Avaliação', 'Acompanhamento'];
const SITUACOES = ['Em tratamento', 'Pausado', 'Alta'];
const PROFESSIONALS = ['Ana Souza', 'Marcos Lima', 'Clínica Psi'];
const DEFAULT_DATE = '08/11/2026';

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.fieldRow}>{children}</View>
);

const PickerRow = ({
  label,
  required,
  value,
  onPress,
}: {
  label: string;
  required?: boolean;
  value: string;
  onPress: () => void;
}) => (
  <View style={styles.fieldCol}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.req}> *</Text> : null}
    </Text>
    <TouchableOpacity
      style={styles.picker}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar ${label}: ${value}`}
    >
      <Text style={styles.pickerText} numberOfLines={1}>
        {value}
      </Text>
      <Ionicons name="chevron-down-outline" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  </View>
);

export type NovoPacientePayload = {
  nome: string;
  telefone: string;
  email: string;
  nascimento: string;
  documento: string;
  servico: string;
  inicio: string;
  situacao: string;
  profissional: string;
  endereco: string;
  responsavel: string;
  descricao: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (payload: NovoPacientePayload) => void;
};

export default function NovoPacienteModal({ visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [documento, setDocumento] = useState('');
  const [servico, setServico] = useState(SERVICES[0]);
  const [inicio, setInicio] = useState(DEFAULT_DATE);
  const [situacao, setSituacao] = useState(SITUACOES[0]);
  const [profissional, setProfissional] = useState(PROFESSIONALS[0]);
  const [endereco, setEndereco] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setNome('');
    setTelefone('');
    setEmail('');
    setNascimento('');
    setDocumento('');
    setServico(SERVICES[0]);
    setInicio(DEFAULT_DATE);
    setSituacao(SITUACOES[0]);
    setProfissional(PROFESSIONALS[0]);
    setEndereco('');
    setResponsavel('');
    setDescricao('');
    setError(null);
    setSaving(false);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSubmit = useCallback(() => {
    if (!nome.trim()) {
      setError('Informe o nome completo.');
      return;
    }
    if (!telefone.trim()) {
      setError('Informe um telefone de contato.');
      return;
    }
    if (!servico.trim()) {
      setError('Selecione o serviço.');
      return;
    }

    Keyboard.dismiss();
    setError(null);
    setSaving(true);

    const payload: NovoPacientePayload = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      nascimento: nascimento.trim(),
      documento: documento.trim(),
      servico,
      inicio,
      situacao,
      profissional,
      endereco: endereco.trim(),
      responsavel: responsavel.trim(),
      descricao: descricao.trim(),
    };

    if (onSaved) {
      onSaved(payload);
      close();
      return;
    }

    setSaving(false);
    Alert.alert('Paciente cadastrado', 'Já aparece para o seu atendimento.', [
      { text: 'OK', onPress: close },
    ]);
  }, [
    nome,
    telefone,
    servico,
    inicio,
    situacao,
    profissional,
    email,
    nascimento,
    documento,
    endereco,
    responsavel,
    descricao,
    onSaved,
    close,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { paddingTop: insets.top }]} accessibilityViewIsModal>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Novo paciente</Text>
            <TouchableOpacity
              onPress={close}
              style={styles.close}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
              accessibilityHint="Fecha o formulário sem salvar"
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormField
              label="Nome completo"
              required
              placeholder="Como o paciente deve aparecer no sistema"
              value={nome}
              onChangeText={(t) => {
                setNome(t);
                if (error) setError(null);
              }}
              autoCapitalize="words"
              maxLength={80}
              returnKeyType="next"
            />

            <FieldRow>
              <View style={styles.fieldCol}>
                <FormField
                  label="Telefone"
                  required
                  placeholder="(11) 3000-0000"
                  value={telefone}
                  onChangeText={(t) => {
                    setTelefone(t);
                    if (error) setError(null);
                  }}
                  keyboardType="phone-pad"
                  maxLength={16}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldCol}>
                <FormField
                  label="E-mail"
                  placeholder="nome@clinica.com.br"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={80}
                  returnKeyType="next"
                />
              </View>
            </FieldRow>

            <FieldRow>
              <View style={styles.fieldCol}>
                <FormField
                  label="Nascimento"
                  placeholder="DD/MM/AAAA"
                  value={nascimento}
                  onChangeText={setNascimento}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldCol}>
                <FormField
                  label="Documento"
                  placeholder="CPF ou RG"
                  value={documento}
                  onChangeText={setDocumento}
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="next"
                />
              </View>
            </FieldRow>

            <FieldRow>
              <PickerRow
                label="Serviço"
                required
                value={servico}
                onPress={() => {
                  const next = SERVICES[(SERVICES.indexOf(servico) + 1) % SERVICES.length];
                  setServico(next);
                }}
              />
              <View style={styles.fieldCol}>
                <FormField
                  label="Início do tratamento"
                  value={inicio}
                  onChangeText={setInicio}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
            </FieldRow>

            <FieldRow>
              <PickerRow
                label="Situação"
                value={situacao}
                onPress={() => {
                  const next = SITUACOES[(SITUACOES.indexOf(situacao) + 1) % SITUACOES.length];
                  setSituacao(next);
                }}
              />
              <PickerRow
                label="Profissional responsável"
                value={profissional}
                onPress={() => {
                  const next =
                    PROFESSIONALS[(PROFESSIONALS.indexOf(profissional) + 1) % PROFESSIONALS.length];
                  setProfissional(next);
                }}
              />
            </FieldRow>

            <FormField
              label="Endereço"
              placeholder="Rua e número"
              value={endereco}
              onChangeText={setEndereco}
              maxLength={160}
              returnKeyType="next"
            />

            <FormField
              label="Responsável"
              placeholder="Nome do responsável"
              value={responsavel}
              onChangeText={setResponsavel}
              autoCapitalize="words"
              maxLength={80}
              returnKeyType="next"
            />

            <View style={styles.descriptionWrap}>
              <Text style={styles.label}>Descrição / queixa principal</Text>
              <TextInput
                style={styles.multiline}
                placeholder="O que trouxe o paciente até o atendimento?"
                placeholderTextColor={colors.placeholder}
                value={descricao}
                onChangeText={setDescricao}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </View>

            {error ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.buttonSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar paciente"
              accessibilityHint="Cadastra o paciente e fecha o formulário"
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Cadastrar paciente</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    maxHeight: '96%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  close: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  closeText: { fontSize: 24, lineHeight: 26, color: colors.textMuted, fontWeight: '500' },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fieldCol: { flex: 1, minWidth: 0, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
  picker: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { fontSize: 15, color: colors.text, flexShrink: 1 },
  descriptionWrap: { marginBottom: 4 },
  multiline: {
    minHeight: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    width: '100%',
  },
  errorText: { color: colors.error, fontSize: 13, flexShrink: 1, flex: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonSecondary: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  buttonPrimary: {
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
