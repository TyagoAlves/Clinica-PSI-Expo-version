// src/telas/PacienteScreen.tsx
// Ficha do paciente: nome, serviço, início do tratamento e descrição.
// Botões: Editar (abre o formulário) e Excluir (pede confirmação).
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import TopBar from '../componentes/TopBar';
import PacienteModal from '../modais/PacienteModal';
import { apagarNoBanco, atualizarNoBanco, buscarUm, ouvirMudancas, rotas, type Paciente } from '../banco/bancoDados';
import { useAppNav } from '../navegacao/AppNav';
import { initials } from '../utils/format';
import type { PatientFields } from '../api/tipos';

function Campo({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function PacienteScreen({ id }: { id: string }) {
  const nav = useAppNav();
  // undefined = carregando · null = não existe (foi apagado)
  const [paciente, setPaciente] = useState<Paciente | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const carregar = useCallback(async () => {
    const p = await buscarUm<Paciente>(rotas.paciente(id));
    setPaciente(p && !p.deletedAt ? p : null);
  }, [id]);

  // Busca ao abrir e de novo sempre que algum dado mudar.
  useEffect(() => {
    carregar().catch((e) => console.warn('[paciente] erro ao carregar:', e));
    return ouvirMudancas(carregar);
  }, [carregar]);

  if (paciente === undefined) return <AppScreen>{null}</AppScreen>;

  if (paciente === null) {
    return (
      <AppScreen>
        <TopBar title="Paciente" left="back" onLeft={nav.goBack} />
        <Text style={styles.removido}>Este paciente foi removido.</Text>
      </AppScreen>
    );
  }

  const salvarEdicao = async (campos: PatientFields) => {
    await atualizarNoBanco(rotas.paciente(id), campos);
  };

  const excluir = () => {
    Alert.alert('Excluir paciente?', `${paciente.name} deixa de aparecer na lista de pacientes.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await apagarNoBanco(rotas.paciente(id));
          nav.goBack();
        },
      },
    ]);
  };

  return (
    <AppScreen>
      <TopBar title="Ficha do paciente" left="back" onLeft={nav.goBack} />

      {/* Cabeçalho: iniciais e nome */}
      <View style={[styles.card, styles.headCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(paciente.name)}</Text>
        </View>
        <Text style={styles.headName} numberOfLines={2}>
          {paciente.name}
        </Text>
      </View>

      {/* Dados */}
      <View style={[styles.card, styles.dados]}>
        <Campo label="Nome completo" value={paciente.name} />
        <Campo label="Serviço" value={paciente.service} />
        <Campo label="Início do tratamento" value={paciente.treatmentStart} />
        <Campo label="Descrição / queixa principal" value={paciente.complaint} />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnOutline} onPress={() => setEditOpen(true)} accessibilityRole="button" accessibilityLabel="Editar paciente">
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.btnOutlineText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDanger} onPress={excluir} accessibilityRole="button" accessibilityLabel="Excluir paciente">
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.btnDangerText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PacienteModal visible={editOpen} onClose={() => setEditOpen(false)} onSave={salvarEdicao} paciente={paciente} />
    </AppScreen>
  );
}

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
  headName: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },

  dados: { paddingHorizontal: 16, paddingBottom: 16 },
  campo: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.divider },
  campoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  campoValue: { fontSize: 15, color: colors.text, marginTop: 4 },

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
