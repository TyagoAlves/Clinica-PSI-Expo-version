// App.tsx
// Ponto de partida do app. Escolhe o que mostrar pela sessão:
//   carregando  -> rodinha
//   sem login   -> tela de Login
//   logado      -> Painel (e dele: Pacientes, Paciente, Agenda)
import { View, StyleSheet, Platform, ActivityIndicator, type ViewStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/telas/LoginScreen';
import PainelScreen from './src/telas/PainelScreen';
import PacientesScreen from './src/telas/PacientesScreen';
import PacienteScreen from './src/telas/PacienteScreen';
import AgendaScreen from './src/telas/AgendaScreen';
import { AppNavProvider, useAppNav } from './src/navegacao/AppNav';
import { AuthProvider, useAuth } from './src/login/AuthProvider';
import { colors } from './src/theme';

function AppContent() {
  const { status } = useAuth();

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
        <TelasLogado />
      </AppNavProvider>
    );
  } else {
    conteudo = <LoginScreen />;
  }

  return <View style={styles.safe}>{conteudo}</View>;
}

/** Telas depois do login (pilha simples, com o "voltar" do Android). */
function TelasLogado() {
  const { route } = useAppNav();
  if (route.name === 'pacientes') return <PacientesScreen />;
  if (route.name === 'agenda') return <AgendaScreen />;
  if (route.name === 'paciente') return <PacienteScreen key={route.id} id={route.id} />;
  return <PainelScreen />;
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
