// src/screens/AgendaScreen.tsx
// Tela 8 (GUIA_12, Tyago) — Agenda: sessões por dia.
// Visual do mock: toolbar com ⋮, faixa "Agenda / Sessões por dia", navegação ‹ Hoje · DD/MM/AAAA ›
// e o estado vazio ilustrado quando ainda não há pacientes. Com pacientes, lista as sessões do dia
// (lidas e gravadas direto na API / Supabase).
import { useMemo, useState } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import NovoPacienteModal, { type NovoPacientePayload } from '../componentes/NovoPacienteModal';
import SessaoModal from '../componentes/SessaoModal';
import { AgendaArt } from '../componentes/art/Ilustracoes';
import { useDatabase } from '../database/DatabaseProvider';
import type { LocalAppointment } from '../database/repositories/types';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useAppNav } from '../navigation/AppNav';
import { useCatalogs, useLocalList } from '../hooks/useClinicData';
import { payloadToFields } from '../services/patientForm';
import { addDaysIso, addMinutes, dayTitle, todayIso } from '../services/format';
import type { AppointmentFields } from '../services/apiTypes';

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Agendada: { bg: 'rgba(79, 70, 229, 0.10)', fg: colors.primary },
  Realizada: { bg: '#DCFCE7', fg: '#15803D' },
  Cancelada: { bg: '#F1F5F9', fg: colors.textMuted },
  Faltou: { bg: '#FEF3C7', fg: '#B45309' },
};

export default function AgendaScreen() {
  const { patientRepo, appointmentRepo } = useDatabase();
  const { clinic } = useAuth();
  const sync = useSync();
  const nav = useAppNav();
  const { serviceList, services, professionals } = useCatalogs();
  const { items: pacientes, loaded } = useLocalList(patientRepo);
  const [dia, setDia] = useState(todayIso());
  const filtroDia = useMemo(() => ({ range: { key: 'date', from: dia, to: dia } }), [dia]);
  const { items: sessoes } = useLocalList(appointmentRepo, filtroDia);
  const [busca, setBusca] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [sessaoModal, setSessaoModal] = useState<{ open: boolean; item: LocalAppointment | null }>({ open: false, item: null });

  const nomePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p.name])), [pacientes]);
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? sessoes.filter((s) => (nomePorId.get(s.patientId) ?? '').toLowerCase().includes(q)) : sessoes;
  }, [sessoes, busca, nomePorId]);

  const salvarPaciente = async (p: NovoPacientePayload) => {
    await patientRepo.create(clinic!.id, payloadToFields(p));
    sync.requestSync();
  };

  const salvarSessao = async (f: AppointmentFields) => {
    if (sessaoModal.item) await appointmentRepo.update(sessaoModal.item.id, f);
    else await appointmentRepo.create(clinic!.id, f);
    if (f.date !== dia) setDia(f.date); // mostra o dia onde a sessão foi parar
    sync.requestSync();
  };

  const excluirSessao = async () => {
    if (!sessaoModal.item) return;
    await appointmentRepo.softDelete(sessaoModal.item.id);
    sync.requestSync();
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
        {!semPacientes ? (
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => setSessaoModal({ open: true, item: null })}
            accessibilityRole="button"
            accessibilityLabel="Nova sessão"
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.newBtnText}>Nova sessão</Text>
          </TouchableOpacity>
        ) : null}
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
        <View style={styles.dayEmpty}>
          <Ionicons name="calendar-clear-outline" size={32} color={colors.placeholder} />
          <Text style={styles.dayEmptyText}>
            {busca ? `Nenhuma sessão de “${busca}” neste dia.` : 'Nenhuma sessão agendada neste dia.'}
          </Text>
          <TouchableOpacity style={styles.smallBtn} onPress={() => setSessaoModal({ open: true, item: null })} accessibilityRole="button">
            <Text style={styles.smallBtnText}>+ Agendar sessão</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {visiveis.map((s) => {
            const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.Agendada!;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessao, s.status === 'Cancelada' && { opacity: 0.6 }]}
                onPress={() => setSessaoModal({ open: true, item: s })}
                onLongPress={() => nav.navigate({ name: 'paciente', id: s.patientId })}
                accessibilityRole="button"
                accessibilityLabel={`Sessão às ${s.time} com ${nomePorId.get(s.patientId) ?? 'paciente'}`}
                accessibilityHint="Toque para editar; toque longo abre o paciente"
              >
                <View style={styles.hora}>
                  <Text style={styles.horaIni}>{s.time}</Text>
                  <Text style={styles.horaFim}>{addMinutes(s.time, s.durationMin)}</Text>
                </View>
                <View style={styles.sessaoInfo}>
                  <Text style={styles.sessaoNome} numberOfLines={1}>
                    {nomePorId.get(s.patientId) ?? 'Paciente removido'}
                  </Text>
                  <Text style={styles.sessaoMeta} numberOfLines={1}>
                    {[s.service, s.professional].filter(Boolean).join(' · ')}
                    {s.dirty ? ' · pendente' : ''}
                  </Text>
                </View>
                <Text style={[styles.badge, { backgroundColor: st.bg, color: st.fg }]}>{s.status}</Text>
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
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newBtn: {
    height: 40, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 12,
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dateBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dateText: { fontSize: 16, fontWeight: '800', color: colors.text },

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

  dayEmpty: {
    backgroundColor: colors.surface, borderRadius: 16, marginTop: 12, paddingVertical: 28,
    alignItems: 'center', gap: 10,
  },
  dayEmptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 16 },
  smallBtn: { height: 38, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center' },
  smallBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  list: { gap: 10, marginTop: 12, paddingBottom: 24 },
  sessao: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  hora: { width: 54, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border, paddingRight: 8 },
  horaIni: { fontSize: 15, fontWeight: '800', color: colors.text },
  horaFim: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sessaoInfo: { flex: 1, minWidth: 0 },
  sessaoNome: { fontSize: 15, fontWeight: '700', color: colors.text },
  sessaoMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
});
