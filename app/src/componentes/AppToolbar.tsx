// src/componentes/AppToolbar.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Barra superior das telas pós-login (Painel, Pacientes, Agenda…).
// ☰ sempre abre o drawer; busca é fachada ou controlada; à direita, opcional,
// um botão de ação (⋮) para a tela que precisar de "mais ações".
type Props = {
  onMenuPress: () => void;
  search?: string;                  // valor controlado (padrão: '')
  onChangeSearch?: (text: string) => void;
  searchDisabled?: boolean;         // Painel/Agenda: busca de fachada até a lista existir
  placeholder?: string;
  rightActionIcon?: keyof typeof Ionicons.glyphMap;  // ex.: 'ellipsis-vertical'
  onRightActionPress?: () => void;
  rightActionLabel?: string;                          // a11y (ex.: 'Mais ações')
};

export default function AppToolbar({
  onMenuPress,
  search = '',
  onChangeSearch,
  searchDisabled = false,
  placeholder = '⌕ Buscar paciente pelo nome ou telefone…',
  rightActionIcon,
  onRightActionPress,
  rightActionLabel,
}: Props) {
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

      {searchDisabled ? (
        <TextInput
          style={styles.search}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          editable={false}
          accessibilityLabel="Buscar paciente"
        />
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
          <Ionicons name={rightActionIcon} size={18} color={colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,   // até as bordas (anula o padding da AppScreen)
    paddingHorizontal: 16,
  },
  menuBtn: {
    width: 42, height: 42, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.text },
  search: {
    flex: 1, height: 42, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12, fontSize: 13, color: colors.text,
  },
});
