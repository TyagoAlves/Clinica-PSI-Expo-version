// src/modais/PacienteModal.tsx
// Formulário do paciente, usado para NOVO e para EDITAR:
// nome completo, serviço, início do tratamento e descrição / queixa principal.
import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { colors } from '../theme';
import FormField from '../componentes/FormField';
import SheetModal, { ChoiceChips, sheetStyles } from './SheetModal';
import type { Paciente } from '../banco/bancoDados';
import type { PatientFields } from '../api/tipos';
import { hojeBr, SERVICOS } from '../utils/format';
import { isRealDate, maskDate, maskName } from '../utils/masks';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Grava no banco. Se der erro, o formulário mostra a mensagem e continua aberto. */
  onSave: (fields: PatientFields) => Promise<void>;
  /** Paciente existente (editar) ou null (novo). */
  paciente?: Paciente | null;
};

export default function PacienteModal({ visible, onClose, onSave, paciente = null }: Props) {
  const [nome, setNome] = useState('');
  const [servico, setServico] = useState<string>(SERVICOS[0]!);
  const [inicio, setInicio] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toda vez que o formulário abre, preenche com os dados do paciente (ou em branco).
  useEffect(() => {
    if (!visible) return;
    setNome(paciente?.name ?? '');
    setServico(paciente?.service ?? SERVICOS[0]!);
    setInicio(paciente?.treatmentStart ?? hojeBr());
    setDescricao(paciente?.complaint ?? '');
    setSaving(false);
    setError(null);
  }, [visible, paciente]);

  const salvar = async () => {
    if (nome.trim().length < 2) return setError('Informe o nome completo.');
    if (inicio && !isRealDate(inicio)) return setError('Início do tratamento no formato DD/MM/AAAA.');
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: nome.trim(),
        service: servico,
        treatmentStart: inicio || null,
        complaint: descricao.trim() || null,
      });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar o paciente.');
    }
  };

  return (
    <SheetModal
      visible={visible}
      title={paciente ? 'Editar paciente' : 'Novo paciente'}
      subtitle={paciente ? paciente.name : 'Preencha os dados do paciente'}
      onClose={onClose}
      primaryLabel={paciente ? 'Salvar alterações' : 'Salvar paciente'}
      onPrimary={salvar}
      saving={saving}
      error={error}
    >
      <FormField
        id="paciente-nome"
        label="Nome completo"
        required
        placeholder="Como o paciente deve aparecer no sistema"
        value={nome}
        onChangeText={(t) => setNome(maskName(t))}
        maxLength={120}
        autoCapitalize="words"
      />

      <ChoiceChips label="Serviço" options={SERVICOS} value={servico} onChange={setServico} />

      <FormField
        id="paciente-inicio"
        label="Início do tratamento"
        placeholder="DD/MM/AAAA"
        value={inicio}
        onChangeText={(t) => setInicio(maskDate(t))}
        maxLength={10}
        keyboardType="number-pad"
      />

      <Text style={sheetStyles.label}>Descrição / queixa principal</Text>
      <TextInput
        style={sheetStyles.textarea}
        placeholder="O que trouxe o paciente até o atendimento?"
        placeholderTextColor={colors.placeholder}
        value={descricao}
        onChangeText={setDescricao}
        multiline
        textAlignVertical="top"
        maxLength={4000}
        accessibilityLabel="Descrição ou queixa principal"
      />
    </SheetModal>
  );
}
