// src/modais/ClinicaModal.tsx
// Configurações → Informações da clínica (mesmos campos do Cadastro passo 2). Salva na API.
import { useEffect, useState } from 'react';
import FormField from '../componentes/FormField';
import SheetModal, { sheetStyles } from './SheetModal';
import { View } from 'react-native';
import type { ApiClinic, NewClinicInput } from '../api/tipos';
import { isValidCpfCnpj, isValidPhone, maskAcronym, maskCpfCnpj, maskEmail, maskName, maskPhone } from '../utils/masks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = {
  visible: boolean;
  onClose: () => void;
  clinic: ApiClinic | null;
  onSave: (input: Partial<NewClinicInput>) => Promise<void>;
};

export default function ClinicaModal({ visible, onClose, clinic, onSave }: Props) {
  const [f, setF] = useState({ name: '', unit: '', technicalResponsible: '', cnpj: '', phone: '', email: '', address: '', acronym: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MASKS: Partial<Record<keyof typeof f, (v: string) => string>> = {
    acronym: maskAcronym,
    cnpj: maskCpfCnpj,
    phone: maskPhone,
    email: maskEmail,
    technicalResponsible: maskName,
  };
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: MASKS[k] ? MASKS[k]!(v) : v }));

  useEffect(() => {
    if (!visible || !clinic) return;
    setF({
      name: clinic.name,
      unit: clinic.unit ?? '',
      technicalResponsible: clinic.technicalResponsible ?? '',
      cnpj: maskCpfCnpj(clinic.cnpj ?? ''),
      phone: maskPhone(clinic.phone ?? ''),
      email: clinic.email ?? '',
      address: clinic.address ?? '',
      acronym: clinic.acronym ?? '',
    });
    setSaving(false);
    setError(null);
  }, [visible, clinic]);

  const salvar = async () => {
    if (!f.name.trim()) return setError('Informe o nome da clínica.');
    if (f.cnpj.trim() && !isValidCpfCnpj(f.cnpj)) return setError('CNPJ ou CPF inválido (confira os números).');
    if (f.phone.trim() && !isValidPhone(f.phone)) return setError('Telefone incompleto. Use DDD + número.');
    if (f.email.trim() && !EMAIL_REGEX.test(f.email.trim())) return setError('Informe um e-mail válido.');
    setSaving(true);
    setError(null);
    const n = (v: string) => v.trim() || null;
    try {
      await onSave({
        name: f.name.trim(),
        unit: n(f.unit),
        technicalResponsible: n(f.technicalResponsible),
        cnpj: n(f.cnpj),
        phone: n(f.phone),
        email: n(f.email),
        address: n(f.address),
        acronym: n(f.acronym),
      });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar.');
    }
  };

  return (
    <SheetModal
      visible={visible}
      title="Identidade da clínica"
      subtitle="Aparecem no cabeçalho das fichas e documentos"
      onClose={onClose}
      primaryLabel="Salvar"
      onPrimary={salvar}
      saving={saving}
      error={error}
    >
      <FormField id="cfg-clinica" label="Nome da clínica" required value={f.name} onChangeText={set('name')} maxLength={120} />
      <View style={sheetStyles.row}>
        <View style={sheetStyles.col}>
          <FormField id="cfg-unidade" label="Unidade" value={f.unit} onChangeText={set('unit')} maxLength={64} />
        </View>
        <View style={{ width: 90 }}>
          <FormField id="cfg-sigla" label="Sigla" value={f.acronym} onChangeText={set('acronym')} maxLength={3} autoCapitalize="characters" />
        </View>
      </View>
      <FormField id="cfg-resp" label="Responsável técnico" value={f.technicalResponsible} onChangeText={set('technicalResponsible')} maxLength={80} />
      <View style={sheetStyles.row}>
        <View style={sheetStyles.col}>
          <FormField id="cfg-cnpj" label="CNPJ / documento" value={f.cnpj} onChangeText={set('cnpj')} maxLength={18} />
        </View>
        <View style={sheetStyles.col}>
          <FormField id="cfg-tel" label="Telefone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="61 3000-0000" maxLength={20} />
        </View>
      </View>
      <FormField id="cfg-email" label="E-mail da clínica" value={f.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" maxLength={80} />
      <FormField id="cfg-endereco" label="Endereço" value={f.address} onChangeText={set('address')} maxLength={160} />
    </SheetModal>
  );
}
