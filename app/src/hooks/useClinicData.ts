// src/hooks/useClinicData.ts
// Lê dados da clínica logada do SQLite local e recarrega quando a tabela muda (edição ou sync).
import { useCallback, useEffect, useState } from 'react';
import { useDatabase } from '../database/DatabaseProvider';
import { useAuth } from '../auth/AuthProvider';
import { useSync } from '../sync/SyncProvider';
import type { ISyncTableRepository, ListFilter, LocalRecord } from '../database/repositories/types';
import type { SyncBase } from '../services/apiTypes';

/** Lista reativa de uma tabela local da clínica. */
export function useLocalList<T extends SyncBase>(repo: ISyncTableRepository<T, any>, filter?: ListFilter) {
  const { clinic } = useAuth();
  const clinicId = clinic?.id ?? '';
  const [items, setItems] = useState<LocalRecord<T>[]>([]);
  const [loaded, setLoaded] = useState(false);
  const key = JSON.stringify(filter ?? {});

  const load = useCallback(async () => {
    try {
      setItems(await repo.list(clinicId, filter));
    } catch (e) {
      console.warn('[dados] erro ao ler do aparelho:', e);
    } finally {
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, clinicId, key]);

  useEffect(() => {
    load();
    return repo.subscribe(load);
  }, [load, repo]);

  return { items, loaded, reload: load };
}

/** Nomes do catálogo de serviços e dos profissionais, para os seletores do formulário. */
export function useCatalogs() {
  const { serviceRepo } = useDatabase();
  const { user } = useAuth();
  const { members } = useSync();
  const { items: services } = useLocalList(serviceRepo);
  const professionals = members.length > 0 ? members.map((m) => m.name) : user ? [user.name] : [];
  // Só serviços ativos aparecem nos formulários (inativos continuam no histórico).
  const ativos = services.filter((s) => s.active !== false);
  return { services: ativos.map((s) => s.name), serviceList: ativos, professionals };
}
