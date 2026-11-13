// src/componentes/TopBar.tsx
// Barra superior das telas internas: ☰ (abre o menu) ou ← (volta), título e ação opcional.
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

type Props = {
  title: string;
  subtitle?: string | null;
  /** 'menu' abre o drawer; 'back' volta para a tela anterior. */
  left: 'menu' | 'back';
  onLeft: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

export default function TopBar({ title, subtitle, left, onLeft, actionLabel, onAction }: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.leftBtn}
        onPress={onLeft}
        accessibilityRole="button"
        accessibilityLabel={left === 'menu' ? 'Abrir menu' : 'Voltar'}
      >
        {left === 'menu' ? (
          <Text style={styles.menuIcon}>☰</Text>
        ) : (
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        )}
      </TouchableOpacity>
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  leftBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 20, color: colors.text },
  titles: { flex: 1, minWidth: 0 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  action: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
