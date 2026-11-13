// Interfaces dos repositórios: o que cada um sabe fazer no banco.
// Implementação: PostgreSQL/Supabase (src/repositories/postgres.ts).
import type {
  Appointment,
  Clinic,
  Evolution,
  Member,
  NewClinic,
  NewUser,
  Page,
  Patient,
  Service,
  Session,
  BaseRecord,
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

/** Repositório de pacientes, serviços, evoluções e sessões. */
export interface IRecordRepository<T extends BaseRecord> {
  /** Insere ou substitui (upsert). */
  save(data: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  /** Ativos (sem deletedAt) da clínica, paginados. */
  list(clinicId: string, opts: ListOptions): Promise<Page<T>>;
}

export interface Repositories {
  users: IUserRepository;
  clinics: IClinicRepository;
  sessions: ISessionRepository;
  patients: IRecordRepository<Patient>;
  services: IRecordRepository<Service>;
  evolutions: IRecordRepository<Evolution>;
  appointments: IRecordRepository<Appointment>;
}
