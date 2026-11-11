// src/sync/SyncProvider.tsx
// Estado de conexão com o servidor. Desde a migração para o Supabase o app é ONLINE:
// não há banco no aparelho nem fila de pendências. Este provider:
//  - acompanha se há internet (NetInfo) e se a API respondeu;
//  - busca a lista de profissionais da clínica;
//  - "Atualizar agora" (syncNow) recarrega todas as telas a partir do servidor.
// A interface (state, pending, lastSyncAt, syncNow…) foi mantida para não mexer nas telas.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { api, ApiError } from '../services/api';
import type { ApiMember } from '../services/apiTypes';

const INTERVAL_MS = 60_000;

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

interface SyncContextValue {
  state: SyncState;
  /** Sempre 0: sem banco local, nada fica pendente. */
  pending: number;
  /** Última vez que os dados foram atualizados do servidor. */
  lastSyncAt: string | null;
  lastError: string | null;
  members: ApiMember[];
  syncNow(): Promise<void>;
  requestSync(): void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync deve ser usado dentro de <SyncProvider>');
  return ctx;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { refreshAll } = useDatabase();
  const { status, clinic } = useAuth();
  const clinicId = status === 'signedIn' ? (clinic?.id ?? null) : null;

  const [state, setState] = useState<SyncState>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const running = useRef(false);

  const syncNow = useCallback(async () => {
    if (!clinicId || running.current) return;
    running.current = true;
    setState('syncing');
    try {
      setMembers(await api.members(clinicId));
      refreshAll();
      setLastSyncAt(new Date().toISOString());
      setLastError(null);
      setState('idle');
    } catch (e) {
      const offline = e instanceof ApiError && e.isNetwork;
      setState(offline ? 'offline' : 'error');
      setLastError(e instanceof Error ? e.message : String(e));
    } finally {
      running.current = false;
    }
  }, [clinicId, refreshAll]);

  const requestSync = useCallback(() => {
    syncNow().catch(() => {});
  }, [syncNow]);

  useEffect(() => {
    if (!clinicId) {
      setMembers([]);
      setLastSyncAt(null);
      setState('idle');
      return;
    }
    syncNow();
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) requestSync();
      else setState('offline');
    });
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') requestSync();
    });
    const interval = setInterval(requestSync, INTERVAL_MS);
    return () => {
      unsubNet();
      appSub.remove();
      clearInterval(interval);
    };
  }, [clinicId, syncNow, requestSync]);

  const value = useMemo<SyncContextValue>(
    () => ({ state, pending: 0, lastSyncAt, lastError, members, syncNow, requestSync }),
    [state, lastSyncAt, lastError, members, syncNow, requestSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
