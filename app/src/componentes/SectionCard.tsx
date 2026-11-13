// src/componentes/SectionCard.tsx
import type { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { card, colors } from '../theme';

export default function SectionCard({
  title,
  actionLabel,
  onActionPress,
  children,
}: {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel ? (
          <TouchableOpacity
            onPress={onActionPress}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.chipText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 16,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  chip: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  body: { alignItems: 'center', paddingTop: 8, paddingBottom: 20, minHeight: 64 },
});
