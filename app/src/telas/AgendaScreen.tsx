// src/telas/AgendaScreen.tsx
// Tela 8 (GUIA_12, Tyago) — Agenda: sessões por dia.
// Visual do mock: toolbar com ⋮, faixa "Agenda / Sessões por dia", navegação ‹ Hoje · DD/MM/AAAA ›
// e o estado vazio ilustrado quando ainda não há pacientes. Com pacientes, lista as sessões do dia
// (lidas e gravadas direto na API / Supabase).
import { useMemo, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import NovoPacienteModal, { type NovoPacientePayload } from '../modais/NovoPacienteModal';
import SessaoModal from '../modais/SessaoModal';
import { AgendaArt } from '../componentes/art/Ilustracoes';
import { apagarNoBanco, atualizarNoBanco, criarNoBanco, rotas, useDados, usePacientes, type Sessao } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { useCatalogs } from '../banco/catalogos';
import { payloadToFields } from '../utils/patientForm';
import { addDaysIso, addMinutes, dayTitle, todayIso } from '../utils/format';
import type { AppointmentFields } from '../api/tipos';

const STATUS_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  Agendada: { bg: colors.primarySoft, fg: colors.primary, border: '#C7D2FE' },
  Realizada: { bg: colors.successBg, fg: colors.success, border: colors.successBorder },
  Cancelada: { bg: '#F1F5F9', fg: colors.textMuted, border: colors.border },
  Faltou: { bg: colors.warningBg, fg: colors.warning, border: colors.warningBorder },
};

