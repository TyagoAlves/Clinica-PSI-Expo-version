// src/componentes/FormField.tsx
import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, radius } from '../theme';

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
  wrap: { width: '100%', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '700', color: colors.label, marginBottom: 8 },
  req: { color: colors.label },
  input: {
    height: 52,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
});
