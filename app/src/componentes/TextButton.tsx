// src/componentes/TextButton.tsx
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export default function TextButton({ label, onPress, accessibilityLabel }: Props) {
  return (
    <TouchableOpacity
      style={styles.root}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { paddingVertical: 10, paddingHorizontal: 4, alignSelf: 'flex-start' },
  text: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
});
