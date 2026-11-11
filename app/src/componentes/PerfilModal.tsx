// src/componentes/PerfilModal.tsx
// Configurações → Perfil e acesso: nome, CRP e troca de senha (salvos na API).
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import FormField from './FormField';
import PasswordField from './PasswordField';
import SheetModal, { sheetStyles } from './SheetModal';
import type { ApiUser } from '../services/apiTypes';
import { maskCrp, maskName } from '../services/masks';

const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;

type Props = {
  visible: boolean;
  onClose: () => void;
  user: ApiUser | null;
  onSaveProfile: (input: { name?: string; crp?: string | null }) => Promise<void>;
  onChangePassword: (current: string, next: string) => Promise<void>;
};

export default function PerfilModal({ visible, onClose, user, onSaveProfile, onChangePassword }: Props) {
  const [nome, setNome] = useState('');
  const [crp, setCrp] = useState('');
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetir, setRepetir] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNome(user?.name ?? '');
    setCrp(user?.crp ?? '');
    setAtual('');
    setNova('');
    setRepetir('');
    setSaving(false);
    setError(null);
  }, [visible, user]);

  const salvar = async () => {
    if (!nome.trim()) return setError('Informe o nome.');
    if (crp.trim() && !CRP_REGEX.test(crp.trim())) return setError('CRP no formato CRP 06/00000, ex.: CRP 06/123456.');
    const trocarSenha = atual || nova || repetir;
    if (trocarSenha) {
      if (!atual) return setError('Informe a senha atual para trocar a senha.');
      if (nova.length < 6) return setError('A nova senha precisa de ao menos 6 caracteres.');
      if (nova !== repetir) return setError('As senhas novas não são iguais.');
    }
    setSaving(true);
    setError(null);
    try {
      if (nome.trim() !== user?.name || (crp.trim() || null) !== (user?.crp ?? null)) {
        await onSaveProfile({ name: nome.trim(), crp: crp.trim() || null });
      }
      if (trocarSenha) await onChangePassword(atual, nova);
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar.');
    }
  };

  return (
    <SheetModal
      visible={visible}
      title="Perfil e acesso"
      subtitle={user?.email ?? null}
      onClose={onClose}
      primaryLabel="Salvar"
      onPrimary={salvar}
      saving={saving}
      error={error}
    >
      <FormField id="perfil-nome" label="Nome completo" required value={nome} onChangeText={(t) => setNome(maskName(t))} maxLength={120} autoCapitalize="words" />
      <FormField id="perfil-crp" label="CRP" placeholder="CRP 06/00000" value={crp} onChangeText={(t) => setCrp(maskCrp(t))} keyboardType="number-pad" maxLength={20} />
      <Text style={sheetStyles.sectionTitle}>Trocar senha (opcional)</Text>
      <PasswordField id="perfil-senha-atual" label="Senha atual" value={atual} onChangeText={setAtual} autoCapitalize="none" />
      <PasswordField id="perfil-senha-nova" label="Nova senha (mínimo 6)" value={nova} onChangeText={setNova} autoCapitalize="none" />
      <PasswordField id="perfil-senha-repetir" label="Repetir a nova senha" value={repetir} onChangeText={setRepetir} autoCapitalize="none" />
    </SheetModal>
  );
}
