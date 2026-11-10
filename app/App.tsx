// App.tsx
import { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import CadastroPasso1Screen from './src/screens/CadastroPasso1Screen';
import CadastroPasso2Screen from './src/screens/CadastroPasso2Screen';
import PainelScreen from './src/screens/PainelScreen';
import { DatabaseProvider } from './src/database/DatabaseProvider';

export type ScreenType = 'login' | 'cadastro1' | 'cadastro2' | 'painel';

function AppContent() {
  const [tela, setTela] = useState<ScreenType>('login');

  const irLogin = useCallback(() => setTela('login'), []);
  const irCadastro1 = useCallback(() => setTela('cadastro1'), []);
  const irCadastro2 = useCallback(() => setTela('cadastro2'), []);
  const irPainel = useCallback(() => setTela('painel'), []);

  let conteudo;
  if (tela === 'login') {
    conteudo = <LoginScreen onCadastrar={irCadastro1} onEntrar={irPainel} />;
  } else if (tela === 'cadastro1') {
    conteudo = <CadastroPasso1Screen onVoltar={irLogin} onContinuar={irCadastro2} />;
  } else if (tela === 'cadastro2') {
    conteudo = <CadastroPasso2Screen onVoltar={irCadastro1} onConcluir={irPainel} />;
  } else {
    conteudo = <PainelScreen onLogout={irLogin} />;
  }

  return (
    <View style={styles.safe}>
      {conteudo}

      {/* Barra de atalhos rápidos de navegação para facilitar a visualização de qualquer tela */}
      <View style={styles.navBarPreview}>
        <TouchableOpacity
          style={[styles.navBtn, tela === 'login' && styles.navBtnActive]}
          onPress={irLogin}
        >
          <Text style={[styles.navBtnText, tela === 'login' && styles.navBtnTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, tela === 'cadastro1' && styles.navBtnActive]}
          onPress={irCadastro1}
        >
          <Text style={[styles.navBtnText, tela === 'cadastro1' && styles.navBtnTextActive]}>Cad. 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, tela === 'cadastro2' && styles.navBtnActive]}
          onPress={irCadastro2}
        >
          <Text style={[styles.navBtnText, tela === 'cadastro2' && styles.navBtnTextActive]}>Cad. 2</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navBtn, tela === 'painel' && styles.navBtnActive]}
          onPress={irPainel}
        >
          <Text style={[styles.navBtnText, tela === 'painel' && styles.navBtnTextActive]}>Painel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F3F8',
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 480,
          width: '100%',
          alignSelf: 'center',
          minHeight: '100vh',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }
      : {}),
  },
  navBarPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
    zIndex: 9999,
  },
  navBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  navBtnActive: {
    backgroundColor: '#4F46E5',
  },
  navBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  navBtnTextActive: {
    color: '#FFFFFF',
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <AppContent />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}

