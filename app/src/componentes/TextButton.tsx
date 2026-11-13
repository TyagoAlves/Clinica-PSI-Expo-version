// src/componentes/TextButton.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  /** Ícone à esquerda do texto (ex.: "person-add-outline" no "Cadastrar-se"). */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Centraliza o botão (Login) em vez de alinhar à esquerda (Voltar). */
  center?: boolean;
}

export default function TextButton({ label, onPress, accessibilityLabel, icon, center }: Props) {
  return (
    <TouchableOpacity
      style={[styles.root, center && styles.center]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.textMuted} /> : null}
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  center: { alignSelf: 'center', marginTop: 12 },
  text: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
});
