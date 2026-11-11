// src/componentes/FormField.tsx
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors } from '../theme';

interface Props extends TextInputProps {
  label: string;
  required?: boolean;
  id?: string;
}

export default function FormField({ label, required, id, style, ...rest }: Props) {
  const labelId = id ? `${id}-label` : `${label}-label`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={labelId}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <TextInput
        accessibilityLabelledBy={labelId}
        nativeID={id}
        style={[styles.input, style]}
        placeholderTextColor={colors.placeholder}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
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
});
