// src/auth/AuthProvider.tsx
// Sessão do usuário. Login e cadastro exigem internet (a conta mora no servidor);
// o token e o perfil ficam no SecureStore do aparelho (o restante dos dados fica só no servidor).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, ApiError, setAuthToken, setUnauthorizedHandler } from '../services/api';
import type { ApiClinic, ApiUser, NewClinicInput, UserRole } from '../services/apiTypes';

const STORAGE_KEY = 'clinicapsi.session.v1';

interface StoredSession {
  token: string;
  user: ApiUser;
  clinic: ApiClinic | null;
}

export type AuthStatus = 'loading' | 'signedOut' | 'needsClinic' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: ApiUser | null;
  clinic: ApiClinic | null;
  login(email: string, password: string): Promise<void>;
  register(input: { name: string; email: string; password: string; crp?: string | null; role?: UserRole }): Promise<void>;
  createClinic(input: NewClinicInput): Promise<void>;
  /** Configurações → Informações da clínica (precisa de internet). */
  updateClinic(input: Partial<NewClinicInput>): Promise<void>;
  /** Configurações → Perfil e acesso (precisa de internet). */
  updateProfile(input: { name?: string; crp?: string | null }): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
  /** Encerra a sessão (revoga no servidor se houver conexão) e apaga os dados locais via onSignOut. */
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

type Props = {
  children: React.ReactNode;
  /** Limpeza extra ao sair (ex.: apagar o banco local). */
  onSignOut?: () => Promise<void>;
};

export function AuthProvider({ children, onSignOut }: Props) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);
  const onSignOutRef = useRef(onSignOut);
  onSignOutRef.current = onSignOut;

  const persist = useCallback(async (next: StoredSession | null) => {
    setAuthToken(next?.token ?? null);
    setSession(next);
    if (next) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const clearLocal = useCallback(async () => {
    await persist(null);
    await onSignOutRef.current?.();
  }, [persist]);

  // Restaura a sessão salva e, se houver internet, atualiza o perfil.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORAGE_KEY);
        const stored: StoredSession | null = raw ? JSON.parse(raw) : null;
        if (!active) return;
        if (stored) {
          setAuthToken(stored.token);
          setSession(stored);
        }
        setLoading(false);
        if (stored) {
          try {
            const me = await api.me();
            if (active) await persist({ ...stored, user: me.user, clinic: me.clinic });
          } catch (e) {
            // Offline: segue com o perfil salvo. 401 é tratado pelo handler abaixo.
            if (!(e instanceof ApiError) || !e.isNetwork) console.warn('[auth] falha ao atualizar perfil:', e);
          }
        }
      } catch (e) {
        console.warn('[auth] sessão salva ilegível, saindo:', e);
        if (active) {
          await clearLocal();
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [persist, clearLocal]);

  // Token revogado/expirado: volta para o login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearLocal().catch((e) => console.warn('[auth] erro ao limpar sessão:', e));
    });
    return () => setUnauthorizedHandler(null);
  }, [clearLocal]);

  const login = useCallback<AuthContextValue['login']>(
    async (email, password) => {
      const res = await api.login(email, password);
      await persist({ token: res.token, user: res.user, clinic: res.clinic ?? null });
    },
    [persist]
  );

  const register = useCallback<AuthContextValue['register']>(
    async (input) => {
      const res = await api.register(input);
      await persist({ token: res.token, user: res.user, clinic: null });
    },
    [persist]
  );

  const createClinic = useCallback<AuthContextValue['createClinic']>(
    async (input) => {
      if (!session) throw new ApiError(401, 'Faça login para continuar.', 'unauthenticated');
      const clinic = await api.createClinic(input);
      await persist({ ...session, clinic, user: { ...session.user, clinicId: clinic.id } });
    },
    [persist, session]
  );

  const updateClinic = useCallback<AuthContextValue['updateClinic']>(
    async (input) => {
      if (!session?.clinic) throw new ApiError(409, 'Cadastre a clínica primeiro.', 'clinic_required');
      const clinic = await api.updateClinic(session.clinic.id, input);
      await persist({ ...session, clinic });
    },
    [persist, session]
  );

  const updateProfile = useCallback<AuthContextValue['updateProfile']>(
    async (input) => {
      if (!session) throw new ApiError(401, 'Faça login para continuar.', 'unauthenticated');
      const user = await api.updateProfile(input);
      await persist({ ...session, user });
    },
    [persist, session]
  );

  const changePassword = useCallback<AuthContextValue['changePassword']>(async (currentPassword, newPassword) => {
    await api.changePassword(currentPassword, newPassword);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // Sem internet o token não é revogado no servidor; ele expira sozinho.
      console.warn('[auth] logout sem contato com o servidor:', e);
    }
    await clearLocal();
  }, [clearLocal]);

  const status: AuthStatus = loading
    ? 'loading'
    : !session
      ? 'signedOut'
      : !session.clinic
        ? 'needsClinic'
        : 'signedIn';

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      clinic: session?.clinic ?? null,
      login,
      register,
      createClinic,
      updateClinic,
      updateProfile,
      changePassword,
      logout,
    }),
    [status, session, login, register, createClinic, updateClinic, updateProfile, changePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
