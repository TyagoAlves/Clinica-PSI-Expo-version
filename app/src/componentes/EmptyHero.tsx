// src/componentes/EmptyHero.tsx
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

type Props = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  onPress?: () => void;
};

export default function EmptyHero({
  title = 'Crie seu primeiro paciente para começar',
  subtitle = 'Cadastre o primeiro paciente para acompanhar sessões, evoluções e termos LGPD em um só lugar.',
  buttonLabel = '+ Novo paciente',
  onPress,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.circle}><Text style={styles.plus}>+</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <TouchableOpacity style={styles.button} onPress={onPress} accessibilityRole="button" accessibilityLabel={buttonLabel}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  circle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(79, 70, 229, 0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  plus: { fontSize: 32, fontWeight: '400', color: '#4F46E5', marginTop: 2 },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center', paddingHorizontal: 12 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 },
  button: {
    height: 44, borderRadius: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
