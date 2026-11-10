// src/componentes/EmptyHero.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function EmptyHero({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.circle}>
        <Text style={styles.plus}>+</Text>
      </View>
      <Text style={styles.title}>Crie seu primeiro paciente para começar</Text>
      <Text style={styles.subtitle}>
        Cadastre o primeiro paciente para acompanhar sessões, evoluções e termos LGPD em um só lugar.
      </Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Novo paciente"
      >
        <Text style={styles.buttonText}>+ Novo paciente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  plus: { fontSize: 30, color: colors.primary, fontWeight: '700' },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
