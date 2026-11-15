// src/telas/PainelScreen.tsx
// Painel: visão geral da clínica.
//   - Pacientes cadastrados (quantos) → Ver pacientes / + Novo paciente
//   - Sessões de hoje → Abrir agenda
//   - Sair da conta
import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { buttonShadow, card, colors } from '../theme';
import AppToolbar from '../componentes/AppToolbar';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import AppMenu from '../componentes/AppMenu';
import PacienteModal from '../modais/PacienteModal';
import { criarNoBanco, rotas, useDados, usePacientes, type Sessao } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { addMinutes, todayIso } from '../utils/format';
import type { PatientFields } from '../api/tipos';

export default function PainelScreen() {
  const { clinic, logout } = useAuth();
  const nav = useAppNav();
  const { itens: pacientes, carregado } = usePacientes();
  const hoje = todayIso();
  const { itens: sessoesHoje, carregado: sessoesCarregadas } = useDados<Sessao>(rotas.sessoes(clinic!.id, { de: hoje, ate: hoje }));
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const nomePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p.name])), [pacientes]);

  const salvarPaciente = async (campos: PatientFields) => {
    await criarNoBanco(rotas.pacientes(clinic!.id), campos);
  };

  return (
    <AppScreen>
      <AppToolbar onMenuPress={() => setMenuOpen(true)} />

      {/* Título */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Painel</Text>
        <Text style={styles.subtitle}>Visão geral da clínica</Text>
      </View>

      {/* Cartão de pacientes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pacientes cadastrados ({carregado ? pacientes.length : '…'})</Text>
        <Text style={styles.cardText}>Cadastre e acompanhe seus pacientes em um só lugar.</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => nav.reset({ name: 'pacientes' })}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>Ver pacientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.softBtn} onPress={() => setNovoPacienteOpen(true)} accessibilityRole="button">
          <Text style={styles.softBtnText}>+ Novo paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Sessões de hoje */}
      <SectionCard
        title={`Sessões de hoje (${sessoesCarregadas ? sessoesHoje.length : '…'})`}
        actionLabel="Abrir agenda"
        onActionPress={() => nav.reset({ name: 'agenda' })}
      >
        {sessoesHoje.length === 0 ? (
          <Text style={styles.muted}>Nenhuma sessão agendada para hoje.</Text>
        ) : (
          sessoesHoje.map((s) => (
            <View key={s.id} style={styles.sessaoRow}>
              <Text style={styles.sessaoTitle} numberOfLines={1}>
                {s.time}–{addMinutes(s.time, s.durationMin)} · {nomePorId.get(s.patientId) ?? 'Paciente'}
              </Text>
              {s.service ? <Text style={styles.sessaoText}>{s.service}</Text> : null}
            </View>
          ))
        )}
      </SectionCard>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()} accessibilityRole="button">
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>

      <PacienteModal visible={novoPacienteOpen} onClose={() => setNovoPacienteOpen(false)} onSave={salvarPaciente} />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} active="painel" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  // Faixa branca do título
  headerRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  card: { ...card, padding: 16, marginTop: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cardText: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 14, lineHeight: 19 },
  primaryBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonShadow,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  softBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  softBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },

  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  sessaoRow: { alignSelf: 'stretch', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  sessaoTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  sessaoText: { fontSize: 12, color: colors.textMuted, marginTop: 3 },

  logoutBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoutText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
