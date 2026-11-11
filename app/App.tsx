// App.tsx
// Roteamento "Rota A" (GUIA_03) guiado pela sessão:
//   sem sessão         -> Login <-> Cadastro passo 1
//   conta sem clínica  -> Cadastro passo 2
//   sessão completa    -> Painel
import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, type ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
import PainelScreen from './src/screens/PainelScreen';
import PacientesScreen from './src/screens/PacientesScreen';
import PacienteScreen from './src/screens/PacienteScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import ServicosScreen from './src/screens/ServicosScreen';
import ConfiguracoesScreen from './src/screens/ConfiguracoesScreen';
import { AppNavProvider, useAppNav } from './src/navigation/AppNav';
import { DatabaseProvider, useDatabase } from './src/database/DatabaseProvider';
import { AuthProvider, useAuth } from './src/auth/AuthProvider';
import { SyncProvider } from './src/sync/SyncProvider';
import { colors } from './src/theme';

type PublicScreen = 'login' | 'cadastro1';

function AppContent() {
  const { status } = useAuth();
  const [publicScreen, setPublicScreen] = useState<PublicScreen>('login');

  const irLogin = useCallback(() => setPublicScreen('login'), []);
  const irCadastro1 = useCallback(() => setPublicScreen('cadastro1'), []);

  // Ao entrar, a próxima saída (logout/sessão expirada) deve cair no Login, não no último formulário.
  useEffect(() => {
    if (status === 'signedIn' || status === 'needsClinic') setPublicScreen('login');
  }, [status]);

  let conteudo;
  if (status === 'loading') {
    conteudo = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  } else if (status === 'signedIn') {
    conteudo = (
      <AppNavProvider>
        <SignedInRoutes />
      </AppNavProvider>
    );
  } else if (status === 'needsClinic') {
    conteudo = <CadastroPasso2Screen />;
  } else if (publicScreen === 'cadastro1') {
    conteudo = <CadastroPasso1Screen onVoltar={irLogin} />;
  } else {
    conteudo = <LoginScreen onCadastrar={irCadastro1} />;
  }

  return <View style={styles.safe}>{conteudo}</View>;
}

/** Telas pós-login (pilha simples com "voltar" do Android). */
function SignedInRoutes() {
  const { route } = useAppNav();
  if (route.name === 'pacientes') return <PacientesScreen />;
  if (route.name === 'agenda') return <AgendaScreen />;
  if (route.name === 'servicos') return <ServicosScreen />;
  if (route.name === 'configuracoes') return <ConfiguracoesScreen />;
  if (route.name === 'paciente') return <PacienteScreen key={route.id} id={route.id} />;
  return <PainelScreen />;
}

/** Liga o logout do AuthProvider à limpeza do banco local (dados clínicos não ficam no aparelho). */
function Providers({ children }: { children: React.ReactNode }) {
  const { wipe } = useDatabase();
  return (
    <AuthProvider onSignOut={wipe}>
      <SyncProvider>{children}</SyncProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    ...(Platform.OS === 'web'
      ? // '100vh' só existe no react-native-web; o tipo ViewStyle do RN não o aceita.
        ({
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
          minHeight: '100vh',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        } as unknown as ViewStyle)
      : {}),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <Providers>
          <AppContent />
        </Providers>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
