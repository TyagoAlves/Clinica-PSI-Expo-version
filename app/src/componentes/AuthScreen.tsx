// src/componentes/AuthScreen.tsx
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewInstance,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import BrandHeader from './BrandHeader';

const ScrollContext = createContext<((opts?: { animated?: boolean }) => void) | null>(null);
export const useAuthScroll = () => useContext(ScrollContext);

export default function AuthScreen({ children }: { children: ReactNode }) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollToEnd = useCallback((opts?: { animated?: boolean }) => {
    scrollRef.current?.scrollToEnd({ animated: true, ...opts });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <ScrollContext.Provider value={scrollToEnd}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BrandHeader />
            {children}
            <Text style={styles.footer}>
              Os dados ficam no servidor seguro da clínica, protegidos por criptografia.
            </Text>
          </ScrollView>
        </ScrollContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  keyboardWrap: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 72,
  },
  footer: {
    width: '100%',
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
