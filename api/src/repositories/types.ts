// Interfaces dos repositórios ("padrão conector", igual ao app).
// Implementação atual: SQLite (src/repositories/sqlite.ts). Trocar de banco = nova classe
// que implementa as mesmas interfaces, sem mexer em services nem rotas.
import type {
  Appointment,
  AuditEntry,
  Clinic,
  Evolution,
  Member,
  NewClinic,
  NewUser,
  Page,
  Patient,
  Service,
  Session,
  SyncRecord,
  User,
} from '../domain/types.js';

export interface IUserRepository {
  create(data: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateClinicId(id: string, clinicId: string): Promise<void>;
  updateProfile(id: string, data: { name?: string; crp?: string | null }): Promise<void>;
  updatePassword(id: string, passwordHash: string, salt: string): Promise<void>;
  listMembers(clinicId: string): Promise<Member[]>;
}

export interface IClinicRepository {
  create(data: NewClinic, ownerUserId: string): Promise<Clinic>;
  findById(id: string): Promise<Clinic | null>;
  update(id: string, data: Partial<NewClinic>): Promise<Clinic | null>;
}

export interface ISessionRepository {
  create(tokenHash: string, userId: string, expiresAt: string): Promise<void>;
  find(tokenHash: string): Promise<Session | null>;
  delete(tokenHash: string): Promise<void>;
  /** Revoga todas as sessões do usuário, menos a atual (troca de senha). */
  deleteOthers(userId: string, keepTokenHash: string): Promise<number>;
  deleteExpired(nowIso: string): Promise<number>;
}

export interface ListOptions {
  limit: number;
  offset: number;
  /** Filtro por igualdade em campo do registro (ex.: { patientId }). */
  where?: Record<string, string>;
  /** Busca por nome (contém, sem diferenciar maiúsculas). */
  search?: string;
  /** Intervalo inclusivo em um campo (ex.: datas AAAA-MM-DD da agenda). */
  range?: { key: string; from?: string; to?: string };
}

/** Repositório de entidade sincronizável (pacientes, serviços, evoluções). */
export interface ISyncRepository<T extends SyncRecord> {
  /** Insere ou substitui (upsert) e atribui nova revisão. */
  save(data: Omit<T, 'rev'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  /** Ativos (sem deletedAt) da clínica, paginados. */
  list(clinicId: string, opts: ListOptions): Promise<Page<T>>;
  /** Até `limit` registros (inclusive removidos) com rev > sinceRev, em ordem de rev. */
  changedSince(clinicId: string, sinceRev: number, limit: number): Promise<T[]>;
  /** Todos os ids cujo valor cifrado não usa a chave atual (rotação). */
  reencryptAll?(): Promise<number>;
}

export interface IAuditRepository {
  record(entry: Omit<AuditEntry, 'id' | 'at'>): Promise<void>;
  list(clinicId: string, limit: number, offset: number): Promise<Page<AuditEntry>>;
}

export interface IMetaRepository {
  currentRev(): Promise<number>;
}

export interface Repositories {
  users: IUserRepository;
  clinics: IClinicRepository;
  sessions: ISessionRepository;
  patients: ISyncRepository<Patient>;
  services: ISyncRepository<Service>;
  evolutions: ISyncRepository<Evolution>;
  appointments: ISyncRepository<Appointment>;
  audit: IAuditRepository;
  meta: IMetaRepository;
}
