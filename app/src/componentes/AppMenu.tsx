// src/componentes/AppMenu.tsx
// Menu lateral já ligado à sessão e à navegação: usado por todas as telas pós-login.
import { useCallback, useMemo } from 'react';
import AppDrawer, { type DrawerItem } from './AppDrawer';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { initials } from '../utils/format';

type Props = {
  visible: boolean;
  onClose: () => void;
  active: 'painel' | 'pacientes' | 'agenda';
};

export default function AppMenu({ visible, onClose, active }: Props) {
  const { user, clinic, logout } = useAuth();
  const nav = useAppNav();

  const items = useMemo<DrawerItem[]>(
    () => [
      { key: 'painel', label: 'Painel', icon: 'grid-outline', active: active === 'painel', onPress: () => nav.reset({ name: 'painel' }) },
      { key: 'pacientes', label: 'Pacientes', icon: 'people-outline', active: active === 'pacientes', onPress: () => nav.reset({ name: 'pacientes' }) },
      { key: 'agenda', label: 'Agenda', icon: 'calendar-outline', active: active === 'agenda', onPress: () => nav.reset({ name: 'agenda' }) },
    ],
    [active, nav]
  );

  const handleLogout = useCallback(() => {
    logout().catch((e) => console.warn('[menu] logout:', e));
  }, [logout]);

  const roleLabel = user?.role === 'admin' ? 'Administrador(a)' : 'Psicólogo(a)';

  return (
    <AppDrawer
      visible={visible}
      onClose={onClose}
      items={items}
      onLogout={handleLogout}
      clinic={{ name: clinic?.name ?? 'Clínica Psi', unit: '', acronym: clinic?.acronym ?? undefined }}
      professional={{
        initials: initials(user?.name ?? '?'),
        name: user?.name ?? '',
        role: [roleLabel, user?.crp].filter(Boolean).join(' · '),
      }}
    />
  );
}
