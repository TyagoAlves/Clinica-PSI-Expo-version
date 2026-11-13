// src/telas/PainelScreen.tsx
// Painel: lê os dados da API (Supabase) e mostra o estado da conexão.
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { buttonShadow, card, colors } from '../theme';
import AppToolbar from '../componentes/AppToolbar';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import NovoPacienteModal, { type NovoPacientePayload } from '../modais/NovoPacienteModal';
import AppMenu from '../componentes/AppMenu';
import DatabaseDebugModal from '../modais/DatabaseDebugModal';
import { criarNoBanco, rotas, useDados, usePacientes, type Evolucao, type Sessao } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useConexao } from '../conexao/ConexaoProvider';
import { useAppNav } from '../navegacao/AppNav';
import { useCatalogs } from '../banco/catalogos';
import { initials, payloadToFields } from '../utils/patientForm';
import { addMinutes, todayIso } from '../utils/format';
import { maskPhone } from '../utils/masks';

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const ULTIMAS = 5;
const MAX_LISTA = 8;

export default function PainelScreen() {
  const { clinic } = useAuth();
  const conexao = useConexao();
  const nav = useAppNav();
  const { services, professionals } = useCatalogs();
  const { itens: pacientes } = usePacientes();
  const { itens: ultimas } = useDados<Evolucao>(rotas.ultimasEvolucoes(clinic!.id), ULTIMAS);
  const hoje = todayIso();
  const { itens: sessoesHoje } = useDados<Sessao>(rotas.sessoes(clinic!.id, { de: hoje, ate: hoje }));
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dbDebugOpen, setDbDebugOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const handlePacienteSalvo = async (p: NovoPacientePayload) => {
    // Grava direto na API (precisa de internet).
    await criarNoBanco(rotas.pacientes(clinic!.id), payloadToFields(p));
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

  const statusConexao =
    conexao.estado === 'atualizando'
      ? 'Atualizando…'
      : conexao.estado === 'sem-internet'
          ? 'Sem conexão com o servidor'
          : conexao.estado === 'erro'
            ? 'Erro ao falar com o servidor'
            : conexao.atualizadoEm
              ? `Atualizado às ${formatTime(conexao.atualizadoEm)}`
              : 'Visão geral da clínica';

  return (
    <AppScreen>
      {/* Toolbar (☰ + busca + ⟳ conexão/dados) */}
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        search={busca}
        onChangeSearch={setBusca}
        rightActionIcon="sync-outline"
        onRightActionPress={() => setDbDebugOpen(true)}
        rightActionLabel="Ver dados e conexão"
      />

      {/* Linha de título + ação */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Painel</Text>
          <Text
            style={[styles.subtitle, conexao.estado === 'erro' && styles.subtitleWarn]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {statusConexao}
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
            <TouchableOpacity style={styles.outlineBtn} onPress={() => nav.reset({ name: 'pacientes' })} accessibilityRole="button">
              <Text style={styles.outlineBtnText}>Ver todos</Text>
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
                  {[p.phone ? maskPhone(p.phone) : null, p.service, p.status].filter(Boolean).join(' · ')}
                </Text>
              </View>
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
  // Faixa branca do título (mock: "Painel / Visão geral da clínica" + botão)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subtitleWarn: { color: colors.warning },
  newPatientBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonShadow,
  },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  patientsListCard: { ...card, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, marginTop: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  patientsCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  outlineBtn: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  more: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: 10 },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  patientInfo: { flex: 1, minWidth: 0 },
  patientName: { fontSize: 15, fontWeight: '800', color: colors.text },
  patientNotes: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  evoRow: { alignSelf: 'stretch', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  evoTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  evoText: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  serviceName: { fontSize: 14, color: colors.text, fontWeight: '600' },
  serviceCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
