// src/componentes/PrimaryButton.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function PrimaryButton({ label, onPress, loading, disabled, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.disabled]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 8,
    width: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
