// src/navigation/AppNav.tsx
// Navegação pós-login (Rota A do GUIA_03, agora com pilha): sem dependências,
// com o botão "voltar" do Android desempilhando telas.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';

export type Route =
  | { name: 'painel' }
  | { name: 'pacientes' }
  | { name: 'agenda' }
  | { name: 'servicos' }
  | { name: 'configuracoes' }
  | { name: 'paciente'; id: string };

interface NavValue {
  route: Route;
  navigate(route: Route): void;
  /** Troca a tela atual (itens do menu lateral). */
  reset(route: Route): void;
  goBack(): void;
  canGoBack: boolean;
}

const NavContext = createContext<NavValue | null>(null);

export function useAppNav(): NavValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useAppNav deve ser usado dentro de <AppNavProvider>');
  return ctx;
}

export function AppNavProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'painel' }]);

  const navigate = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const reset = useCallback((r: Route) => setStack(r.name === 'painel' ? [r] : [{ name: 'painel' }, r]), []);
  const goBack = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        goBack();
        return true;
      }
      return false; // no Painel: comportamento padrão (sai do app)
    });
    return () => sub.remove();
  }, [stack.length, goBack]);

  const value = useMemo<NavValue>(
    () => ({ route: stack[stack.length - 1]!, navigate, reset, goBack, canGoBack: stack.length > 1 }),
    [stack, navigate, reset, goBack]
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
