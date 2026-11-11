// src/database/DatabaseProvider.tsx
// Fornece os repositórios de dados. Desde a migração para o Supabase, NÃO há banco no aparelho:
// cada repositório lê/grava direto na API (que guarda tudo no PostgreSQL do Supabase).
// O nome "DatabaseProvider"/useDatabase foi mantido para não mexer nas telas.
import React, { createContext, useContext, useMemo } from 'react';
import { ApiTableRepo } from './repositories/ApiTableRepo';
import type {
  IAppointmentRepository,
  IEvolutionRepository,
  IPatientRepository,
  IServiceRepository,
  ISyncStateRepository,
} from './repositories/types';
import type { AppointmentFields, EvolutionFields, PatientFields, ServiceFields } from '../services/apiTypes';

interface DatabaseContextValue {
  patientRepo: IPatientRepository;
  serviceRepo: IServiceRepository;
  evolutionRepo: IEvolutionRepository;
  appointmentRepo: IAppointmentRepository;
  /** Pequeno estado em memória (ex.: cache da lista de profissionais). */
  syncStateRepo: ISyncStateRepository;
  /** Limpa caches e avisa as telas (logout). */
  wipe(): Promise<void>;
  /** Pede para todas as telas recarregarem do servidor. */
  refreshAll(): void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase deve ser usado dentro de um DatabaseProvider');
  return ctx;
};

const q = (params: Record<string, string | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&');
  return s ? `?${s}` : '';
};

class MemoryState implements ISyncStateRepository {
  private m = new Map<string, string>();
  async get(k: string) {
    return this.m.get(k) ?? null;
  }
  async set(k: string, v: string) {
    this.m.set(k, v);
  }
  async clearAll() {
    this.m.clear();
  }
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo<DatabaseContextValue>(() => {
    const patientRepo = new ApiTableRepo<any, PatientFields>({
      listPath: (c) => `/api/v1/clinics/${c}/patients`,
      createPath: (c) => `/api/v1/clinics/${c}/patients`,
      itemPath: (id) => `/api/v1/patients/${id}`,
    });
    const serviceRepo = new ApiTableRepo<any, ServiceFields>({
      listPath: (c) => `/api/v1/clinics/${c}/services`,
      createPath: (c) => `/api/v1/clinics/${c}/services`,
      itemPath: (id) => `/api/v1/services/${id}`,
    });
    const evolutionRepo = new ApiTableRepo<any, EvolutionFields>({
      // Com filtro de paciente: prontuário dele; sem filtro: últimas da clínica (Painel).
      listPath: (c, f) =>
        f.where?.patientId ? `/api/v1/patients/${f.where.patientId}/evolutions` : `/api/v1/clinics/${c}/evolutions`,
      createPath: (_c, f) => `/api/v1/patients/${f.patientId}/evolutions`,
      createBody: (f) => ({ sessionDate: f.sessionDate, content: f.content }),
      itemPath: (id) => `/api/v1/evolutions/${id}`,
      patchBody: (f) => ({ sessionDate: f.sessionDate, content: f.content }),
    });
    const appointmentRepo = new ApiTableRepo<any, AppointmentFields>({
      listPath: (c, f) =>
        `/api/v1/clinics/${c}/appointments${q({ from: f.range?.from, to: f.range?.to, patientId: f.where?.patientId })}`,
      createPath: (c) => `/api/v1/clinics/${c}/appointments`,
      itemPath: (id) => `/api/v1/appointments/${id}`,
    });
    const syncStateRepo = new MemoryState();
    const all = [patientRepo, serviceRepo, evolutionRepo, appointmentRepo];
    return {
      patientRepo,
      serviceRepo,
      evolutionRepo,
      appointmentRepo,
      syncStateRepo,
      refreshAll: () => all.forEach((r) => r.emit()),
      wipe: async () => {
        await syncStateRepo.clearAll();
        all.forEach((r) => r.emit());
      },
    };
  }, []);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};
