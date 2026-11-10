// src/componentes/AppDrawer.tsx
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export type DrawerItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress?: () => void;
};

const DEFAULT_ITEMS: DrawerItem[] = [
  { key: 'painel', label: 'Painel', icon: 'grid-outline', active: true },
  { key: 'pacientes', label: 'Pacientes', icon: 'people-outline' },
  { key: 'agenda', label: 'Agenda', icon: 'calendar-outline' },
  { key: 'servicos', label: 'Serviços', icon: 'medkit-outline' },
  { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  items?: DrawerItem[];
  clinic?: { name: string; unit: string };
  professional?: { initials: string; name: string; role: string };
  onLogout?: () => void;
};

export default function AppDrawer({
  visible,
  onClose,
  items = DEFAULT_ITEMS,
  clinic = { name: 'Clínica Psi', unit: 'Unidade Pinheiros' },
  professional = { initials: 'AS', name: 'Ana Souza', role: 'Psicóloga · CRP 06/123456' },
  onLogout,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidthRef = useRef(Math.min(270, Math.round(width * 0.72)));
  panelWidthRef.current = Math.min(270, Math.round(width * 0.72));

  const translateX = useRef(new Animated.Value(-panelWidthRef.current)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    const pWidth = panelWidthRef.current;
    if (visible) {
      setMounted(true);
      translateX.setValue(-pWidth);
      fade.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -pWidth, duration: 220, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible, fade, translateX]);

  if (!mounted) return null;

  const activeItem = items.find((i) => i.active)?.key ?? items[0]?.key;

  return (
    <Modal
      visible
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: fade }]} accessibilityViewIsModal>
        {/* Área fora do painel que fecha ao tocar */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Fechar menu"
        />

        <Animated.View
          style={[
            styles.panel,
            {
              width: panelWidthRef.current,
              maxWidth: panelWidthRef.current,
              paddingBottom: Math.max(18, insets.bottom + 12),
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Marca */}
          <View style={styles.brandRow}>
            <View style={styles.logo} accessibilityLabel="Clínica Psi">
              <Text style={styles.logoText}>CP</Text>
            </View>
            <View>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicUnit}>{clinic.unit}</Text>
            </View>
          </View>

          {/* Itens */}
          <View style={styles.items}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.item, item.key === activeItem && styles.itemActive]}
                onPress={() => {
                  item.onPress?.();
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: item.key === activeItem }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.key === activeItem ? '#FFFFFF' : '#CBD5E1'}
                  style={styles.itemIcon}
                />
                <Text style={[styles.itemLabel, item.key === activeItem && styles.itemLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Rodapé com perfil / Sair */}
          <TouchableOpacity
            style={styles.footer}
            onPress={() => {
              if (onLogout) {
                onClose();
                onLogout();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Perfil e Sair"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{professional.initials}</Text>
            </View>
            <View style={styles.footerMeta}>
              <Text style={styles.footerName}>{professional.name}</Text>
              <Text style={styles.footerRole}>{professional.role}</Text>
            </View>
            <Text style={styles.footerArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  panel: {
    flex: 1,
    maxWidth: 270,
    width: '72%',
    backgroundColor: '#0F172A',
    paddingTop: 40,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  clinicName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  clinicUnit: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  items: { flex: 1, gap: 4 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemActive: { backgroundColor: '#4F46E5' },
  itemIcon: { width: 22, textAlign: 'center' },
  itemLabel: { fontSize: 15, color: '#CBD5E1', fontWeight: '500' },
  itemLabelActive: { color: '#FFFFFF', fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerMeta: { flex: 1 },
  footerName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  footerRole: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  footerArrow: { color: '#CBD5E1', fontSize: 18 },
});
