// src/screens/PainelScreen.tsx
// Painel: lê os dados da API (Supabase) e mostra o estado da conexão.
import { useState, useMemo } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import NovoPacienteModal, { type NovoPacientePayload } from '../componentes/NovoPacienteModal';
import AppMenu from '../componentes/AppMenu';
import DatabaseDebugModal from '../componentes/DatabaseDebugModal';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useAppNav } from '../navigation/AppNav';
import { useCatalogs, useLocalList } from '../hooks/useClinicData';
import { initials, payloadToFields } from '../services/patientForm';
import { addMinutes, todayIso } from '../services/format';

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ULTIMOS = { limit: 5 };
const MAX_LISTA = 8;

export default function PainelScreen() {
  const { patientRepo, evolutionRepo, appointmentRepo } = useDatabase();
  const { clinic } = useAuth();
  const sync = useSync();
  const nav = useAppNav();
  const { services, professionals } = useCatalogs();
  const { items: pacientes } = useLocalList(patientRepo);
  const { items: ultimas } = useLocalList(evolutionRepo, ULTIMOS);
  const hoje = todayIso();
  const filtroHoje = useMemo(() => ({ range: { key: 'date', from: hoje, to: hoje } }), [hoje]);
  const { items: sessoesHoje } = useLocalList(appointmentRepo, filtroHoje);
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dbDebugOpen, setDbDebugOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const handlePacienteSalvo = async (p: NovoPacientePayload) => {
    // Grava direto na API (precisa de internet).
    await patientRepo.create(clinic!.id, payloadToFields(p));
    sync.requestSync();
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return pacientes;
    const digits = q.replace(/\D/g, '');
    return pacientes.filter(
      (p) => p.name.toLowerCase().includes(q) || (digits.length > 0 && (p.phone ?? '').replace(/\D/g, '').includes(digits))
    );
  }, [pacientes, busca]);

  const nomePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p.name])), [pacientes]);

  const porServico = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pacientes) {
      if (p.status !== 'Em tratamento') continue;
      const key = p.service || 'Sem serviço';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [pacientes]);

  const statusSync =
    sync.state === 'syncing'
      ? 'Atualizando…'
      : sync.pending > 0
        ? `${sync.pending} pendente(s)${sync.state === 'offline' ? ' · offline' : ''}`
        : sync.state === 'offline'
          ? 'Sem conexão com o servidor'
          : sync.state === 'error'
            ? 'Erro ao falar com o servidor'
            : sync.lastSyncAt
              ? `Atualizado às ${formatTime(sync.lastSyncAt)}`
              : 'Visão geral da clínica';

  return (
    <AppScreen>
      {/* Toolbar (☰ + busca + estado da sincronização) */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.search}
          placeholder="⌕ Buscar paciente pelo nome ou telefone…"
          placeholderTextColor={colors.placeholder}
          value={busca}
          onChangeText={setBusca}
          autoCorrect={false}
          accessibilityLabel="Buscar paciente"
        />
        <TouchableOpacity
          style={styles.dbBtn}
          onPress={() => setDbDebugOpen(true)}
          accessibilityLabel="Ver dados e conexão"
        >
          <Text style={styles.dbBtnText}>{sync.pending > 0 ? `⟳ ${sync.pending}` : '⟳'}</Text>
        </TouchableOpacity>
      </View>

      {/* Linha de título + ação */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Painel</Text>
          <Text
            style={[styles.subtitle, (sync.state === 'error' || sync.pending > 0) && styles.subtitleWarn]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {statusSync}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.newPatientBtn}
          onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo Paciente"
        >
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Hero ou lista de pacientes */}
      {pacientes.length === 0 ? (
        <EmptyHero onPress={() => setNovoPacienteOpen(true)} />
      ) : (
        <View style={styles.patientsListCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.patientsCardTitle}>
              Pacientes ({busca ? `${filtrados.length} de ${pacientes.length}` : pacientes.length})
            </Text>
            <TouchableOpacity onPress={() => nav.reset({ name: 'pacientes' })} accessibilityRole="button">
              <Text style={styles.link}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {filtrados.length === 0 ? (
            <Text style={styles.muted}>Nenhum paciente encontrado para “{busca}”.</Text>
          ) : null}
          {filtrados.slice(0, MAX_LISTA).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.patientRow}
              onPress={() => nav.navigate({ name: 'paciente', id: p.id })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${p.name}`}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>{initials(p.name)}</Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientNotes} numberOfLines={1}>
                  {[p.phone, p.service, p.status].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {p.dirty ? (
                <Text style={styles.pendingBadge} accessibilityLabel="Ainda não enviado ao servidor">
                  pendente
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
          {filtrados.length > MAX_LISTA ? (
            <Text style={styles.more}>+ {filtrados.length - MAX_LISTA} paciente(s) em “Ver todos”</Text>
          ) : null}
        </View>
      )}

      {/* Sessões de hoje */}
      <SectionCard title="Sessões de hoje" actionLabel="Abrir agenda" onActionPress={() => nav.reset({ name: 'agenda' })}>
        {sessoesHoje.filter((s) => s.status !== 'Cancelada').length === 0 ? (
          <Text style={styles.muted}>Nenhuma sessão agendada para hoje.</Text>
        ) : (
          sessoesHoje
            .filter((s) => s.status !== 'Cancelada')
            .map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.evoRow}
                onPress={() => nav.navigate({ name: 'paciente', id: s.patientId })}
                accessibilityRole="button"
              >
                <Text style={styles.evoTitle} numberOfLines={1}>
                  {s.time}–{addMinutes(s.time, s.durationMin)} · {nomePorId.get(s.patientId) ?? 'Paciente'}
                </Text>
                <Text style={styles.evoText} numberOfLines={1}>
                  {[s.service, s.status].filter(Boolean).join(' · ')}
                </Text>
              </TouchableOpacity>
            ))
        )}
      </SectionCard>

      {/* Últimos registros (evoluções mais recentes) */}
      <SectionCard title="Últimos registros">
        {ultimas.length === 0 ? (
          <Text style={styles.muted}>Nenhuma evolução registrada.</Text>
        ) : (
          ultimas.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.evoRow}
              onPress={() => nav.navigate({ name: 'paciente', id: e.patientId })}
              accessibilityRole="button"
            >
              <Text style={styles.evoTitle} numberOfLines={1}>
                {nomePorId.get(e.patientId) ?? 'Paciente'} · {e.sessionDate}
              </Text>
              <Text style={styles.evoText} numberOfLines={1}>
                {e.content}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>

      {/* Pacientes por serviço */}
      <SectionCard title="Pacientes por serviço">
        {porServico.length === 0 ? (
          <Text style={styles.muted}>Nenhum paciente por serviço ainda.</Text>
        ) : (
          porServico.map(([servico, n]) => (
            <View key={servico} style={styles.serviceRow}>
              <Text style={styles.serviceName}>{servico}</Text>
              <Text style={styles.serviceCount}>{n}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={handlePacienteSalvo}
        services={services}
        professionals={professionals}
      />
      <DatabaseDebugModal visible={dbDebugOpen} onClose={() => setDbDebugOpen(false)} />
      <AppMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} active="painel" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.text },
  search: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.text,
  },
  dbBtn: {
    minWidth: 42,
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbBtnText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subtitleWarn: { color: '#B45309' },
  newPatientBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  patientsListCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  patientsCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '700', color: colors.primary },
  more: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingTop: 8 },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  patientInfo: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 14, fontWeight: '600', color: colors.text },
  patientNotes: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pendingBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  evoRow: { alignSelf: 'stretch', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  evoTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
  evoText: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, alignSelf: 'stretch' },
  serviceName: { fontSize: 13, color: colors.text },
  serviceCount: { fontSize: 13, fontWeight: '700', color: colors.primary },
});
