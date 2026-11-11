// src/screens/ConfiguracoesScreen.tsx
// Tela 10 (Guia 14, Tyago) — Configurações, no layout do mock (seções Clínica, Conta, Privacidade,
// Dados, Zona de perigo, Sobre), com as ações ligadas:
//   Informações da clínica e Perfil e acesso → editam na API;
//   Backup e exportação → exporta os dados da clínica (JSON) pela folha de compartilhamento;
//   Sair deste aparelho → encerra a sessão (os dados ficam no servidor).
// Aparência e Termos e privacidade ainda não têm tela/guia: avisam "em breve".
import { useMemo, useState } from 'react';
import { Alert, Share, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import ClinicaModal from '../componentes/ClinicaModal';
import PerfilModal from '../componentes/PerfilModal';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import { API_BASE_URL } from '../config/api';

const APP_VERSION = '1.0';

type Item = {
  key: string;
  section: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

const SECTIONS = ['CLÍNICA', 'CONTA', 'PRIVACIDADE', 'DADOS', 'ZONA DE PERIGO', 'SOBRE'];

export default function ConfiguracoesScreen() {
  const { patientRepo, evolutionRepo, appointmentRepo, serviceRepo } = useDatabase();
  const { user, clinic, updateClinic, updateProfile, changePassword, logout } = useAuth();
  const sync = useSync();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [clinicaOpen, setClinicaOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  const emBreve = (titulo: string, mensagem: string) => Alert.alert(titulo, mensagem, [{ text: 'Entendi' }]);

  const exportar = () =>
    Alert.alert(
      'Exportar dados da clínica',
      'O arquivo terá dados clínicos sigilosos SEM criptografia. Compartilhe só com destino seguro (ex.: seu próprio armazenamento).',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: async () => {
            if (!clinic) return;
            const [patients, evolutions, appointments, services] = await Promise.all([
              patientRepo.list(clinic.id),
              evolutionRepo.list(clinic.id),
              appointmentRepo.list(clinic.id),
              serviceRepo.list(clinic.id),
            ]);
            const dump = {
              exportadoEm: new Date().toISOString(),
              clinica: clinic,
              usuario: { nome: user?.name, email: user?.email },
              pacientes: patients,
              evolucoes: evolutions,
              sessoes: appointments,
              servicos: services,
            };
            await Share.share({ title: 'Backup Clínica Psi', message: JSON.stringify(dump, null, 2) });
          },
        },
      ]
    );

  const apagarLocal = () =>
    Alert.alert(
      'Sair deste aparelho?',
      (sync.pending > 0
        ? `ATENÇÃO: ${sync.pending} alteração(ões) ainda não foram enviadas ao servidor e serão perdidas.\n\n`
        : '') +
        'Sua sessão será encerrada neste aparelho. Os dados continuam salvos no servidor da clínica e voltam ao entrar de novo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => logout().catch(() => {}) },
      ]
    );

  const sobre = () =>
    Alert.alert(
      'Sobre o sistema',
      `Clínica Psi — Prontuário psicológico\nVersão ${APP_VERSION}\n\nServidor: ${API_BASE_URL}\nÚltima atualização: ${
        sync.lastSyncAt ? new Date(sync.lastSyncAt).toLocaleString('pt-BR') : 'nunca'
      }`
    );

  const roleLabel = user?.role === 'admin' ? 'Administrador(a)' : 'Psicólogo(a)';

  const items: Item[] = [
    {
      key: 'clinica',
      section: 'CLÍNICA',
      title: 'Informações da clínica',
      subtitle: [clinic?.name, clinic?.unit].filter(Boolean).join(' · '),
      icon: 'business-outline',
      onPress: () => setClinicaOpen(true),
    },
    {
      key: 'aparencia',
      section: 'CLÍNICA',
      title: 'Aparência',
      subtitle: 'Cores, logo e identidade visual.',
      icon: 'color-palette-outline',
      onPress: () => emBreve('Aparência', 'A personalização de cores e tema entra numa próxima fase (ainda sem guia/mock).'),
    },
    {
      key: 'perfil',
      section: 'CONTA',
      title: 'Perfil e acesso',
      subtitle: [user?.name, roleLabel, user?.crp].filter(Boolean).join(' · '),
      icon: 'person-circle-outline',
      onPress: () => setPerfilOpen(true),
    },
    {
      key: 'termos',
      section: 'PRIVACIDADE',
      title: 'Termos e privacidade',
      subtitle: 'Termo de consentimento e aviso de privacidade.',
      icon: 'shield-checkmark-outline',
      onPress: () =>
        emBreve('Termos e privacidade', 'Os modelos de termo (LGPD) entram numa próxima fase — o texto precisa ser validado com o cliente.'),
    },
    {
      key: 'backup',
      section: 'DADOS',
      title: 'Backup e exportação',
      subtitle: 'Exporte uma cópia dos dados da clínica.',
      icon: 'cloud-download-outline',
      onPress: exportar,
    },
    {
      key: 'apagar',
      section: 'ZONA DE PERIGO',
      title: 'Sair deste aparelho',
      subtitle: 'Encerra a sessão e limpa os dados em memória.',
      icon: 'alert-circle-outline',
      onPress: apagarLocal,
      danger: true,
    },
    {
      key: 'sobre',
      section: 'SOBRE',
      title: 'Sobre o sistema',
      subtitle: `Versão ${APP_VERSION} · Dados no servidor (SQLite)`,
      icon: 'information-circle-outline',
      onPress: sobre,
    },
  ];

  const termo = search.trim().toLowerCase();
  const visiveis = useMemo(
    () => (termo ? items.filter((i) => `${i.title} ${i.subtitle} ${i.section}`.toLowerCase().includes(termo)) : items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [termo, user, clinic, sync.pending]
  );

  return (
    <AppScreen>
      <AppToolbar
        onMenuPress={() => setDrawerOpen(true)}
        search={search}
        onChangeSearch={setSearch}
        placeholder="Pesquisar nas configurações..."
        rightActionIcon="ellipsis-vertical"
        onRightActionPress={() =>
          Alert.alert('Configurações', undefined, [
            { text: 'Atualizar agora', onPress: () => sync.syncNow() },
            { text: 'Fechar', style: 'cancel' },
          ])
        }
        rightActionLabel="Mais ações"
      />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Personalize e gerencie os detalhes do seu consultório e da sua conta.</Text>
      </View>

      {SECTIONS.map((sec) => {
        const doGrupo = visiveis.filter((i) => i.section === sec);
        if (doGrupo.length === 0) return null;
        const danger = doGrupo.some((i) => i.danger);
        return (
          <View key={sec}>
            <Text style={styles.sectionHeader}>{sec}</Text>
            <View style={[styles.sectionGroup, danger && styles.dangerGroup]}>
              {doGrupo.map((i, idx) => (
                <View key={i.key}>
                  {idx > 0 ? <View style={styles.separator} /> : null}
                  <TouchableOpacity style={styles.cardItem} onPress={i.onPress} accessibilityRole="button" accessibilityLabel={i.title}>
                    <View style={[styles.cardIconWrap, { backgroundColor: i.danger ? '#FEE2E2' : '#EDE9FE' }]}>
                      <Ionicons name={i.icon} size={20} color={i.danger ? '#DC2626' : '#7C3AED'} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, i.danger && { color: '#DC2626' }]}>{i.title}</Text>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {i.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={i.danger ? '#DC2626' : colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        );
      })}
      {visiveis.length === 0 ? <Text style={styles.empty}>Nada encontrado para “{search.trim()}”.</Text> : null}

      <Text style={styles.footerNote}>Seus dados ficam no servidor seguro da clínica (SQLite), com criptografia.</Text>

      <AppMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} active="configuracoes" />
      <ClinicaModal visible={clinicaOpen} onClose={() => setClinicaOpen(false)} clinic={clinic} onSave={updateClinic} />
      <PerfilModal
        visible={perfilOpen}
        onClose={() => setPerfilOpen(false)}
        user={user}
        onSaveProfile={updateProfile}
        onChangePassword={async (a, b) => {
          await changePassword(a, b);
          Alert.alert('Senha alterada', 'Os outros aparelhos conectados à sua conta foram desconectados.');
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerArea: { paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8,
    marginTop: 16, marginBottom: 8, paddingHorizontal: 4,
  },
  sectionGroup: {
    backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  dangerGroup: { borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' },
  cardItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 66 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  footerNote: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 24, marginBottom: 24, fontStyle: 'italic' },
});
