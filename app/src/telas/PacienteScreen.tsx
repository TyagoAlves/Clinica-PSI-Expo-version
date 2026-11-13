// src/telas/PacienteScreen.tsx
// Tela 8 — detalhe do paciente: dados cadastrais (editar/excluir) + prontuário (evoluções).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import TopBar from '../componentes/TopBar';
import NovoPacienteModal, { type NovoPacientePayload } from '../modais/NovoPacienteModal';
import EvolucaoModal, { type EvolucaoPayload } from '../modais/EvolucaoModal';
import {
  apagarNoBanco,
  atualizarNoBanco,
  buscarUm,
  criarNoBanco,
  ouvirMudancas,
  rotas,
  useDados,
  type Evolucao,
  type Paciente,
  type Sessao,
} from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { useCatalogs } from '../banco/catalogos';
import { fieldsToPayload, initials, payloadToFields } from '../utils/patientForm';
import SessaoModal from '../modais/SessaoModal';
import type { AppointmentFields } from '../api/tipos';
import { addMinutes, isoToBr, todayIso } from '../utils/format';
import { maskDocument, maskPhone } from '../utils/masks';


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
  const { clinic } = useAuth();
  const nav = useAppNav();
  const { services, serviceList, professionals } = useCatalogs();
  const [paciente, setPaciente] = useState<Paciente | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [evoModal, setEvoModal] = useState<{ open: boolean; evo: Evolucao | null }>({ open: false, evo: null });
  const [expandida, setExpandida] = useState<string | null>(null);
  const [aba, setAba] = useState<'evolucoes' | 'sessoes'>('evolucoes');
  const [dadosAbertos, setDadosAbertos] = useState(false);

  const { itens: sessoes } = useDados<Sessao>(rotas.sessoes(clinic!.id, { paciente: id }));
  const [sessaoModal, setSessaoModal] = useState<{ open: boolean; item: Sessao | null }>({ open: false, item: null });
  const hoje = todayIso();
  const proximas = sessoes.filter((s) => s.date >= hoje && s.status === 'Agendada').slice(0, 5);
  const realizadas = sessoes.filter((s) => s.status === 'Realizada').length;
  const { itens: evolucoes } = useDados<Evolucao>(rotas.evolucoesDoPaciente(id));

  const carregar = useCallback(async () => {
    const p = await buscarUm<Paciente>(rotas.paciente(id));
    setPaciente(p && !p.deletedAt ? p : null);
  }, [id]);

  useEffect(() => {
    carregar();
    return ouvirMudancas(carregar);
  }, [carregar]);

  const editInitial = useMemo(() => (paciente ? fieldsToPayload(paciente) : null), [paciente]);

  if (paciente === undefined) return <AppScreen>{null}</AppScreen>;

  const salvarSessao = async (f: AppointmentFields) => {
    if (sessaoModal.item) await atualizarNoBanco(rotas.sessao(sessaoModal.item.id), f);
    else await criarNoBanco(rotas.sessoes(clinic!.id), f);
  };
  const excluirSessao = async () => {
    if (!sessaoModal.item) return;
    await apagarNoBanco(rotas.sessao(sessaoModal.item.id));
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
    await atualizarNoBanco(rotas.paciente(id), payloadToFields(p, paciente.notes));
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
            for (const e of evolucoes) await apagarNoBanco(rotas.evolucao(e.id));
            await apagarNoBanco(rotas.paciente(id));
            nav.goBack();
          },
        },
      ]
    );
  };

  const salvarEvolucao = async (e: EvolucaoPayload) => {
    if (evoModal.evo) {
      await atualizarNoBanco(rotas.evolucao(evoModal.evo.id), e);
    } else {
      // A API registra o autor (usuário logado) sozinha.
      await criarNoBanco(rotas.evolucoesDoPaciente(id), e);
    }
  };

  const excluirEvolucao = async () => {
    if (!evoModal.evo) return;
    await apagarNoBanco(rotas.evolucao(evoModal.evo.id));
  };

  return (
    <AppScreen>
      <TopBar title="Paciente" left="back" onLeft={nav.goBack} />

      {/* Cabeçalho do paciente (mock 9): avatar, nome, serviço · início e selo de situação */}
      <View style={[styles.card, styles.headCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(paciente.name)}</Text>
        </View>
        <View style={styles.headInfo}>
          <Text style={styles.headName} numberOfLines={2}>
            {paciente.name}
          </Text>
          <Text style={styles.headMeta} numberOfLines={2}>
            {[paciente.service, paciente.treatmentStart ? `Início ${paciente.treatmentStart}` : null].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Text style={[styles.statusPill, STATUS_PILL[paciente.status] ?? STATUS_PILL.Alta]}>{paciente.status}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => (aba === 'evolucoes' ? setEvoModal({ open: true, evo: null }) : setSessaoModal({ open: true, item: null }))}
        accessibilityRole="button"
        accessibilityLabel={aba === 'evolucoes' ? 'Nova evolução' : 'Agendar sessão'}
      >
        <Text style={styles.primaryBtnText}>{aba === 'evolucoes' ? '+  Nova evolução' : '+  Agendar sessão'}</Text>
      </TouchableOpacity>

      {/* Abas Evoluções | Sessões */}
      <View style={styles.tabs}>
        {(
          [
            ['evolucoes', `Evoluções (${evolucoes.length})`],
            ['sessoes', 'Sessões'],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, aba === key && styles.tabActive]}
            onPress={() => setAba(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: aba === key }}
          >
            <Text style={[styles.tabText, aba === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {aba === 'evolucoes' ? (
        /* Prontuário */
        <View style={[styles.card, styles.listCard]}>
          {evolucoes.length === 0 ? <Text style={styles.muted}>Nenhuma evolução registrada.</Text> : null}
          {evolucoes.map((e, i) => {
            const aberta = expandida === e.id;
            return (
              <TouchableOpacity
                key={e.id}
                style={[styles.evo, i === evolucoes.length - 1 && styles.lastRow]}
                onPress={() => setExpandida(aberta ? null : e.id)}
                onLongPress={() => setEvoModal({ open: true, evo: e })}
                accessibilityRole="button"
                accessibilityLabel={`Evolução de ${e.sessionDate}`}
                accessibilityHint="Toque para expandir; toque longo para editar"
              >
                <View style={styles.evoBody}>
                  <Text style={styles.evoDate} numberOfLines={1}>
                    {e.sessionDate}
                    {e.authorName ? ` · ${e.authorName}` : ''}
                  </Text>
                  <Text style={styles.evoText} numberOfLines={aberta ? undefined : 3}>
                    {e.content}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEvoModal({ open: true, evo: e })} accessibilityLabel="Editar evolução" hitSlop={8}>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* Sessões (Agenda) */
        <View style={[styles.card, styles.listCard]}>
          <Text style={styles.listTitle}>Próximas sessões</Text>
          {proximas.length === 0 ? <Text style={styles.muted}>Nenhuma sessão agendada.</Text> : null}
          {proximas.map((s, i) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.evo, i === proximas.length - 1 && styles.lastRow]}
              onPress={() => setSessaoModal({ open: true, item: s })}
              accessibilityRole="button"
              accessibilityLabel={`Sessão em ${isoToBr(s.date)} às ${s.time}`}
            >
              <View style={styles.evoBody}>
                <Text style={styles.evoDate}>
                  {isoToBr(s.date)} · {s.time}–{addMinutes(s.time, s.durationMin)}
                </Text>
                <Text style={styles.evoMeta}>{[s.service, s.professional].filter(Boolean).join(' · ')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          {realizadas > 0 ? <Text style={styles.footNote}>{realizadas} sessão(ões) realizada(s)</Text> : null}
        </View>
      )}

      {/* Dados cadastrais (recolhível) */}
      <View style={[styles.card, styles.collapse]}>
        <TouchableOpacity
          style={styles.collapseHead}
          onPress={() => setDadosAbertos((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: dadosAbertos }}
          accessibilityLabel="Dados cadastrais"
        >
          <Text style={styles.collapseArrow}>{dadosAbertos ? '▾' : '▸'}</Text>
          <Text style={styles.collapseTitle}>Dados cadastrais</Text>
          <Text style={styles.collapseHint}>Telefone, e-mail</Text>
        </TouchableOpacity>
        {dadosAbertos ? (
          <View style={styles.collapseBody}>
            <Campo label="Telefone" value={paciente.phone ? maskPhone(paciente.phone) : null} />
            <Campo label="E-mail" value={paciente.email} />
            <Campo label="Nascimento" value={paciente.birthDate} />
            <Campo label="Documento" value={paciente.document ? maskDocument(paciente.document) : null} />
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
        ) : null}
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

const STATUS_PILL: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
  'Em tratamento': { backgroundColor: colors.successBg, borderColor: colors.successBorder, color: colors.success },
  Pausado: { backgroundColor: colors.warningBg, borderColor: colors.warningBorder, color: colors.warning },
  Alta: { backgroundColor: '#F1F5F9', borderColor: colors.border, color: colors.textMuted },
};

const styles = StyleSheet.create({
  removido: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  card: { ...card, marginTop: 16 },

  headCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 17 },
  headInfo: { flex: 1, minWidth: 0 },
  headName: { fontSize: 18, fontWeight: '800', color: colors.text },
  headMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  statusPill: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },

  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    ...buttonShadow,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  tabs: { flexDirection: 'row', marginTop: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  listCard: { paddingHorizontal: 16, paddingVertical: 6 },
  listTitle: { fontSize: 15, fontWeight: '800', color: colors.text, paddingTop: 12, paddingBottom: 4 },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  evo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  lastRow: { borderBottomWidth: 0 },
  evoBody: { flex: 1, minWidth: 0 },
  evoDate: { fontSize: 13, fontWeight: '700', color: colors.primary },
  evoMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  evoText: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 4 },
  footNote: { fontSize: 12, color: colors.textMuted, paddingVertical: 10 },

  collapse: { paddingHorizontal: 16 },
  collapseHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16 },
  collapseArrow: { fontSize: 12, color: colors.text },
  collapseTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  collapseHint: { fontSize: 11, color: colors.textMuted },
  collapseBody: { paddingBottom: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  campo: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  campoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  campoValue: { fontSize: 14, color: colors.text, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnOutline: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnOutlineText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  btnDanger: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDangerText: { color: colors.error, fontWeight: '700', fontSize: 14 },
});
