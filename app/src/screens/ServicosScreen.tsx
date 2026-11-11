// src/screens/ServicosScreen.tsx
// Tela 9 (GUIA_13, Tyago) — catálogo de serviços da clínica.
// Visual do mock (cards com ícone, toggle verde, meta de duração/preço/pacientes e ⋮), agora com
// dados reais: catálogo salvo na API, contagem de pacientes ativos por serviço,
// toggle que ativa/desativa de verdade e cadastro/edição/exclusão.
import { useMemo, useState } from 'react';
import { Alert, Switch, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import ServicoModal from '../componentes/ServicoModal';
import { BrainIcon, ChatIcon, ClipboardIcon } from '../componentes/art/Ilustracoes';
import { useDatabase } from '../database/DatabaseProvider';
import type { LocalService } from '../database/repositories/types';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { useLocalList } from '../hooks/useClinicData';
import { formatPrice } from '../services/format';
import type { ServiceFields } from '../services/apiTypes';

type Filtro = 'todos' | 'ativos' | 'inativos';

/** Ícone do mock pelo nome; serviços novos alternam entre os três. */
function iconFor(name: string, index: number) {
  const n = name.toLowerCase();
  if (n.includes('psicoterap') || n.includes('terapia')) return BrainIcon;
  if (n.includes('avalia')) return ClipboardIcon;
  if (n.includes('acompanha') || n.includes('orienta')) return ChatIcon;
  return [BrainIcon, ClipboardIcon, ChatIcon][index % 3]!;
}

export default function ServicosScreen() {
  const { serviceRepo, patientRepo } = useDatabase();
  const { clinic } = useAuth();
  const sync = useSync();
  const { items: servicos } = useLocalList(serviceRepo);
  const { items: pacientes } = useLocalList(patientRepo);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [modal, setModal] = useState<{ open: boolean; item: LocalService | null }>({ open: false, item: null });

  const ativos = servicos.filter((s) => s.active).length;
  const inativos = servicos.length - ativos;

  /** Pacientes "Em tratamento" por nome de serviço. */
  const pacientesPorServico = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pacientes) if (p.status === 'Em tratamento' && p.service) m.set(p.service, (m.get(p.service) ?? 0) + 1);
    return m;
  }, [pacientes]);

  const termo = search.trim().toLowerCase();
  const filtrados = servicos.filter((s) => {
    const passaFiltro = filtro === 'todos' || (filtro === 'ativos' ? s.active : !s.active);
    const passaBusca = !termo || s.name.toLowerCase().includes(termo) || (s.description ?? '').toLowerCase().includes(termo);
    return passaFiltro && passaBusca;
  });

  const toggle = async (s: LocalService) => {
    await serviceRepo.update(s.id, { active: !s.active });
    sync.requestSync();
  };

  const salvar = async (f: ServiceFields) => {
    if (modal.item) await serviceRepo.update(modal.item.id, f);
    else await serviceRepo.create(clinic!.id, f);
    sync.requestSync();
  };

  const excluir = async () => {
    if (!modal.item) return;
    await serviceRepo.softDelete(modal.item.id);
    sync.requestSync();
  };

  const acoesDoCard = (s: LocalService) =>
    Alert.alert(s.name, undefined, [
      { text: 'Editar', onPress: () => setModal({ open: true, item: s }) },
      { text: s.active ? 'Desativar' : 'Ativar', onPress: () => toggle(s) },
      { text: 'Fechar', style: 'cancel' },
    ]);

  const maisAcoes = () =>
    Alert.alert('Serviços', undefined, [
      { text: 'Novo serviço', onPress: () => setModal({ open: true, item: null }) },
      { text: 'Atualizar agora', onPress: () => sync.syncNow() },
      { text: 'Fechar', style: 'cancel' },
    ]);

  const chip = (key: Filtro, label: string) => (
    <TouchableOpacity
      style={[styles.chip, filtro === key && styles.chipActive]}
      onPress={() => setFiltro(key)}
      accessibilityRole="button"
      accessibilityState={{ selected: filtro === key }}
    >
      <Text style={[styles.chipText, filtro === key && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <AppScreen>
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        search={search}
        onChangeSearch={setSearch}
        placeholder="Buscar..."
        rightActionIcon="ellipsis-vertical"
        onRightActionPress={maisAcoes}
        rightActionLabel="Mais ações"
      />

      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Serviços</Text>
          <Text style={styles.subtitle}>Gerencie os serviços oferecidos aos seus pacientes.</Text>
        </View>
        <TouchableOpacity
          style={styles.newServiceBtn}
          onPress={() => setModal({ open: true, item: null })}
          accessibilityRole="button"
          accessibilityLabel="Novo serviço"
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newServiceText}>Novo serviço</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>
        {servicos.length} {servicos.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}
      </Text>

      <View style={styles.chips}>
        {chip('todos', 'Todos')}
        {chip('ativos', `Ativos (${ativos})`)}
        {chip('inativos', `Inativos (${inativos})`)}
      </View>

      <View style={styles.list}>
        {filtrados.map((s, i) => {
          const Icon = iconFor(s.name, i);
          const n = pacientesPorServico.get(s.name) ?? 0;
          return (
            <View key={s.id} style={[styles.card, !s.active && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, !s.active && { opacity: 0.5 }]}>
                  <Icon />
                </View>
                <View style={styles.cardBody}>
                  <Text style={[styles.serviceTitle, !s.active && { color: colors.textMuted }]}>{s.name}</Text>
                  {s.description ? <Text style={styles.serviceDesc}>{s.description}</Text> : null}
                </View>
                <Switch
                  value={s.active}
                  onValueChange={() => toggle(s)}
                  trackColor={{ false: '#E2E8F0', true: '#22C55E' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E2E8F0"
                  accessibilityLabel={`${s.active ? 'Desativar' : 'Ativar'} ${s.name}`}
                />
              </View>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>{s.durationMin ? `${s.durationMin} min` : '—'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaDollar}>$</Text>
                  <Text style={styles.metaText}>{formatPrice(s.priceCents)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={15} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {n > 0 ? `${n} paciente${n > 1 ? 's' : ''} ativo${n > 1 ? 's' : ''}` : 'nenhum paciente'}
                  </Text>
                </View>
                <View style={styles.metaSpacer} />
                {s.dirty ? <Text style={styles.pending}>pendente</Text> : null}
                <TouchableOpacity
                  onPress={() => acoesDoCard(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mais ações de ${s.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {filtrados.length === 0 ? (
          <Text style={styles.emptySearch}>
            {servicos.length === 0
              ? 'Nenhum serviço cadastrado. Toque em “Novo serviço”.'
              : termo
                ? `Nenhum serviço para “${search.trim()}”.`
                : 'Nenhum serviço neste filtro.'}
          </Text>
        ) : null}
      </View>

      <AppMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} active="servicos" />
      <ServicoModal
        visible={modal.open}
        onClose={() => setModal({ open: false, item: null })}
        onSave={salvar}
        onDelete={excluir}
        service={modal.item}
        existingNames={servicos.map((s) => s.name)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
    gap: 12,
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  newServiceBtn: {
    height: 40, borderRadius: 10, paddingHorizontal: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  newServiceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  count: { fontSize: 13, color: colors.textMuted, marginTop: 12, marginBottom: 4 },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 8, paddingBottom: 12 },
  chip: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: 'rgba(79, 70, 229, 0.08)' },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary },
  list: { gap: 12, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    gap: 12,
  },
  cardInactive: { backgroundColor: '#FAFBFC' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  serviceTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  serviceDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 15 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: colors.textMuted },
  metaDollar: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  metaSpacer: { flex: 1 },
  pending: { fontSize: 10, fontWeight: '700', color: '#B45309' },
  emptySearch: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
});
