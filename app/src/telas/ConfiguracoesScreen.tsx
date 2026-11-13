// src/telas/ConfiguracoesScreen.tsx
// Tela 10 (Guia 14, Tyago) — Configurações, no layout do mock (seções Clínica, Conta, Privacidade,
// Dados, Zona de perigo, Sobre), com as ações ligadas:
//   Informações da clínica e Perfil e acesso → editam na API;
//   Backup e exportação → exporta os dados da clínica (JSON) pela folha de compartilhamento;
//   Sair deste aparelho → encerra a sessão (os dados ficam no servidor).
// Aparência e Termos e privacidade ainda não têm tela/guia: avisam "em breve".
import { useMemo, useState } from 'react';
import { Alert, Share, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { card, colors } from '../theme';
import AppScreen from '../componentes/AppScreen';
import AppToolbar from '../componentes/AppToolbar';
import AppMenu from '../componentes/AppMenu';
import ClinicaModal from '../modais/ClinicaModal';
import PerfilModal from '../modais/PerfilModal';
import { buscarDados, rotas } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { useConexao } from '../conexao/ConexaoProvider';
import { API_BASE_URL } from '../api/endereco';

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

const SECTIONS = ['CLÍNICA', 'CONTA', 'LGPD', 'DADOS', 'SOBRE'];

export default function ConfiguracoesScreen() {
  const { user, clinic, updateClinic, updateProfile, changePassword, logout } = useAuth();
  const conexao = useConexao();
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
              buscarDados(rotas.pacientes(clinic.id)),
              buscarDados(rotas.ultimasEvolucoes(clinic.id)),
              buscarDados(rotas.sessoes(clinic.id)),
              buscarDados(rotas.servicos(clinic.id)),
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
        conexao.atualizadoEm ? new Date(conexao.atualizadoEm).toLocaleString('pt-BR') : 'nunca'
      }`
    );

  const roleLabel = user?.role === 'admin' ? 'Administrador(a)' : 'Psicólogo(a)';

  const items: Item[] = [
    {
      key: 'clinica',
      section: 'CLÍNICA',
      title: 'Identidade da clínica',
      subtitle: [clinic?.name, clinic?.unit].filter(Boolean).join(' · '),
      icon: 'business-outline',
      onPress: () => setClinicaOpen(true),
    },
    {
      key: 'aparencia',
      section: 'CLÍNICA',
      title: 'Aparência',
      subtitle: 'Cor primária, logo e sigla',
      icon: 'color-palette-outline',
      onPress: () => emBreve('Aparência', 'A personalização de cores e tema entra numa próxima fase (ainda sem guia/mock).'),
    },
    {
      key: 'perfil',
      section: 'CONTA',
      title: 'Meu acesso',
      subtitle: [user?.name, roleLabel, user?.crp].filter(Boolean).join(' · '),
      icon: 'person-circle-outline',
      onPress: () => setPerfilOpen(true),
    },
    {
      key: 'termos',
      section: 'LGPD',
      title: 'Termos e privacidade',
      subtitle: 'Termo de tratamento e aviso de privacidade',
      icon: 'shield-checkmark-outline',
      onPress: () =>
        emBreve('Termos e privacidade', 'Os modelos de termo (LGPD) entram numa próxima fase — o texto precisa ser validado com o cliente.'),
    },
    {
      key: 'backup',
      section: 'DADOS',
      title: 'Backup e exportação',
      subtitle: 'Exportar uma cópia dos dados da clínica',
      icon: 'cloud-download-outline',
      onPress: exportar,
    },
    {
      key: 'apagar',
      section: 'DADOS',
      title: 'Sair deste aparelho',
      subtitle: 'Encerra a sessão neste aparelho',
      icon: 'alert-circle-outline',
      onPress: apagarLocal,
      danger: true,
    },
    {
      key: 'sobre',
      section: 'SOBRE',
      title: 'Sobre o sistema',
      subtitle: `Versão ${APP_VERSION} · Dados no servidor (Supabase)`,
      icon: 'information-circle-outline',
      onPress: sobre,
    },
  ];

  const termo = search.trim().toLowerCase();
  const visiveis = useMemo(
    () => (termo ? items.filter((i) => `${i.title} ${i.subtitle} ${i.section}`.toLowerCase().includes(termo)) : items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [termo, user, clinic]
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
            { text: 'Atualizar agora', onPress: () => conexao.atualizarAgora() },
            { text: 'Fechar', style: 'cancel' },
          ])
        }
        rightActionLabel="Mais ações"
      />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Identidade, acesso e dados do sistema</Text>
      </View>

      {/* Um cartão por opção, agrupados por seção (mock 12) */}
      {SECTIONS.map((sec) => {
        const doGrupo = visiveis.filter((i) => i.section === sec);
        if (doGrupo.length === 0) return null;
        return (
          <View key={sec}>
            <Text style={styles.sectionHeader}>{sec}</Text>
            <View style={styles.sectionGroup}>
              {doGrupo.map((i) => (
                <TouchableOpacity
                  key={i.key}
                  style={[styles.cardItem, i.danger && styles.cardDanger]}
                  onPress={i.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={i.title}
                >
                  <View style={[styles.cardIconWrap, i.danger && styles.cardIconDanger]}>
                    <Ionicons name={i.icon} size={18} color={i.danger ? colors.error : colors.primary} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, i.danger && { color: colors.error }]}>{i.title}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {i.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={i.danger ? colors.error : colors.placeholder} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
      {visiveis.length === 0 ? <Text style={styles.empty}>Nada encontrado para “{search.trim()}”.</Text> : null}

      <Text style={styles.footerNote}>Seus dados ficam no servidor seguro da clínica (Supabase), com criptografia.</Text>

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
  headerArea: {
    paddingTop: 14, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginHorizontal: -16, paddingHorizontal: 16,
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.6,
    marginTop: 18, marginBottom: 10, paddingHorizontal: 2,
  },
  sectionGroup: { gap: 12 },
  cardItem: { ...card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16, gap: 14 },
  cardDanger: { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconDanger: { backgroundColor: '#FEE2E2' },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardSubtitle: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  footerNote: { textAlign: 'center', fontSize: 11, color: colors.textMuted, marginTop: 24, marginBottom: 24 },
});
