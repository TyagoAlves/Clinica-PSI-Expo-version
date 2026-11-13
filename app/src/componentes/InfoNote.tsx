// src/componentes/InfoNote.tsx
import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function InfoNote({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} style={styles.icon} />
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2, marginBottom: 12 },
  icon: { marginTop: 1 },
  text: { fontSize: 11, color: colors.textMuted, lineHeight: 17, flexShrink: 1, flex: 1 },
});
