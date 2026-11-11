// src/componentes/AppMenu.tsx
// Menu lateral já ligado à sessão e à navegação: usado por todas as telas pós-login.
import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import AppDrawer, { type DrawerItem } from './AppDrawer';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useAppNav } from '../navigation/AppNav';
import { initials } from '../services/patientForm';

type Props = {
  visible: boolean;
  onClose: () => void;
  active: 'painel' | 'pacientes' | 'agenda' | 'servicos' | 'configuracoes';
};

export default function AppMenu({ visible, onClose, active }: Props) {
  const { user, clinic, logout } = useAuth();
  const sync = useSync();
  const nav = useAppNav();

  const items = useMemo<DrawerItem[]>(
    () => [
      { key: 'painel', label: 'Painel', icon: 'grid-outline', active: active === 'painel', onPress: () => nav.reset({ name: 'painel' }) },
      { key: 'pacientes', label: 'Pacientes', icon: 'people-outline', active: active === 'pacientes', onPress: () => nav.reset({ name: 'pacientes' }) },
      { key: 'agenda', label: 'Agenda', icon: 'calendar-outline', active: active === 'agenda', onPress: () => nav.reset({ name: 'agenda' }) },
      { key: 'servicos', label: 'Serviços', icon: 'medkit-outline', active: active === 'servicos', onPress: () => nav.reset({ name: 'servicos' }) },
      { key: 'configuracoes', label: 'Configurações', icon: 'settings-outline', active: active === 'configuracoes', onPress: () => nav.reset({ name: 'configuracoes' }) },
    ],
    [active, nav]
  );

  const handleLogout = useCallback(() => {
    const sair = () => {
      logout().catch((e) => console.warn('[menu] logout:', e));
    };
    if (sync.pending > 0) {
      Alert.alert(
        'Alterações não enviadas',
        `${sync.pending} alteração(ões) ainda não chegaram ao servidor. Se sair agora, elas serão perdidas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair mesmo assim', style: 'destructive', onPress: sair },
        ]
      );
    } else {
      sair();
    }
  }, [logout, sync.pending]);

  const roleLabel = user?.role === 'admin' ? 'Administrador(a)' : 'Psicólogo(a)';

  return (
    <AppDrawer
      visible={visible}
      onClose={onClose}
      items={items}
      onLogout={handleLogout}
      clinic={{ name: clinic?.name ?? 'Clínica Psi', unit: clinic?.unit ?? '', acronym: clinic?.acronym ?? undefined }}
      professional={{
        initials: initials(user?.name ?? '?'),
        name: user?.name ?? '',
        role: [roleLabel, user?.crp].filter(Boolean).join(' · '),
      }}
    />
  );
}
