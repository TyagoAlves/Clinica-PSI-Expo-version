// src/screens/PainelScreen.tsx
import { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import SectionCard from '../componentes/SectionCard';
import EmptyHero from '../componentes/EmptyHero';
import NovoPacienteModal from '../componentes/NovoPacienteModal';
import AppDrawer from '../componentes/AppDrawer';
import DatabaseDebugModal from '../componentes/DatabaseDebugModal';
import { useDatabase } from '../database/DatabaseProvider';
import { PatientService } from '../services/patient';

const emBreve = () =>
  Alert.alert(
    'Em breve',
    'Nesta fase, os dados aparecem só depois que a persistência for conectada.',
    [{ text: 'Entendi' }]
  );

type Props = {
  onLogout?: () => void;
};

export default function PainelScreen({ onLogout }: Props = {}) {
  const { patientRepo } = useDatabase();
  const [novoPacienteOpen, setNovoPacienteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dbDebugOpen, setDbDebugOpen] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);

  const carregarPacientes = useCallback(async () => {
    try {
      const patientService = new PatientService(patientRepo);
      const lista = await patientService.listAll();
      setPacientes(lista);
    } catch (e) {
      console.warn('Erro ao carregar pacientes do SQLite:', e);
    }
  }, [patientRepo]);

  useEffect(() => {
    carregarPacientes();
  }, [carregarPacientes]);

  const handlePacienteSalvo = useCallback(async (payload: any) => {
    try {
      const patientService = new PatientService(patientRepo);
      await patientService.createPatient({
        clinicId: 1,
        name: payload.nome,
        birthDate: payload.nascimento,
        notes: `${payload.servico} - ${payload.telefone} - ${payload.descricao}`,
      });
      setNovoPacienteOpen(false);
      carregarPacientes();
      Alert.alert('Salvo no SQLite', `Paciente "${payload.nome}" registrado com sucesso no banco.`);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao salvar paciente.');
    }
  }, [patientRepo, carregarPacientes]);

  return (
    <AppScreen>
      {/* Toolbar (☰ + busca + botão SQLite) */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.search}
          placeholder="⌕ Buscar paciente pelo nome ou telefone…"
          placeholderTextColor={colors.placeholder}
          editable={false}
          accessibilityLabel="Buscar paciente"
        />
        <TouchableOpacity
          style={styles.dbBtn}
          onPress={() => setDbDebugOpen(true)}
          accessibilityLabel="Ver banco SQLite"
        >
          <Text style={styles.dbBtnText}>💾 DB</Text>
        </TouchableOpacity>
      </View>

      {/* Linha de título + ação */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Painel</Text>
          <Text style={styles.subtitle}>Visão geral da clínica (SQLite Ativo)</Text>
        </View>
        <TouchableOpacity
          style={styles.newPatientBtn}
          onPress={() => setNovoPacienteOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Novo Paciente"
        >
          <Text style={styles.newPatientText}>+ Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Hero ou Lista de Pacientes do Banco */}
      {pacientes.length === 0 ? (
        <EmptyHero onPress={() => setNovoPacienteOpen(true)} />
      ) : (
        <View style={styles.patientsListCard}>
          <Text style={styles.patientsCardTitle}>
            Pacientes Registrados no SQLite ({pacientes.length})
          </Text>
          {pacientes.map((p) => (
            <View key={p.id} style={styles.patientRow}>
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>{p.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{p.name}</Text>
                <Text style={styles.patientNotes}>{p.notes || 'Sem observações'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Sessões de hoje */}
      <SectionCard title="Sessões de hoje" actionLabel="Abrir agenda" onActionPress={emBreve}>
        <Text style={styles.muted}>Nenhuma sessão agendada para hoje.</Text>
      </SectionCard>

      {/* Últimos registros */}
      <SectionCard title="Últimos registros">
        <Text style={styles.muted}>
          {pacientes.length > 0
            ? `${pacientes.length} paciente(s) sincronizado(s) no banco local.`
            : 'Nenhuma evolução registrada.'}
        </Text>
      </SectionCard>

      {/* Pacientes por serviço */}
      <SectionCard title="Pacientes por serviço">
        <Text style={styles.muted}>
          {pacientes.length > 0 ? `${pacientes.length} em atendimento.` : 'Nenhum paciente por serviço ainda.'}
        </Text>
      </SectionCard>

      {/* Modal Novo Paciente */}
      <NovoPacienteModal
        visible={novoPacienteOpen}
        onClose={() => setNovoPacienteOpen(false)}
        onSaved={handlePacienteSalvo}
      />

      {/* Visualizador de Teste do Banco SQLite */}
      <DatabaseDebugModal
        visible={dbDebugOpen}
        onClose={() => setDbDebugOpen(false)}
      />

      {/* Menu lateral */}
      <AppDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={onLogout}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 18, color: colors.text },
  search: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.placeholder,
  },
  dbBtn: {
    paddingHorizontal: 10,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  newPatientBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPatientText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  muted: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  patientsListCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  patientsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  patientNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

