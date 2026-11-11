// src/screens/PacienteScreen.tsx
// Tela 8 — detalhe do paciente: dados cadastrais (editar/excluir) + prontuário (evoluções).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import TopBar from '../componentes/TopBar';
import NovoPacienteModal, { type NovoPacientePayload } from '../componentes/NovoPacienteModal';
import EvolucaoModal, { type EvolucaoPayload } from '../componentes/EvolucaoModal';
import { useDatabase } from '../database/DatabaseProvider';
import type { LocalEvolution, LocalPatient } from '../database/repositories/types';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useAppNav } from '../navigation/AppNav';
import { useCatalogs, useLocalList } from '../hooks/useClinicData';
import { fieldsToPayload, payloadToFields } from '../services/patientForm';
import SessaoModal from '../componentes/SessaoModal';
import type { LocalAppointment } from '../database/repositories/types';
import type { AppointmentFields } from '../services/apiTypes';
import { addMinutes, isoToBr, todayIso } from '../services/format';

const STATUS_COLOR: Record<string, string> = { 'Em tratamento': '#15803D', Pausado: '#B45309', Alta: colors.textMuted };

function Campo({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValue}>{value}</Text>
    </View>
  );
}

export default function PacienteScreen({ id }: { id: string }) {
  const { patientRepo, evolutionRepo, appointmentRepo } = useDatabase();
  const { clinic, user } = useAuth();
  const sync = useSync();
  const nav = useAppNav();
  const { services, serviceList, professionals } = useCatalogs();
  const [paciente, setPaciente] = useState<LocalPatient | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [evoModal, setEvoModal] = useState<{ open: boolean; evo: LocalEvolution | null }>({ open: false, evo: null });
  const [expandida, setExpandida] = useState<string | null>(null);

  const filtroEvo = useMemo(() => ({ where: { patientId: id } }), [id]);
  const { items: sessoes } = useLocalList(appointmentRepo, filtroEvo);
  const [sessaoModal, setSessaoModal] = useState<{ open: boolean; item: LocalAppointment | null }>({ open: false, item: null });
  const hoje = todayIso();
  const proximas = sessoes.filter((s) => s.date >= hoje && s.status === 'Agendada').slice(0, 5);
  const realizadas = sessoes.filter((s) => s.status === 'Realizada').length;
  const { items: evolucoes } = useLocalList(evolutionRepo, filtroEvo);

  const carregar = useCallback(async () => {
    const p = await patientRepo.findById(id);
    setPaciente(p && !p.deletedAt ? p : null);
  }, [patientRepo, id]);

  useEffect(() => {
    carregar();
    return patientRepo.subscribe(carregar);
  }, [carregar, patientRepo]);

  const editInitial = useMemo(() => (paciente ? fieldsToPayload(paciente) : null), [paciente]);

  if (paciente === undefined) return <AppScreen>{null}</AppScreen>;

  const salvarSessao = async (f: AppointmentFields) => {
    if (sessaoModal.item) await appointmentRepo.update(sessaoModal.item.id, f);
    else await appointmentRepo.create(clinic!.id, f);
    sync.requestSync();
  };
  const excluirSessao = async () => {
    if (!sessaoModal.item) return;
    await appointmentRepo.softDelete(sessaoModal.item.id);
    sync.requestSync();
  };
  if (paciente === null) {
    return (
      <AppScreen>
        <TopBar title="Paciente" left="back" onLeft={nav.goBack} />
        <Text style={styles.removido}>Este paciente foi removido.</Text>
      </AppScreen>
    );
  }

  const salvarEdicao = async (p: NovoPacientePayload) => {
    await patientRepo.update(id, payloadToFields(p, paciente.notes));
    sync.requestSync();
  };

  const excluirPaciente = () => {
    Alert.alert(
      'Excluir paciente?',
      `${paciente.name} e o prontuário dele deixam de aparecer em todos os aparelhos da clínica.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            for (const e of evolucoes) await evolutionRepo.softDelete(e.id);
            await patientRepo.softDelete(id);
            sync.requestSync();
            nav.goBack();
          },
        },
      ]
    );
  };

  const salvarEvolucao = async (e: EvolucaoPayload) => {
    if (evoModal.evo) {
      await evolutionRepo.update(evoModal.evo.id, e);
    } else {
      await evolutionRepo.create(clinic!.id, {
        ...e,
        patientId: id,
        authorId: user?.id ?? null,
        authorName: user?.name ?? null,
      });
    }
    sync.requestSync();
  };

  const excluirEvolucao = async () => {
    if (!evoModal.evo) return;
    await evolutionRepo.softDelete(evoModal.evo.id);
    sync.requestSync();
  };

  return (
    <AppScreen>
      <TopBar title={paciente.name} subtitle={paciente.service} left="back" onLeft={nav.goBack} />

      {/* Dados cadastrais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Dados do paciente</Text>
          <Text style={[styles.status, { color: STATUS_COLOR[paciente.status] }]}>{paciente.status}</Text>
        </View>
        {paciente.dirty ? <Text style={styles.pending}>Alterações ainda não enviadas ao servidor</Text> : null}
        <Campo label="Telefone" value={paciente.phone} />
        <Campo label="E-mail" value={paciente.email} />
        <Campo label="Nascimento" value={paciente.birthDate} />
        <Campo label="Documento" value={paciente.document} />
        <Campo label="Serviço" value={paciente.service} />
        <Campo label="Início do tratamento" value={paciente.treatmentStart} />
        <Campo label="Profissional responsável" value={paciente.professional} />
        <Campo label="Endereço" value={paciente.address} />
        <Campo label="Responsável" value={paciente.guardian} />
        <Campo label="Descrição / queixa principal" value={paciente.complaint} />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => setEditOpen(true)} accessibilityRole="button" accessibilityLabel="Editar paciente">
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.btnOutlineText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDanger} onPress={excluirPaciente} accessibilityRole="button" accessibilityLabel="Excluir paciente">
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.btnDangerText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sessões (Agenda) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Próximas sessões</Text>
          <TouchableOpacity
            style={styles.btnSmall}
            onPress={() => setSessaoModal({ open: true, item: null })}
            accessibilityRole="button"
            accessibilityLabel="Agendar sessão"
          >
            <Text style={styles.btnSmallText}>+ Sessão</Text>
          </TouchableOpacity>
        </View>
        {proximas.length === 0 ? <Text style={styles.muted}>Nenhuma sessão agendada.</Text> : null}
        {proximas.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.campo}
            onPress={() => setSessaoModal({ open: true, item: s })}
            accessibilityRole="button"
            accessibilityLabel={`Sessão em ${isoToBr(s.date)} às ${s.time}`}
          >
            <Text style={styles.campoValue}>
              {isoToBr(s.date)} · {s.time}–{addMinutes(s.time, s.durationMin)}
            </Text>
            <Text style={styles.campoLabel}>{[s.service, s.professional].filter(Boolean).join(' · ')}</Text>
          </TouchableOpacity>
        ))}
        {realizadas > 0 ? <Text style={[styles.campoLabel, { marginTop: 8 }]}>{realizadas} sessão(ões) realizada(s)</Text> : null}
      </View>

      {/* Prontuário */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Prontuário ({evolucoes.length})</Text>
          <TouchableOpacity
            style={styles.btnSmall}
            onPress={() => setEvoModal({ open: true, evo: null })}
            accessibilityRole="button"
            accessibilityLabel="Nova evolução"
          >
            <Text style={styles.btnSmallText}>+ Evolução</Text>
          </TouchableOpacity>
        </View>
        {evolucoes.length === 0 ? <Text style={styles.muted}>Nenhuma evolução registrada.</Text> : null}
        {evolucoes.map((e) => {
          const aberta = expandida === e.id;
          return (
            <TouchableOpacity
              key={e.id}
              style={styles.evo}
              onPress={() => setExpandida(aberta ? null : e.id)}
              onLongPress={() => setEvoModal({ open: true, evo: e })}
              accessibilityRole="button"
              accessibilityLabel={`Evolução de ${e.sessionDate}`}
              accessibilityHint="Toque para expandir; toque longo para editar"
            >
              <View style={styles.evoHeader}>
                <Text style={styles.evoDate}>{e.sessionDate}</Text>
                <Text style={styles.evoAuthor} numberOfLines={1}>
                  {e.authorName ?? ''}
                  {e.dirty ? ' · pendente' : ''}
                </Text>
                <TouchableOpacity onPress={() => setEvoModal({ open: true, evo: e })} accessibilityLabel="Editar evolução" hitSlop={8}>
                  <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={styles.evoText} numberOfLines={aberta ? undefined : 3}>
                {e.content}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <NovoPacienteModal
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={salvarEdicao}
        initial={editOpen ? editInitial : null}
        services={services}
        professionals={professionals}
      />
      <SessaoModal
        visible={sessaoModal.open}
        onClose={() => setSessaoModal({ open: false, item: null })}
        onSave={salvarSessao}
        onDelete={excluirSessao}
        appointment={sessaoModal.item}
        defaultDate={hoje}
        defaultPatientId={id}
        patients={[paciente]}
        services={serviceList}
        professionals={professionals}
      />
      <EvolucaoModal
        visible={evoModal.open}
        onClose={() => setEvoModal({ open: false, evo: null })}
        onSave={salvarEvolucao}
        initial={evoModal.evo ? { sessionDate: evoModal.evo.sessionDate, content: evoModal.evo.content } : null}
        onDelete={evoModal.evo ? excluirEvolucao : undefined}
        patientName={paciente.name}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  removido: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  status: { fontSize: 12, fontWeight: '700' },
  pending: { fontSize: 11, color: '#B45309', marginBottom: 6 },
  campo: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  campoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  campoValue: { fontSize: 14, color: colors.text, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnOutline: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnOutlineText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  btnDanger: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDangerText: { color: colors.error, fontWeight: '700', fontSize: 13 },
  btnSmall: { height: 34, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center' },
  btnSmallText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  evo: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  evoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  evoDate: { fontSize: 13, fontWeight: '700', color: colors.primary },
  evoAuthor: { flex: 1, fontSize: 11, color: colors.textMuted },
  evoText: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
