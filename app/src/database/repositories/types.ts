// src/database/repositories/types.ts
import type {
  AppointmentFields,
  EvolutionFields,
  PatientFields,
  ServiceFields,
  SyncBase,
  SyncEvolution,
  SyncPatient,
  SyncService,
  SyncAppointment,
} from '../../services/apiTypes';

/** Registro local: o que veio/vai para o servidor + clínica + marca de pendência. */
export type LocalRecord<T extends SyncBase> = T & {
  clinicId: string;
  /** Tem alteração local ainda não enviada ao servidor. */
  dirty: boolean;
};

export type LocalPatient = LocalRecord<SyncPatient>;
export type LocalService = LocalRecord<SyncService>;
export type LocalEvolution = LocalRecord<SyncEvolution>;
export type LocalAppointment = LocalRecord<SyncAppointment>;

export interface ListFilter {
  /** Igualdade em campo (ex.: { patientId }). */
  where?: Record<string, string>;
  limit?: number;
  /** Intervalo inclusivo num campo (ex.: datas AAAA-MM-DD da agenda). */
  range?: { key: string; from?: string; to?: string };
}

// ===== Interface do repositório (Padrão Conector) =====

/** Repositório local de uma entidade sincronizável (pacientes, serviços, evoluções). */
export interface ISyncTableRepository<T extends SyncBase, F> {
  /** Cria no aparelho (fica pendente de envio). */
  create(clinicId: string, fields: F): Promise<LocalRecord<T>>;
  update(id: string, fields: Partial<F>): Promise<LocalRecord<T> | null>;
  /** Exclusão lógica: fica pendente de envio para propagar aos outros aparelhos. */
  softDelete(id: string): Promise<void>;
  findById(id: string): Promise<LocalRecord<T> | null>;
  /** Ativos da clínica, na ordem padrão da tabela. */
  list(clinicId: string, filter?: ListFilter): Promise<LocalRecord<T>[]>;
  listDirty(clinicId: string): Promise<LocalRecord<T>[]>;
  countDirty(clinicId: string): Promise<number>;
  /** Aplica um registro vindo do servidor (respeitando edições locais mais novas). */
  applyRemote(clinicId: string, remote: T): Promise<void>;
  /** Marca como enviado, se não foi editado de novo enquanto sincronizava. */
  markSynced(id: string, updatedAt: string): Promise<void>;
  clearAll(): Promise<void>;
  /** Avisa quando os dados mudam (para as telas recarregarem). */
  subscribe(listener: () => void): () => void;
}

export type IPatientRepository = ISyncTableRepository<SyncPatient, PatientFields>;
export type IServiceRepository = ISyncTableRepository<SyncService, ServiceFields>;
export type IEvolutionRepository = ISyncTableRepository<SyncEvolution, EvolutionFields>;
export type IAppointmentRepository = ISyncTableRepository<SyncAppointment, AppointmentFields>;

export interface ISyncStateRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  clearAll(): Promise<void>;
}
