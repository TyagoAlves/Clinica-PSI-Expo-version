// src/screens/PainelScreen.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AuthScreen from '../componentes/AuthScreen';
import PrimaryButton from '../componentes/PrimaryButton';

export default function PainelScreen() {
  return (
    <AuthScreen>
      <View style={styles.wrap}>
        <Ionicons name="checkmark-circle-outline" size={56} color={colors.primary} />
        <Text style={styles.title}>Painel</Text>
        <Text style={styles.subtitle}>
          Você chegou ao fim do caminho. O painel real (do Penpot) substitui esta tela na próxima fase.
        </Text>
        {/* O botão "Sair" entra na Rota A e na Rota B com a mesma assinatura
            (variante apropriada em cada rota) */}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center', paddingVertical: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
