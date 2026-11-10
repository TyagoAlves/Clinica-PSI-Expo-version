// src/componentes/DatabaseDebugModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useDatabase } from '../database/DatabaseProvider';
import { colors } from '../theme';

export default function DatabaseDebugModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { userRepo, clinicRepo, patientRepo } = useDatabase();
  const [users, setUsers] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const u = await userRepo.listAll();
      const c = await clinicRepo.listAll();
      const p = await patientRepo.listAll();
      setUsers(u);
      setClinics(c);
      setPatients(p);
    } catch (e) {
      console.warn('Erro ao carregar dados SQLite:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Visualizador de Teste SQLite</Text>
              <Text style={styles.subtitle}>Tabelas e registros reais persistidos</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Tabela de Usuários */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tabela: users ({users.length} {users.length === 1 ? 'registro' : 'registros'})
              </Text>
              {users.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum usuário cadastrado ainda.</Text>
              ) : (
                users.map((u) => (
                  <View key={u.id} style={styles.itemCard}>
                    <Text style={styles.itemName}>
                      #{u.id} - {u.name} ({u.role})
                    </Text>
                    <Text style={styles.itemDetail}>E-mail: {u.email}</Text>
                    {u.crp ? <Text style={styles.itemDetail}>CRP: {u.crp}</Text> : null}
                    <Text style={styles.itemDetail}>
                      Clínica ID: {u.clinicId ?? 'Sem clínica'}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Tabela de Clínicas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tabela: clinics ({clinics.length} {clinics.length === 1 ? 'registro' : 'registros'})
              </Text>
              {clinics.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma clínica cadastrada.</Text>
              ) : (
                clinics.map((c) => (
                  <View key={c.id} style={styles.itemCard}>
                    <Text style={styles.itemName}>
                      #{c.id} - {c.name}
                    </Text>
                    {c.cnpj ? <Text style={styles.itemDetail}>CNPJ: {c.cnpj}</Text> : null}
                    {c.phone ? <Text style={styles.itemDetail}>Telefone: {c.phone}</Text> : null}
                  </View>
                ))
              )}
            </View>

            {/* Tabela de Pacientes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tabela: patients ({patients.length}{' '}
                {patients.length === 1 ? 'registro' : 'registros'})
              </Text>
              {patients.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum paciente cadastrado.</Text>
              ) : (
                patients.map((p) => (
                  <View key={p.id} style={styles.itemCard}>
                    <Text style={styles.itemName}>
                      #{p.id} - {p.name}
                    </Text>
                    {p.birthDate ? (
                      <Text style={styles.itemDetail}>Nascimento: {p.birthDate}</Text>
                    ) : null}
                    {p.notes ? (
                      <Text style={styles.itemDetail}>Observações: {p.notes}</Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
              <Text style={styles.refreshBtnText}>Atualizar Dados</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 26, color: colors.textMuted, lineHeight: 28 },
  content: { padding: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: 8 },
  emptyText: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  footer: { paddingHorizontal: 18, paddingTop: 10 },
  refreshBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
