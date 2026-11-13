// src/api/tipos.ts
// Espelho dos tipos da API (api/src/domain/types.ts). Se mudar um, mude o outro.

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

/** Campos que todo registro devolvido pela API tem. */
export interface RecordBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Patient extends RecordBase, PatientFields {}

export interface ServiceFields {
  name: string;
  description: string | null;
  durationMin: number | null;
  /** Centavos (R$ 150,00 = 15000). */
  priceCents: number | null;
  active: boolean;
}
export interface Service extends RecordBase, ServiceFields {}

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
export interface Appointment extends RecordBase, AppointmentFields {}

export interface EvolutionFields {
  patientId: string;
  /** DD/MM/AAAA */
  sessionDate: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
}
export interface Evolution extends RecordBase, EvolutionFields {}

export interface ApiMember {
  id: string;
  name: string;
  crp: string | null;
  role: UserRole;
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
