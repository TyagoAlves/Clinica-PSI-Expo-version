// src/screens/PacientesScreen.tsx
// Tela 7 (GUIA_11, Tyago) — Pacientes: busca por nome/telefone, filtro por situação, abre o detalhe.
// Layout do mock: AppToolbar, faixa "Pacientes / Cadastro e acompanhamento", chips, contador e EmptyHero.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import EmptyHero from '../componentes/EmptyHero';
import AppMenu from '../componentes/AppMenu';
import NovoPacienteModal, { type NovoPacientePayload } from '../componentes/NovoPacienteModal';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useAppNav } from '../navigation/AppNav';
import { useCatalogs, useLocalList } from '../hooks/useClinicData';
import { initials, payloadToFields } from '../services/patientForm';
import { PATIENT_STATUSES, type PatientStatus } from '../services/apiTypes';
import { maskPhone } from '../services/masks';

type Filtro = 'Todos' | PatientStatus;
const FILTROS: Filtro[] = ['Todos', ...PATIENT_STATUSES];

export default function PacientesScreen() {
  const { patientRepo } = useDatabase();
  const { clinic } = useAuth();
  const sync = useSync();
  const nav = useAppNav();
  const { services, professionals } = useCatalogs();
  const { items: pacientes, loaded } = useLocalList(patientRepo);
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
    await patientRepo.create(clinic!.id, payloadToFields(p));
    sync.requestSync();
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

      <View style={[styles.card, visiveis.length === 0 && { display: 'none' }]}>
        {visiveis.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.row}
            onPress={() => nav.navigate({ name: 'paciente', id: p.id })}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${p.name}`}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(p.name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {[p.phone ? maskPhone(p.phone) : null, p.service].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.status, p.status !== 'Em tratamento' && styles.statusMuted]}>{p.status}</Text>
              {p.dirty ? <Text style={styles.pending}>pendente</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
          </TouchableOpacity>
        ))}
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
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newBtn: { height: 40, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  newBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  counter: { fontSize: 13, color: colors.textMuted, marginTop: 10 },
  search: {
    height: 44,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  card: { backgroundColor: colors.surface, borderRadius: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 4 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  status: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  statusMuted: { color: colors.textMuted },
  pending: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
