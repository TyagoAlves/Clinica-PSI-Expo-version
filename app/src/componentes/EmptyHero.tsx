// src/componentes/EmptyHero.tsx
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { card, colors } from '../theme';

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
    ...card,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  circle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  plus: { fontSize: 30, fontWeight: '500', color: colors.primary, marginTop: -2 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center', paddingHorizontal: 8 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },
  button: {
    height: 40, borderRadius: 10,
    paddingHorizontal: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});
