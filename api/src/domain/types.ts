// Tipos de domínio da API.
// IDs são UUID (texto), gerados pela API.

export type UserRole = 'psychologist' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  crp: string | null;
  role: UserRole;
  clinicId: string | null;
  createdAt: string;
}

/** Usuário como sai da API: nunca expõe hash/salt. */
export type PublicUser = Omit<User, 'passwordHash' | 'salt'>;

export interface Clinic {
  id: string;
  name: string;
  /** Sigla de até 3 letras (aparece no menu lateral). */
  acronym: string | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos comuns de pacientes e sessões. */
export interface BaseRecord {
  id: string;
  clinicId: string;
  createdAt: string;
  /** Momento da última edição (ISO). */
  updatedAt: string;
  /** Exclusão lógica: preenchido quando o registro é apagado. */
  deletedAt: string | null;
}

/** Campos de um paciente (o que o formulário "Novo paciente" coleta). */
export interface PatientFields {
  name: string;
  /** Ex.: Psicoterapia, Avaliação. */
  service: string | null;
  /** Início do tratamento (DD/MM/AAAA). */
  treatmentStart: string | null;
  /** Descrição / queixa principal (cifrada no banco). */
  complaint: string | null;
}
export interface Patient extends BaseRecord, PatientFields {}

/** Sessão da agenda. */
export interface AppointmentFields {
  patientId: string;
  /** Data ISO (AAAA-MM-DD) — ordenável e consultável por intervalo. */
  date: string;
  /** Hora de início (HH:MM). */
  time: string;
  durationMin: number;
  service: string | null;
  /** Observações da sessão (cifradas no banco). */
  notes: string | null;
}
export interface Appointment extends BaseRecord, AppointmentFields {}

export type NewUser = Omit<User, 'id' | 'createdAt'>;

export interface Session {
  userId: string;
  expiresAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  /** Offset da próxima página, ou null se acabou. */
  nextOffset: number | null;
}
