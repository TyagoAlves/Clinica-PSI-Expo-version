// src/login/AuthProvider.tsx
// Sessão do usuário: quem está logado e em qual clínica.
// O login precisa de internet (a conta mora no servidor). O token fica guardado no
// SecureStore do aparelho, então o app continua logado depois de fechado.
// Não há tela de cadastro: as contas são criadas na API com "npm run criar-conta".
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, ApiError, setAuthToken, setUnauthorizedHandler } from '../api/cliente';
import type { ApiClinic, ApiUser } from '../api/tipos';

const STORAGE_KEY = 'clinicapsi.session.v1';

interface StoredSession {
  token: string;
  user: ApiUser;
  clinic: ApiClinic;
}

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: ApiUser | null;
  clinic: ApiClinic | null;
  login(email: string, password: string): Promise<void>;
  /** Encerra a sessão (revoga o token no servidor, se houver conexão). */
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (next: StoredSession | null) => {
    setAuthToken(next?.token ?? null);
    setSession(next);
    if (next) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  // Ao abrir o app: restaura a sessão salva e, se houver internet, atualiza o perfil.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        const stored: StoredSession | null = raw ? JSON.parse(raw) : null;
        if (!active) return;
        if (stored?.clinic) {
          setAuthToken(stored.token);
          setSession(stored);
        }
        setLoading(false);
        if (stored?.clinic) {
          try {
            const me = await api.me();
            if (active && me.clinic) await persist({ ...stored, user: me.user, clinic: me.clinic });
          } catch (e) {
            // Sem internet: segue com o perfil salvo. 401 é tratado pelo handler abaixo.
            if (!(e instanceof ApiError) || !e.isNetwork) console.warn('[auth] falha ao atualizar perfil:', e);
          }
        }
      } catch (e) {
        console.warn('[auth] sessão salva ilegível, saindo:', e);
        if (active) {
          await persist(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [persist]);

  // Token revogado/expirado: volta para o login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      persist(null).catch((e) => console.warn('[auth] erro ao limpar sessão:', e));
    });
    return () => setUnauthorizedHandler(null);
  }, [persist]);

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const res = await api.login(email, password);
      if (!res.clinic) {
        throw new ApiError(409, 'Esta conta não tem clínica. Crie a conta com "npm run criar-conta".', 'clinic_required');
      }
      await persist({ token: res.token, user: res.user, clinic: res.clinic });
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // Sem internet o token não é revogado no servidor; ele expira sozinho.
      console.warn('[auth] logout sem contato com o servidor:', e);
    }
    await persist(null);
  }, [persist]);

  const status: AuthStatus = loading ? 'loading' : session ? 'signedIn' : 'signedOut';

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, clinic: session?.clinic ?? null, login, logout }),
    [status, session, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
