// src/telas/PacientesScreen.tsx
// Tela 7 (GUIA_11, Tyago) — Pacientes: busca por nome/telefone, filtro por situação, abre o detalhe.
// Layout do mock: AppToolbar, faixa "Pacientes / Cadastro e acompanhamento", chips, contador e EmptyHero.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import EmptyHero from '../componentes/EmptyHero';
import AppMenu from '../componentes/AppMenu';
import NovoPacienteModal, { type NovoPacientePayload } from '../modais/NovoPacienteModal';
import { criarNoBanco, rotas, usePacientes } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { useCatalogs } from '../banco/catalogos';
import { initials, payloadToFields } from '../utils/patientForm';
import { PATIENT_STATUSES, type PatientStatus } from '../api/tipos';
import { maskPhone } from '../utils/masks';

type Filtro = 'Todos' | PatientStatus;
const FILTROS: Filtro[] = ['Todos', ...PATIENT_STATUSES];

/** Cores dos selos de situação (mock: verde "Em tratamento", amarelo "Pausado"). */
const STATUS_PILL: Record<string, { bg: string; border: string; fg: string }> = {
  'Em tratamento': { bg: colors.successBg, border: colors.successBorder, fg: colors.success },
  Pausado: { bg: colors.warningBg, border: colors.warningBorder, fg: colors.warning },
  Alta: { bg: '#F1F5F9', border: colors.border, fg: colors.textMuted },
};

/** Idade a partir de DD/MM/AAAA (null se não houver data). */
function ageFromBr(br: string | null | undefined): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br ?? '');
  if (!m) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - Number(m[3]);
  const mes = hoje.getMonth() + 1;
  if (mes < Number(m[2]) || (mes === Number(m[2]) && hoje.getDate() < Number(m[1]))) idade--;
  return idade >= 0 ? idade : null;
}

export default function PacientesScreen() {
  const { clinic } = useAuth();
  const nav = useAppNav();
  const { services, professionals } = useCatalogs();
  const { itens: pacientes, carregado: loaded } = usePacientes();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('Todos');
  const [menuOpen, setMenuOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return pacientes.filter((p) => {
      if (filtro !== 'Todos' && p.status !== filtro) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || (digits.length > 0 && (p.phone ?? '').replace(/\D/g, '').includes(digits));
    });
  }, [pacientes, busca, filtro]);

  const contagem = (f: Filtro) => (f === 'Todos' ? pacientes.length : pacientes.filter((p) => p.status === f).length);

  const salvarNovo = async (p: NovoPacientePayload) => {
    await criarNoBanco(rotas.pacientes(clinic!.id), payloadToFields(p));
  };

  return (
    <AppScreen>
      {/* Toolbar + faixa de título no padrão do GUIA_11 (Tela 7) */}
      <AppToolbar onMenuPress={() => setMenuOpen(true)} search={busca} onChangeSearch={setBusca} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pacientes</Text>
          <Text style={styles.subtitle}>Cadastro e acompanhamento</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setNovoOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo Paciente"
        >
          <Text style={styles.newBtnText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chips}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filtro === f && styles.chipActive]}
            onPress={() => setFiltro(f)}
            accessibilityRole="button"
            accessibilityState={{ selected: filtro === f }}
            accessibilityLabel={`Filtrar: ${f}`}
          >
            <Text style={[styles.chipText, filtro === f && styles.chipTextActive]}>
              {f} ({contagem(f)})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.counter}>{contagem('Em tratamento')} paciente(s) em tratamento</Text>

      {loaded && visiveis.length === 0 ? (
        <EmptyHero
          title="Nenhum paciente encontrado"
          subtitle="Ajuste a busca ou cadastre um novo paciente para acompanhar."
          buttonLabel="+ Novo paciente"
          onPress={() => setNovoOpen(true)}
        />
      ) : null}

      {/* Um cartão por paciente (mock 8): avatar, nome, telefone · idade, › e selos de serviço/situação */}
      <View style={styles.list}>
        {visiveis.map((p) => {
          const idade = ageFromBr(p.birthDate);
          const st = STATUS_PILL[p.status] ?? STATUS_PILL['Alta']!;
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => nav.navigate({ name: 'paciente', id: p.id })}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${p.name}`}
            >
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(p.name)}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[p.phone ? maskPhone(p.phone) : null, idade !== null ? `${idade} anos` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.pills}>
                {p.service ? (
                  <Text style={[styles.pill, styles.pillService]} numberOfLines={1}>
                    {p.service}
                  </Text>
                ) : null}
                <Text style={[styles.pill, { backgroundColor: st.bg, borderColor: st.border, color: st.fg }]}>{p.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <NovoPacienteModal
        visible={novoOpen}
        onClose={() => setNovoOpen(false)}
        onSaved={salvarNovo}
        services={services}
        professionals={professionals}
      />
      <AppMenu visible={menuOpen} onClose={() => setMenuOpen(false)} active="pacientes" />
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
    height: 40, paddingHorizontal: 18, borderRadius: 10, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', ...buttonShadow,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  counter: { fontSize: 12, color: colors.textMuted, marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: '#C7D2FE' },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { gap: 14, marginTop: 14, paddingBottom: 8 },
  card: { ...card, padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  pill: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 90,
    textAlign: 'center',
  },
  pillService: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft, color: colors.primary, minWidth: 120 },
});
