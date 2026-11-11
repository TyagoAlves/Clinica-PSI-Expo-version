// src/componentes/EvolucaoModal.tsx
// Registro de evolução (prontuário) de uma sessão: data + texto. Criar e editar.
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import FormField from './FormField';
import { DATE_BR, hojeBr } from '../services/patientForm';

export type EvolucaoPayload = { sessionDate: string; content: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (p: EvolucaoPayload) => Promise<void>;
  /** Presente = edição (mostra "Excluir"). */
  initial?: EvolucaoPayload | null;
  onDelete?: () => Promise<void>;
  patientName: string;
};

export default function EvolucaoModal({ visible, onClose, onSave, initial, onDelete, patientName }: Props) {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(hojeBr());
  const [texto, setTexto] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setData(initial?.sessionDate ?? hojeBr());
    setTexto(initial?.content ?? '');
    setError(null);
    setSaving(false);
  }, [visible, initial]);

  const salvar = async () => {
    if (!DATE_BR.test(data.trim())) return setError('Data da sessão no formato DD/MM/AAAA.');
    if (!texto.trim()) return setError('Escreva a evolução.');
    setSaving(true);
    setError(null);
    try {
      await onSave({ sessionDate: data.trim(), content: texto.trim() });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar. Tente de novo.');
    }
  };

  const excluir = () => {
    if (!onDelete) return;
    Alert.alert('Excluir evolução?', 'Esta evolução será removida do prontuário em todos os aparelhos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await onDelete();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{initial ? 'Editar evolução' : 'Nova evolução'}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {patientName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar" style={styles.close}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <FormField
              id="evolucao-data"
              label="Data da sessão"
              required
              placeholder="DD/MM/AAAA"
              value={data}
              onChangeText={setData}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.label}>
              Evolução <Text style={styles.req}>*</Text>
            </Text>
            <TextInput
              style={styles.textarea}
              placeholder="Como foi a sessão? Temas, intervenções, combinados…"
              placeholderTextColor={colors.placeholder}
              value={texto}
              onChangeText={setTexto}
              multiline
              textAlignVertical="top"
              maxLength={20000}
              accessibilityLabel="Texto da evolução"
            />
            <Text style={styles.hint}>
              <Ionicons name="lock-closed-outline" size={11} /> Conteúdo sigiloso: guardado cifrado no servidor.
            </Text>
            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            {onDelete ? (
              <TouchableOpacity style={styles.btnDanger} onPress={excluir} accessibilityRole="button" accessibilityLabel="Excluir evolução">
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} accessibilityRole="button">
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={salvar}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Salvar evolução"
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>Salvar evolução</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  close: { padding: 4 },
  body: { paddingHorizontal: 18, paddingTop: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.error },
  textarea: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  error: { color: colors.error, fontSize: 13, marginTop: 10 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 12 },
  btnDanger: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.text },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
