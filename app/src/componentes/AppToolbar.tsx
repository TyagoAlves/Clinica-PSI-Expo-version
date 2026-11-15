// src/componentes/AppToolbar.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useAuth } from '../login/AuthProvider';

// Barra superior das telas depois do login (Painel, Pacientes, Agenda).
// ☰ sempre abre o menu lateral. A busca só aparece quando a tela passa onChangeSearch;
// sem busca, mostra o nome da clínica.
// À direita, opcional, um botão de ação (⋮).
type Props = {
  onMenuPress: () => void;
  search?: string;                  // valor controlado (padrão: '')
  onChangeSearch?: (text: string) => void;
  placeholder?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;  // ex.: 'ellipsis-vertical'
  onRightActionPress?: () => void;
  rightActionLabel?: string;                          // a11y (ex.: 'Mais ações')
};

export default function AppToolbar({
  onMenuPress,
  search = '',
  onChangeSearch,
  placeholder = '⌕ Buscar paciente pelo nome…',
  rightActionIcon,
  onRightActionPress,
  rightActionLabel,
}: Props) {
  const { clinic } = useAuth();
  return (
    <View style={styles.toolbar}>
      {/* ☰ — quem abre o drawer é a tela */}
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={onMenuPress}
        accessibilityRole="button"
        accessibilityLabel="Abrir menu"
      >
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      {!onChangeSearch ? (
        <Text style={styles.brand} numberOfLines={1}>{clinic?.name ?? 'Clínica Psi'}</Text>
      ) : (
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={onChangeSearch}
          accessibilityLabel="Buscar paciente"
        />
      )}

      {/* ⋮ — botão de ação opcional, à direita */}
      {rightActionIcon ? (
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={onRightActionPress}
          accessibilityRole="button"
          accessibilityLabel={rightActionLabel ?? 'Ação'}
        >
          <Ionicons name={rightActionIcon} size={20} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,   // até as bordas (anula o padding da AppScreen)
    paddingHorizontal: 16,
  },
  menuBtn: {
    width: 40, height: 40, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 20, color: colors.text },
  brand: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.primary },
  search: {
    flex: 1, height: 40, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12, fontSize: 12, color: colors.text,
  },
});
