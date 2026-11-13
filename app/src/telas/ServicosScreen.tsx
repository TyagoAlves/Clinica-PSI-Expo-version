// src/telas/ServicosScreen.tsx
// Tela 9 (GUIA_13, Tyago) — catálogo de serviços da clínica.
// Visual do mock (cards com ícone, toggle verde, meta de duração/preço/pacientes e ⋮), agora com
// dados reais: catálogo salvo na API (Supabase), contagem de pacientes ativos por serviço,
// toggle que ativa/desativa de verdade e cadastro/edição/exclusão.
import { useMemo, useState } from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import ServicoModal from '../modais/ServicoModal';
import { apagarNoBanco, atualizarNoBanco, criarNoBanco, rotas, usePacientes, useServicos, type Servico } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useConexao } from '../conexao/ConexaoProvider';
import { formatPrice } from '../utils/format';
import type { ServiceFields } from '../api/tipos';

type Filtro = 'todos' | 'ativos' | 'inativos';

export default function ServicosScreen() {
  const { clinic } = useAuth();
  const conexao = useConexao();
  const { itens: servicos } = useServicos();
  const { itens: pacientes } = usePacientes();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [modal, setModal] = useState<{ open: boolean; item: Servico | null }>({ open: false, item: null });

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

  const toggle = async (s: Servico) => {
    await atualizarNoBanco(rotas.servico(s.id), { active: !s.active });
  };

  const salvar = async (f: ServiceFields) => {
    if (modal.item) await atualizarNoBanco(rotas.servico(modal.item.id), f);
    else await criarNoBanco(rotas.servicos(clinic!.id), f);
  };

  const excluir = async () => {
    if (!modal.item) return;
    await apagarNoBanco(rotas.servico(modal.item.id));
  };

  const acoesDoCard = (s: Servico) =>
    Alert.alert(s.name, undefined, [
      { text: 'Editar', onPress: () => setModal({ open: true, item: s }) },
      { text: s.active ? 'Desativar' : 'Ativar', onPress: () => toggle(s) },
      { text: 'Fechar', style: 'cancel' },
    ]);

  const maisAcoes = () =>
    Alert.alert('Serviços', undefined, [
      { text: 'Novo serviço', onPress: () => setModal({ open: true, item: null }) },
      { text: 'Atualizar agora', onPress: () => conexao.atualizarAgora() },
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
        <Text style={styles.title}>Serviços</Text>
        <Text style={styles.subtitle}>Crie, altere e desative tipos de atendimento</Text>
      </View>

      <Text style={styles.count}>
        {servicos.length} {servicos.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}
      </Text>

      <TouchableOpacity
        style={styles.newServiceBtn}
        onPress={() => setModal({ open: true, item: null })}
        accessibilityRole="button"
        accessibilityLabel="Novo serviço"
      >
        <Text style={styles.newServiceText}>+ Novo serviço</Text>
      </TouchableOpacity>

      <View style={styles.chips}>
        {chip('todos', 'Todos')}
        {chip('ativos', `Ativos (${ativos})`)}
        {chip('inativos', `Inativos (${inativos})`)}
      </View>

      <View style={styles.list}>
        {filtrados.map((s) => {
          const n = pacientesPorServico.get(s.name) ?? 0;
          return (
            <View key={s.id} style={styles.card}>
              {/* Faixa colorida à esquerda: indigo = ativo, cinza = inativo */}
              <View style={[styles.bar, !s.active && styles.barInactive]} />
              <View style={styles.cardBody}>
                <Text style={styles.serviceTitle}>{s.name}</Text>
                {s.description ? <Text style={styles.serviceDesc}>{s.description}</Text> : null}
                <View style={styles.cardMeta}>
                  <Text style={styles.duration}>{s.durationMin ? `${s.durationMin} min` : '—'}</Text>
                  {s.priceCents ? <Text style={styles.metaText}>{formatPrice(s.priceCents)}</Text> : null}
                  <Text style={styles.metaText}>
                    {n > 0 ? `${n} paciente${n > 1 ? 's' : ''}` : 'nenhum paciente'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardSide}>
                {/* Selo Ativo/Inativo: tocar ativa ou desativa o serviço */}
                <TouchableOpacity
                  onPress={() => toggle(s)}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: s.active }}
                  accessibilityLabel={`${s.active ? 'Desativar' : 'Ativar'} ${s.name}`}
                >
                  <Text style={[styles.badge, s.active ? styles.badgeActive : styles.badgeInactive]}>
                    {s.active ? 'Ativo' : 'Inativo'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => acoesDoCard(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mais ações de ${s.name}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.dots}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
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
    paddingTop: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  count: { fontSize: 12, color: colors.textMuted, marginTop: 20 },
  newServiceBtn: {
    alignSelf: 'flex-start',
    height: 40, borderRadius: 10, paddingHorizontal: 22, marginTop: 12,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...buttonShadow,
  },
  newServiceText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 16, paddingBottom: 12 },
  chip: {
    height: 32, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: '#C7D2FE', backgroundColor: colors.primarySoft },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  list: { gap: 14, paddingBottom: 24 },
  card: {
    ...card,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 12,
  },
  bar: { width: 6, borderRadius: 3, backgroundColor: colors.primary, marginVertical: 2, maxHeight: 50 },
  barInactive: { backgroundColor: '#94A3B8' },
  cardBody: { flex: 1, minWidth: 0 },
  serviceTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  serviceDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 14 },
  duration: { fontSize: 12, fontWeight: '800', color: colors.text },
  metaText: { fontSize: 12, color: colors.textMuted },
  cardSide: { alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  badge: {
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, overflow: 'hidden',
  },
  badgeActive: { backgroundColor: colors.successBg, borderColor: colors.successBorder, color: colors.success },
  badgeInactive: { backgroundColor: '#F1F5F9', borderColor: colors.border, color: colors.textMuted },
  dots: { padding: 4 },
  emptySearch: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
});
