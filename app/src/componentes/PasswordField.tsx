// src/componentes/PasswordField.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  required?: boolean;
  id?: string;
}

export default function PasswordField({ label, required, id, ...rest }: Props) {
  const [show, setShow] = useState(false);
  const labelId = id ? `${id}-label` : `${label}-label`;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label} nativeID={labelId}>
        {label}
        {required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabelledBy={labelId}
          nativeID={id}
          style={[styles.input, styles.inputFlex]}
          placeholder="••••••••"
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          textContentType="password"
          {...rest}
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShow((v) => !v)}
          accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.label, marginBottom: 6 },
  req: { color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center' },
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
  inputFlex: { flex: 1 },
  eye: {
    position: 'absolute',
    right: 10,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
