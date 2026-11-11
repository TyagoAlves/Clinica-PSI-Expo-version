// src/sync/SyncProvider.tsx
// Motor de sincronização offline-first (pacientes, serviços e evoluções).
// - Tudo é gravado primeiro no SQLite do aparelho (marcado como pendente).
// - Quando há internet: envia as pendências (push) e baixa o que mudou no servidor (pull, em páginas),
//   usando o cursor `rev` devolvido pela API. Conflito = a edição mais recente vence.
// - Também atualiza a lista de profissionais da clínica (para "Profissional responsável").
// - Dispara: ao entrar, ao voltar a internet, ao reabrir o app, após cada alteração local e a cada 60 s.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { api, ApiError } from '../services/api';
import type { ApiMember, SyncBase, SyncChanges } from '../services/apiTypes';
import type { ISyncTableRepository, LocalRecord } from '../database/repositories/types';

const CURSOR_KEY = 'sync.lastPulledRev';
const LAST_SYNC_KEY = 'sync.lastSyncAt';
const MEMBERS_KEY = 'clinic.members';
const INTERVAL_MS = 60_000;
const DEBOUNCE_MS = 800;
const MAX_PULL_PAGES = 50;

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

interface SyncContextValue {
  state: SyncState;
  pending: number;
  lastSyncAt: string | null;
  lastError: string | null;
  /** Profissionais da clínica (cache local, atualizado a cada sync). */
  members: ApiMember[];
  /** Sincroniza agora (se já estiver sincronizando, roda de novo no fim). */
  syncNow(): Promise<void>;
  /** Pede uma sincronização em breve (agrupa várias alterações seguidas). */
  requestSync(): void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync deve ser usado dentro de <SyncProvider>');
  return ctx;
}

function toWire<T extends SyncBase>({ clinicId: _c, dirty: _d, ...rest }: LocalRecord<T>): T {
  return rest as unknown as T;
}

type Kind = keyof SyncChanges;
type AnyRepo = ISyncTableRepository<any, any>;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { patientRepo, serviceRepo, evolutionRepo, appointmentRepo, syncStateRepo } = useDatabase();
  const { status, clinic } = useAuth();
  const clinicId = status === 'signedIn' ? (clinic?.id ?? null) : null;

  const repos = useMemo<Record<Kind, AnyRepo>>(
    // Ordem importa no push: pacientes antes das evoluções que apontam para eles.
    () => ({ patients: patientRepo, services: serviceRepo, evolutions: evolutionRepo, appointments: appointmentRepo }),
    [patientRepo, serviceRepo, evolutionRepo, appointmentRepo]
  );

  const [state, setState] = useState<SyncState>('idle');
  const [pending, setPending] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [members, setMembers] = useState<ApiMember[]>([]);
  const running = useRef(false);
  const again = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPending = useCallback(async () => {
    if (!clinicId) return;
    const counts = await Promise.all(Object.values(repos).map((r) => r.countDirty(clinicId)));
    setPending(counts.reduce((a, b) => a + b, 0));
  }, [clinicId, repos]);

  const runOnce = useCallback(async () => {
    if (!clinicId) return;
    let cursor = Number((await syncStateRepo.get(CURSOR_KEY)) ?? '0');
    const kinds = Object.keys(repos) as Kind[];

    // Push: todas as pendências numa chamada (a API aceita até 500 por tipo).
    const dirty = {} as Record<Kind, LocalRecord<SyncBase>[]>;
    for (const k of kinds) dirty[k] = (await repos[k].listDirty(clinicId)).slice(0, 500);
    let changes = {} as SyncChanges;
    for (const k of kinds) (changes as Record<Kind, SyncBase[]>)[k] = dirty[k].map(toWire);

    let missing = false;
    for (let page = 0; page < MAX_PULL_PAGES; page++) {
      const res = await api.sync(cursor, changes);
      const pulledIds = new Set<string>();
      for (const k of kinds) {
        for (const remote of res.changes[k]) {
          pulledIds.add(remote.id);
          await repos[k].applyRemote(clinicId, remote);
        }
      }
      if (page === 0) {
        // Enviados ficam "em dia"; rejeitados também (a versão vencedora vem no pull).
        for (const k of kinds) for (const r of dirty[k]) await repos[k].markSynced(r.id, r.updatedAt);
      }
      missing = missing || res.rejected.some((id) => !pulledIds.has(id));
      cursor = res.rev;
      if (!res.hasMore) break;
      changes = { patients: [], services: [], evolutions: [], appointments: [] }; // próximas páginas: só pull
    }
    // Rejeitado sem a versão do servidor: a próxima sincronização refaz o pull completo.
    await syncStateRepo.set(CURSOR_KEY, String(missing ? 0 : cursor));

    try {
      const list = await api.members(clinicId);
      setMembers(list);
      await syncStateRepo.set(MEMBERS_KEY, JSON.stringify(list));
    } catch (e) {
      if (!(e instanceof ApiError && e.isNetwork)) console.warn('[sync] membros:', e);
    }

    const now = new Date().toISOString();
    await syncStateRepo.set(LAST_SYNC_KEY, now);
    setLastSyncAt(now);
    // Ainda há pendências além do lote de 500: roda de novo.
    for (const k of kinds) if ((await repos[k].countDirty(clinicId)) > 0 && dirty[k].length === 500) again.current = true;
  }, [clinicId, repos, syncStateRepo]);

  const syncNow = useCallback(async () => {
    if (!clinicId) return;
    if (running.current) {
      again.current = true; // houve mudança durante o sync: roda de novo no fim
      return;
    }
    running.current = true;
    setState('syncing');
    try {
      do {
        again.current = false;
        await runOnce();
      } while (again.current);
      setLastError(null);
      setState('idle');
    } catch (e) {
      const offline = e instanceof ApiError && e.isNetwork;
      setState(offline ? 'offline' : 'error');
      setLastError(e instanceof Error ? e.message : String(e));
      if (!offline) console.warn('[sync] falhou:', e);
    } finally {
      running.current = false;
      await refreshPending();
    }
  }, [clinicId, runOnce, refreshPending]);

  const requestSync = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      syncNow().catch(() => {});
    }, DEBOUNCE_MS);
  }, [syncNow]);

  // Estado inicial + gatilhos.
  useEffect(() => {
    if (!clinicId) {
      setPending(0);
      setLastSyncAt(null);
      setMembers([]);
      setState('idle');
      return;
    }
    syncStateRepo.get(LAST_SYNC_KEY).then(setLastSyncAt);
    syncStateRepo.get(MEMBERS_KEY).then((raw) => {
      if (raw) setMembers(JSON.parse(raw));
    });
    refreshPending();
    syncNow();

    const unsubs = Object.values(repos).map((r) => r.subscribe(() => refreshPending()));
    const unsubNet = NetInfo.addEventListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) requestSync();
      else setState((prev) => (prev === 'syncing' ? prev : 'offline'));
    });
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') requestSync();
    });
    const interval = setInterval(() => {
      syncNow().catch(() => {});
    }, INTERVAL_MS);

    return () => {
      unsubs.forEach((u) => u());
      unsubNet();
      appSub.remove();
      clearInterval(interval);
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [clinicId, repos, syncStateRepo, refreshPending, syncNow, requestSync]);

  const value = useMemo<SyncContextValue>(
    () => ({ state, pending, lastSyncAt, lastError, members, syncNow, requestSync }),
    [state, pending, lastSyncAt, lastError, members, syncNow, requestSync]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
