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
  wrap: { alignItems: 'center', marginBottom: 16 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
