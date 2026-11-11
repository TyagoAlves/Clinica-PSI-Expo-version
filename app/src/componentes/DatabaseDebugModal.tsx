// src/componentes/DatabaseDebugModal.tsx
// Painel técnico (dev/suporte): sessão, conexão com a API e dados do servidor.
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useDatabase } from '../database/DatabaseProvider';
import type { LocalPatient } from '../database/repositories/types';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { colors } from '../theme';
import { API_BASE_URL } from '../config/api';
import { api } from '../services/api';
import { maskPhone } from '../services/masks';

type ApiStatus =
  | { state: 'idle' | 'checking' }
  | { state: 'ok'; detail: string }
  | { state: 'error'; detail: string };

const SYNC_LABEL = { idle: 'Conectado', syncing: 'Atualizando…', offline: 'Sem conexão', error: 'Erro' } as const;

export default function DatabaseDebugModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { patientRepo } = useDatabase();
  const { user, clinic } = useAuth();
  const sync = useSync();
  const [patients, setPatients] = useState<LocalPatient[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: 'idle' });

  const checkApi = useCallback(async () => {
    setApiStatus({ state: 'checking' });
    try {
      const h = await api.health();
      setApiStatus({ state: 'ok', detail: `${h.service} online (uptime ${h.uptime}s)` });
    } catch (e: any) {
      setApiStatus({ state: 'error', detail: e?.message || 'Falha ao conectar.' });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setPatients(clinic ? await patientRepo.list(clinic.id) : []);
    } catch (e) {
      console.warn('[debug] erro ao ler dados locais:', e);
    }
  }, [patientRepo, clinic]);

  useEffect(() => {
    if (!visible) return;
    loadData();
    checkApi();
    return patientRepo.subscribe(loadData);
  }, [visible, loadData, checkApi, patientRepo]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dados e conexão</Text>
              <Text style={styles.subtitle}>Diagnóstico do aparelho e da conexão</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar">
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Sessão */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sessão</Text>
              <View style={styles.itemCard}>
                <Text style={styles.itemName}>{user?.name ?? '—'}</Text>
                <Text style={styles.itemDetail}>{user?.email}</Text>
                <Text style={styles.itemDetail}>
                  Clínica: {clinic ? `${clinic.name}${clinic.unit ? ` · ${clinic.unit}` : ''}` : '—'}
                </Text>
              </View>
            </View>

            {/* Conexão com a API */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conexão com a API</Text>
              <View style={styles.itemCard} testID="api-status">
                <Text style={styles.itemDetail}>URL: {API_BASE_URL}</Text>
                <Text
                  style={[
                    styles.itemName,
                    apiStatus.state === 'ok' && styles.apiOk,
                    apiStatus.state === 'error' && styles.apiError,
                  ]}
                >
                  {apiStatus.state === 'ok'
                    ? `✓ ${apiStatus.detail}`
                    : apiStatus.state === 'error'
                      ? `✗ ${apiStatus.detail}`
                      : 'Verificando…'}
                </Text>
              </View>
              <TouchableOpacity onPress={checkApi} accessibilityRole="button">
                <Text style={styles.apiRetry}>Testar API novamente</Text>
              </TouchableOpacity>
            </View>

            {/* Sincronização */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Conexão</Text>
              <View style={styles.itemCard} testID="sync-status">
                <Text style={[styles.itemName, sync.state === 'error' && styles.apiError]}>
                  {SYNC_LABEL[sync.state]}
                </Text>
                <Text style={styles.itemDetail}>
                  Última: {sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString('pt-BR') : 'nunca'}
                </Text>
                {sync.lastError ? <Text style={[styles.itemDetail, styles.apiError]}>{sync.lastError}</Text> : null}
              </View>
            </View>

            {/* Pacientes no aparelho */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Pacientes no servidor ({patients.length} {patients.length === 1 ? 'registro' : 'registros'})
              </Text>
              {patients.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum paciente cadastrado.</Text>
              ) : (
                patients.map((p) => (
                  <View key={p.id} style={styles.itemCard}>
                    <Text style={styles.itemName}>
                      {p.name}
                    </Text>
                    <Text style={styles.itemDetail}>ID: {p.id}</Text>
                    <Text style={styles.itemDetail}>
                      {[p.phone ? maskPhone(p.phone) : null, p.service, p.status].filter(Boolean).join(' · ')}
                    </Text>
                    <Text style={styles.itemDetail}>Editado: {new Date(p.updatedAt).toLocaleString('pt-BR')}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.refreshBtn, sync.state === 'syncing' && styles.refreshBtnBusy]}
              onPress={() => sync.syncNow().then(loadData)}
              disabled={sync.state === 'syncing'}
              accessibilityRole="button"
            >
              <Text style={styles.refreshBtnText}>
                {sync.state === 'syncing' ? 'Atualizando…' : 'Atualizar agora'}
              </Text>
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
  apiOk: { color: '#15803D', marginTop: 4 },
  apiError: { color: colors.error, marginTop: 4 },
  apiRetry: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 4 },
  footer: { paddingHorizontal: 18, paddingTop: 10 },
  refreshBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshBtnBusy: { opacity: 0.6 },
  refreshBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
