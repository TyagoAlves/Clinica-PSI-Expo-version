// Interfaces dos repositórios: o que cada um sabe fazer no banco.
// Implementação: PostgreSQL/Supabase (src/repositories/postgres.ts).
import type { Appointment, BaseRecord, Clinic, NewUser, Page, Patient, Session, User } from '../domain/types.js';

export interface IUserRepository {
  create(data: NewUser): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  updateClinicId(id: string, clinicId: string): Promise<void>;
}

export interface IClinicRepository {
  create(data: { name: string; acronym: string | null }, ownerUserId: string): Promise<Clinic>;
  findById(id: string): Promise<Clinic | null>;
}

export interface ISessionRepository {
  create(tokenHash: string, userId: string, expiresAt: string): Promise<void>;
  find(tokenHash: string): Promise<Session | null>;
  delete(tokenHash: string): Promise<void>;
  deleteExpired(nowIso: string): Promise<number>;
}

export interface ListOptions {
  limit: number;
  offset: number;
  /** Busca por nome (contém, sem diferenciar maiúsculas). */
  search?: string;
  /** Intervalo inclusivo em um campo (ex.: datas AAAA-MM-DD da agenda). */
  range?: { key: string; from?: string; to?: string };
}

/** Repositório genérico de pacientes e sessões. */
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
  appointments: IRecordRepository<Appointment>;
}
