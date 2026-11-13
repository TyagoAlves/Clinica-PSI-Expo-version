// src/componentes/BrandHeader.tsx
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function BrandHeader() {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <View style={styles.logo} accessibilityLabel="Clínica Psi">
        <Text style={styles.logoText}>CP</Text>
      </View>
      <Text style={styles.title}>Clínica Psi</Text>
      <Text style={styles.subtitle}>Prontuário psicológico</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
});
