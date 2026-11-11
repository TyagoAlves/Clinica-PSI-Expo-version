// src/services/apiTypes.ts
// Espelho dos tipos da clinica-api (clinica-api/src/domain/types.ts). Mantenha os dois em sincronia.

export type UserRole = 'psychologist' | 'admin';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  crp: string | null;
  role: UserRole;
  clinicId: string | null;
  createdAt: string;
}

export interface ApiClinic {
  id: string;
  name: string;
  unit: string | null;
  technicalResponsible: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  acronym: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PATIENT_STATUSES = ['Em tratamento', 'Pausado', 'Alta'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export interface PatientFields {
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  document: string | null;
  service: string | null;
  treatmentStart: string | null;
  status: PatientStatus;
  professional: string | null;
  address: string | null;
  guardian: string | null;
  complaint: string | null;
  notes: string | null;
}

/** Paciente como trafega na sincronização. */
export interface SyncPatient extends PatientFields {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApiPatient extends SyncPatient {
  clinicId: string;
  rev: number;
}

/** Base de toda entidade sincronizável. */
export interface SyncBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ServiceFields {
  name: string;
  description: string | null;
  durationMin: number | null;
  /** Centavos (R$ 150,00 = 15000). */
  priceCents: number | null;
  active: boolean;
}
export interface SyncService extends SyncBase, ServiceFields {}

export const APPOINTMENT_STATUSES = ['Agendada', 'Realizada', 'Cancelada', 'Faltou'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export interface AppointmentFields {
  patientId: string;
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  durationMin: number;
  service: string | null;
  professional: string | null;
  status: AppointmentStatus;
  notes: string | null;
}
export interface SyncAppointment extends SyncBase, AppointmentFields {}

export interface EvolutionFields {
  patientId: string;
  /** DD/MM/AAAA */
  sessionDate: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
}
export interface SyncEvolution extends SyncBase, EvolutionFields {}

export interface ApiMember {
  id: string;
  name: string;
  crp: string | null;
  role: UserRole;
}

export interface SyncChanges {
  patients: SyncPatient[];
  services: SyncService[];
  evolutions: SyncEvolution[];
  appointments: SyncAppointment[];
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
  expiresAt: string;
  clinic?: ApiClinic | null;
}

export interface MeResponse {
  user: ApiUser;
  clinic: ApiClinic | null;
}

export interface SyncResponse {
  rev: number;
  /** Ainda há mudanças para baixar: chamar de novo com `rev`. */
  hasMore: boolean;
  changes: SyncChanges;
  rejected: string[];
}

export type NewClinicInput = {
  name: string;
  unit?: string | null;
  technicalResponsible?: string | null;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  acronym?: string | null;
};
