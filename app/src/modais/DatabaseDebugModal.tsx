// src/modais/DatabaseDebugModal.tsx
// Painel técnico (dev/suporte): sessão, conexão com a API e dados do servidor.
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { buscarDados, rotas, type Paciente } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useConexao } from '../conexao/ConexaoProvider';
import { colors } from '../theme';
import { API_BASE_URL } from '../api/endereco';
import { api } from '../api/cliente';
import { maskPhone } from '../utils/masks';

type ApiStatus =
  | { state: 'idle' | 'checking' }
  | { state: 'ok'; detail: string }
  | { state: 'error'; detail: string };

const ROTULO_CONEXAO = { conectado: 'Conectado', atualizando: 'Atualizando…', 'sem-internet': 'Sem conexão', erro: 'Erro' } as const;

export default function DatabaseDebugModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, clinic } = useAuth();
  const conexao = useConexao();
  const [patients, setPatients] = useState<Paciente[]>([]);
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
      setPatients(clinic ? await buscarDados<Paciente>(rotas.pacientes(clinic.id)) : []);
    } catch (e) {
      console.warn('[debug] erro ao ler dados locais:', e);
    }
  }, [clinic]);

  useEffect(() => {
    if (!visible) return;
    loadData();
    checkApi();
  }, [visible, loadData, checkApi]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dados e conexão</Text>
              <Text style={styles.subtitle}>Diagnóstico da conexão com o servidor</Text>
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
              <View style={styles.itemCard} testID="conexao-status">
                <Text style={[styles.itemName, conexao.estado === 'erro' && styles.apiError]}>
                  {ROTULO_CONEXAO[conexao.estado]}
                </Text>
                <Text style={styles.itemDetail}>
                  Última: {conexao.atualizadoEm ? new Date(conexao.atualizadoEm).toLocaleString('pt-BR') : 'nunca'}
                </Text>
                {conexao.ultimoErro ? <Text style={[styles.itemDetail, styles.apiError]}>{conexao.ultimoErro}</Text> : null}
              </View>
            </View>

            {/* Pacientes no servidor */}
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
              style={[styles.refreshBtn, conexao.estado === 'atualizando' && styles.refreshBtnBusy]}
              onPress={() => conexao.atualizarAgora().then(loadData)}
              disabled={conexao.estado === 'atualizando'}
              accessibilityRole="button"
            >
              <Text style={styles.refreshBtnText}>
                {conexao.estado === 'atualizando' ? 'Atualizando…' : 'Atualizar agora'}
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
    borderRadius: 12,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  refreshBtnBusy: { opacity: 0.6 },
  refreshBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});
