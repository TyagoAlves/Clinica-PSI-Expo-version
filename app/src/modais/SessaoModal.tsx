// src/modais/SessaoModal.tsx
// Agendar / editar sessão da Agenda: paciente, data, horário, duração, serviço, profissional, situação, observações.
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import FormField from '../componentes/FormField';
import SheetModal, { ChoiceChips, sheetStyles } from './SheetModal';
import type { Paciente, Servico, Sessao } from '../banco/bancoDados';
import { APPOINTMENT_STATUSES, type AppointmentFields, type AppointmentStatus } from '../api/tipos';
import { brToIso, isoToBr, TIME_HM } from '../utils/format';
import { maskDate, maskInteger, maskTime } from '../utils/masks';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (fields: AppointmentFields) => Promise<void>;
  onDelete?: () => Promise<void>;
  /** Sessão existente (edição) ou null (nova). */
  appointment: Sessao | null;
  /** Data pré-selecionada para sessão nova (AAAA-MM-DD). */
  defaultDate: string;
  /** Paciente pré-selecionado (ex.: abrindo a partir do detalhe do paciente). */
  defaultPatientId?: string | null;
  patients: Paciente[];
  services: Servico[];
  professionals: string[];
};

export default function SessaoModal({
  visible,
  onClose,
  onSave,
  onDelete,
  appointment,
  defaultDate,
  defaultPatientId,
  patients,
  services,
  professionals,
}: Props) {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const [duracao, setDuracao] = useState('50');
  const [servico, setServico] = useState<string | null>(null);
  const [profissional, setProfissional] = useState<string | null>(null);
  const [status, setStatus] = useState<AppointmentStatus>('Agendada');
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const a = appointment;
    const p = patients.find((x) => x.id === (a?.patientId ?? defaultPatientId));
    setPatientId(p?.id ?? null);
    setBusca('');
    setData(isoToBr(a?.date ?? defaultDate));
    setHora(a?.time ?? '');
    const svc = a?.service ?? p?.service ?? services[0]?.name ?? null;
    setServico(svc);
    setDuracao(String(a?.durationMin ?? services.find((s) => s.name === svc)?.durationMin ?? 50));
    setProfissional(a?.professional ?? p?.professional ?? professionals[0] ?? null);
    setStatus(a?.status ?? 'Agendada');
    setObs(a?.notes ?? '');
    setSaving(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, appointment]);

  const paciente = patients.find((p) => p.id === patientId) ?? null;
  const sugestoes = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const ativos = patients.filter((p) => p.status !== 'Alta');
    return (q ? ativos.filter((p) => p.name.toLowerCase().includes(q)) : ativos).slice(0, 6);
  }, [patients, busca]);

  const escolherServico = (nome: string) => {
    setServico(nome);
    const d = services.find((s) => s.name === nome)?.durationMin;
    if (d) setDuracao(String(d));
  };

  const salvar = async () => {
    if (!patientId) return setError('Selecione o paciente.');
    const iso = brToIso(data);
    if (!iso) return setError('Data no formato DD/MM/AAAA.');
    if (!TIME_HM.test(hora.trim())) return setError('Horário no formato HH:MM (ex.: 14:00).');
    const dur = Number(duracao);
    if (!Number.isInteger(dur) || dur < 5 || dur > 480) return setError('Duração entre 5 e 480 minutos.');
    setSaving(true);
    setError(null);
    try {
      await onSave({
        patientId,
        date: iso,
        time: hora.trim(),
        durationMin: dur,
        service: servico,
        professional: profissional,
        status,
        notes: obs.trim() || null,
      });
      onClose();
    } catch (e: any) {
      setSaving(false);
      setError(e?.message || 'Não foi possível salvar a sessão.');
    }
  };

  const excluir = () => {
    if (!onDelete) return;
    Alert.alert('Excluir sessão?', 'A sessão sai da agenda em todos os aparelhos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await onDelete();
          onClose();
        },
      },
    ]);
  };

  return (
    <SheetModal
      visible={visible}
      title={appointment ? 'Editar sessão' : 'Nova sessão'}
      subtitle={paciente?.name ?? null}
      onClose={onClose}
      primaryLabel={appointment ? 'Salvar sessão' : 'Agendar sessão'}
      onPrimary={salvar}
      saving={saving}
      error={error}
      onDelete={appointment && onDelete ? excluir : undefined}
      deleteLabel="Excluir sessão"
    >
      {/* Paciente */}
      <Text style={sheetStyles.label}>
        Paciente <Text style={{ color: colors.error }}>*</Text>
      </Text>
      {paciente ? (
        <View style={styles.selected}>
          <Text style={styles.selectedName}>{paciente.name}</Text>
          {!appointment ? (
            <TouchableOpacity onPress={() => setPatientId(null)} accessibilityRole="button" accessibilityLabel="Trocar paciente">
              <Text style={styles.link}>Trocar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={{ marginBottom: 12 }}>
          <TextInput
            style={styles.search}
            placeholder="Buscar paciente pelo nome…"
            placeholderTextColor={colors.placeholder}
            value={busca}
            onChangeText={setBusca}
            accessibilityLabel="Buscar paciente para a sessão"
          />
          {sugestoes.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.option}
              onPress={() => {
                setPatientId(p.id);
                if (p.service) escolherServico(p.service);
                if (p.professional) setProfissional(p.professional);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Selecionar ${p.name}`}
            >
              <Text style={styles.optionText}>{p.name}</Text>
              <Text style={styles.optionMeta}>{p.service ?? ''}</Text>
            </TouchableOpacity>
          ))}
          {sugestoes.length === 0 ? <Text style={styles.optionMeta}>Nenhum paciente encontrado.</Text> : null}
        </View>
      )}

      <View style={sheetStyles.row}>
        <View style={sheetStyles.col}>
          <FormField id="sessao-data" label="Data" required placeholder="DD/MM/AAAA" value={data} onChangeText={(t) => setData(maskDate(t))} maxLength={10} keyboardType="number-pad" />
        </View>
        <View style={sheetStyles.col}>
          <FormField id="sessao-hora" label="Horário" required placeholder="14:00" value={hora} onChangeText={(t) => setHora(maskTime(t))} maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>
      </View>
      <FormField id="sessao-duracao" label="Duração (min)" value={duracao} onChangeText={(t) => setDuracao(maskInteger(t))} keyboardType="number-pad" maxLength={3} />

      {services.length > 0 ? (
        <ChoiceChips label="Serviço" options={services.map((s) => s.name)} value={servico} onChange={escolherServico} />
      ) : null}
      {professionals.length > 1 ? (
        <ChoiceChips label="Profissional" options={professionals} value={profissional} onChange={setProfissional} />
      ) : null}
      {appointment ? <ChoiceChips label="Situação" options={APPOINTMENT_STATUSES} value={status} onChange={setStatus} /> : null}

      <Text style={sheetStyles.label}>Observações</Text>
      <TextInput
        style={sheetStyles.textarea}
        placeholder="Ex.: primeira consulta, trazer exames…"
        placeholderTextColor={colors.placeholder}
        value={obs}
        onChangeText={setObs}
        multiline
        textAlignVertical="top"
        maxLength={4000}
        accessibilityLabel="Observações da sessão"
      />
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selectedName: { fontSize: 15, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  search: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  optionMeta: { fontSize: 12, color: colors.textMuted },
});
