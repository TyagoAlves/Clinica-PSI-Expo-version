// src/telas/PacientesScreen.tsx
// Pacientes: busca pelo nome, lista e "+ Novo paciente". Tocar num paciente abre a ficha.
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { buttonShadow, card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import EmptyHero from '../componentes/EmptyHero';
import AppMenu from '../componentes/AppMenu';
import PacienteModal from '../modais/PacienteModal';
import { criarNoBanco, rotas, usePacientes } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useAppNav } from '../navegacao/AppNav';
import { initials } from '../utils/format';
import type { PatientFields } from '../api/tipos';

export default function PacientesScreen() {
  const { clinic } = useAuth();
  const nav = useAppNav();
  const { itens: pacientes, carregado } = usePacientes();
  const [busca, setBusca] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);

  // Filtra pelo nome enquanto a pessoa digita na busca.
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? pacientes.filter((p) => p.name.toLowerCase().includes(q)) : pacientes;
  }, [pacientes, busca]);

  const salvarNovo = async (campos: PatientFields) => {
    await criarNoBanco(rotas.pacientes(clinic!.id), campos);
  };

  return (
    <AppScreen>
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

      <Text style={styles.counter}>
        {busca ? `${visiveis.length} de ${pacientes.length} paciente(s)` : `${pacientes.length} paciente(s) cadastrado(s)`}
      </Text>

      {carregado && visiveis.length === 0 ? (
        <EmptyHero
          title={busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          subtitle={busca ? 'Confira o nome digitado na busca.' : 'Cadastre o primeiro paciente para começar.'}
          buttonLabel="+ Novo paciente"
          onPress={() => setNovoOpen(true)}
        />
      ) : null}

      {/* Um cartão por paciente: iniciais, nome, serviço · início */}
      <View style={styles.list}>
        {visiveis.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.card}
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
                {[p.service, p.treatmentStart ? `Início ${p.treatmentStart}` : null].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <PacienteModal visible={novoOpen} onClose={() => setNovoOpen(false)} onSave={salvarNovo} />
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
  list: { gap: 12, marginTop: 12, paddingBottom: 8 },
  card: { ...card, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
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
});
