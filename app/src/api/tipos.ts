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
  acronym: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos que todo registro devolvido pela API tem. */
export interface RecordBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PatientFields {
  name: string;
  /** Ex.: Psicoterapia, Avaliação. */
  service: string | null;
  /** Início do tratamento (DD/MM/AAAA). */
  treatmentStart: string | null;
  /** Descrição / queixa principal. */
  complaint: string | null;
}
export interface Patient extends RecordBase, PatientFields {}

export interface AppointmentFields {
  patientId: string;
  /** AAAA-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  durationMin: number;
  service: string | null;
  notes: string | null;
}
export interface Appointment extends RecordBase, AppointmentFields {}

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
