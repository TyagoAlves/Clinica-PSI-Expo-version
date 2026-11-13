// src/modais/SheetModal.tsx
// Moldura comum dos formulários em "bottom sheet" (sessão, serviço, clínica, perfil):
// cabeçalho com título e ×, corpo rolável, rodapé com Excluir (opcional), Cancelar e ação principal.
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buttonShadow, colors } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  onClose: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  saving?: boolean;
  error?: string | null;
  /** Mostra o botão de lixeira à esquerda. */
  onDelete?: () => void;
  deleteLabel?: string;
  children: ReactNode;
};

export default function SheetModal({
  visible,
  title,
  subtitle,
  onClose,
  primaryLabel,
  onPrimary,
  saving,
  error,
  onDelete,
  deleteLabel = 'Excluir',
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar" style={styles.close}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>

          {/* Erro fixo acima dos botões (visível sem rolar) */}
          {error ? (
            <Text style={[styles.error, { paddingHorizontal: 18 }]} accessibilityLiveRegion="polite">
              {error}
            </Text>
          ) : null}

          <View style={styles.footer}>
            {onDelete ? (
              <TouchableOpacity style={styles.btnDanger} onPress={onDelete} accessibilityRole="button" accessibilityLabel={deleteLabel}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.btnSecondary} onPress={onClose} accessibilityRole="button">
              <Text style={styles.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, saving && { opacity: 0.7 }]}
              onPress={onPrimary}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnPrimaryText}>{primaryLabel}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** Rótulo + "chips" de opção única (status, serviço, profissional…). */
export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => (
          <TouchableOpacity
            key={o}
            style={[styles.chip, value === o && styles.chipActive]}
            onPress={() => onChange(o)}
            accessibilityRole="button"
            accessibilityState={{ selected: value === o }}
            accessibilityLabel={`${label}: ${o}`}
          >
            <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export const sheetStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  label: { fontSize: 13, fontWeight: '700', color: colors.label, marginBottom: 8 },
  textarea: {
    minHeight: 92,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 10, marginBottom: 10 },
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
  close: { padding: 4 },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.label, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  error: { color: colors.error, fontSize: 13, marginTop: 6 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  btnDanger: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.text },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    ...buttonShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