export default function AgendaScreen() {
  const { clinic } = useAuth();
  const nav = useAppNav();
  const { serviceList, services, professionals } = useCatalogs();
  const { itens: pacientes, carregado: loaded } = usePacientes();
  const [dia, setDia] = useState(todayIso());
  const { itens: sessoes } = useDados<Sessao>(rotas.sessoes(clinic!.id, { de: dia, ate: dia }));
  const [busca, setBusca] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [sessaoModal, setSessaoModal] = useState<{ open: boolean; item: Sessao | null }>({ open: false, item: null });

  const nomePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p.name])), [pacientes]);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? sessoes.filter((s) => (nomePorId.get(s.patientId) ?? '').toLowerCase().includes(q)) : sessoes;
  }, [sessoes, busca, nomePorId]);

  const salvarPaciente = async (p: NovoPacientePayload) => {
    await criarNoBanco(rotas.pacientes(clinic!.id), payloadToFields(p));
  };

  const salvarSessao = async (f: AppointmentFields) => {
    if (sessaoModal.item) await atualizarNoBanco(rotas.sessao(sessaoModal.item.id), f);
    else await criarNoBanco(rotas.sessoes(clinic!.id), f);
    if (f.date !== dia) setDia(f.date); // mostra o dia onde a sessão foi parar
  };

  const excluirSessao = async () => {
    if (!sessaoModal.item) return;
    await apagarNoBanco(rotas.sessao(sessaoModal.item.id));
  };

  const maisAcoes = () =>
    Alert.alert('Agenda', undefined, [
      { text: 'Ir para hoje', onPress: () => setDia(todayIso()) },
      ...(pacientes.length > 0 ? [{ text: 'Nova sessão', onPress: () => setSessaoModal({ open: true, item: null }) }] : []),
      { text: 'Fechar', style: 'cancel' as const },
    ]);

  const semPacientes = loaded && pacientes.length === 0;

  return (
    <AppScreen>
      {/* Barra superior — com o botão ⋮ exatamente como o mock v2 */}
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        search={busca}
        onChangeSearch={setBusca}
        searchDisabled={semPacientes}
        rightActionIcon="ellipsis-vertical"
        onRightActionPress={maisAcoes}
        rightActionLabel="Mais ações"
      />

      {/* Linha de título */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>Sessões por dia</Text>
        </View>
      </View>

      {/* Navegação de data (‹ Hoje · 08/11/2026 ›) */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setDia((d) => addDaysIso(d, -1))} accessibilityRole="button" accessibilityLabel="Dia anterior">
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDia(todayIso())} accessibilityRole="button" accessibilityLabel="Voltar para hoje">
          <Text style={styles.dateText}>{dayTitle(dia)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setDia((d) => addDaysIso(d, 1))} accessibilityRole="button" accessibilityLabel="Próximo dia">
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Botão largo "+ Nova sessão" (mock 10) */}
      {!semPacientes ? (
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setSessaoModal({ open: true, item: null })}
          accessibilityRole="button"
          accessibilityLabel="Nova sessão"
        >
          <Text style={styles.newBtnText}>+  Nova sessão</Text>
        </TouchableOpacity>
      ) : null}

      {semPacientes ? (
        /* Estado vazio do mock (sem pacientes) */
        <View style={styles.emptyCard}>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <AgendaArt />
          </View>
          <Text style={styles.emptyTitle}>Nenhum paciente cadastrado</Text>
          <Text style={styles.emptySubtitle}>
            Cadastre seu primeiro paciente e comece a agendar sessões, acompanhar evoluções e organizar documentos em um único lugar.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => setNovoPacienteOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar primeiro paciente"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.ctaText}>Cadastrar primeiro paciente</Text>
          </TouchableOpacity>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEPOIS DISSO, VOCÊ PODERÁ</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.capsRow}>
            {[
              ['calendar-outline', 'Agendar\nsessões'],
              ['document-text-outline', 'Registrar\nevoluções'],
              ['folder-open-outline', 'Armazenar\ndocumentos'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.capItem}>
                <View style={styles.capCircle}>
                  <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.primary} />
                </View>
                <Text style={styles.capText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : visiveis.length === 0 ? (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>{dia === todayIso() ? 'Sessões de hoje' : 'Sessões do dia'} · 0</Text>
          <View style={styles.dayEmpty}>
            <Ionicons name="calendar-clear-outline" size={30} color={colors.placeholder} />
            <Text style={styles.dayEmptyText}>
              {busca ? `Nenhuma sessão de “${busca}” neste dia.` : 'Nenhuma sessão agendada neste dia.'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.listCard}>
          <Text style={styles.listTitle}>
            {dia === todayIso() ? 'Sessões de hoje' : 'Sessões do dia'} · {visiveis.length}
          </Text>
          {visiveis.map((s, i) => {
            const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.Agendada!;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessao, i === 0 && styles.sessaoFirst, s.status === 'Cancelada' && { opacity: 0.6 }]}
                onPress={() => setSessaoModal({ open: true, item: s })}
                onLongPress={() => nav.navigate({ name: 'paciente', id: s.patientId })}
                accessibilityRole="button"
                accessibilityLabel={`Sessão às ${s.time} com ${nomePorId.get(s.patientId) ?? 'paciente'}`}
                accessibilityHint="Toque para editar; toque longo abre o paciente"
              >
                <View style={styles.hora}>
                  <Text style={styles.horaIni}>{s.time}</Text>
                  <Text style={styles.horaFim}>até {addMinutes(s.time, s.durationMin)}</Text>
                </View>
                <View style={styles.sessaoInfo}>
                  <Text style={styles.sessaoNome} numberOfLines={1}>
                    {nomePorId.get(s.patientId) ?? 'Paciente removido'}
                  </Text>
                  <Text style={styles.sessaoMeta} numberOfLines={1}>
                    {[s.service, s.professional].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Text style={[styles.badge, { backgroundColor: st.bg, color: st.fg, borderColor: st.border }]}>{s.status}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <AppMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} active="agenda" />
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={salvarPaciente}
        services={services}
        professionals={professionals}
      />
      <SessaoModal
        visible={sessaoModal.open}
        onClose={() => setSessaoModal({ open: false, item: null })}
        onSave={salvarSessao}
        onDelete={excluirSessao}
        appointment={sessaoModal.item}
        defaultDate={dia}
        patients={pacientes}
        services={serviceList}
        professionals={professionals}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    paddingTop: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  newBtn: {
    height: 48, borderRadius: 12, backgroundColor: colors.primary, marginTop: 16,
    alignItems: 'center', justifyContent: 'center', ...buttonShadow,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  dateNav: {
    ...card,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 16,
  },
  dateBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 15, fontWeight: '800', color: colors.text },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16, marginTop: 12,
    paddingTop: 20, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptySubtitle: {
    fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center',
    marginTop: 8, marginBottom: 16, paddingHorizontal: 8,
  },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 10, height: 48, width: '100%',
    shadowColor: colors.primary, shadowOpacity: 0.38, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  dividerLine: { width: 46, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, color: colors.textMuted },
  capsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 14 },
  capItem: { alignItems: 'center', width: 96 },
  capCircle: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(79, 70, 229, 0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  capText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },

  dayEmpty: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  dayEmptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 16 },

  listCard: { ...card, marginTop: 16, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6, marginBottom: 24 },
  listTitle: { fontSize: 15, fontWeight: '800', color: colors.text, paddingBottom: 12 },
  sessao: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  sessaoFirst: { borderTopColor: colors.border },
  hora: { width: 56 },
  horaIni: { fontSize: 20, fontWeight: '800', color: colors.text },
  horaFim: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  sessaoInfo: { flex: 1, minWidth: 0 },
  sessaoNome: { fontSize: 15, fontWeight: '800', color: colors.text },
  sessaoMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  badge: {
    fontSize: 11, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, overflow: 'hidden',
  },
});
