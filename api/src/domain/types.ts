// Tipos de domínio da API.
// IDs são UUID (texto) para que o app crie registros offline sem colidir com o servidor.

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

/** Profissional da clínica (o que o app precisa para "Profissional responsável"). */
export interface Member {
  id: string;
  name: string;
  crp: string | null;
  role: UserRole;
}

export interface Clinic {
  id: string;
  name: string;
  unit: string | null;
  technicalResponsible: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  acronym: string | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Campos comuns de toda entidade sincronizável (offline-first). */
export interface SyncRecord {
  id: string;
  clinicId: string;
  createdAt: string;
  /** Momento da última edição (ISO). Resolve conflitos: a mais recente vence. */
  updatedAt: string;
  /** Soft delete: precisa propagar a exclusão para os aparelhos. */
  deletedAt: string | null;
  /** Revisão do servidor (cresce a cada escrita, em todas as tabelas). Cursor da sincronização. */
  rev: number;
}

export const PATIENT_STATUSES = ['Em tratamento', 'Pausado', 'Alta'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

/** Campos editáveis de um paciente (o que o formulário "Novo paciente" coleta). */
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

export interface Patient extends SyncRecord, PatientFields {}

/** Serviço oferecido pela clínica (alimenta o campo "Serviço" do paciente e da sessão). */
export interface ServiceFields {
  name: string;
  description: string | null;
  /** Duração padrão da sessão, em minutos. */
  durationMin: number | null;
  /** Preço em centavos (R$ 150,00 = 15000), para evitar erro de arredondamento. */
  priceCents: number | null;
  /** Serviço inativo não aparece para novos pacientes/sessões, mas continua no histórico. */
  active: boolean;
}

export const APPOINTMENT_STATUSES = ['Agendada', 'Realizada', 'Cancelada', 'Faltou'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Sessão da agenda. */
export interface AppointmentFields {
  patientId: string;
  /** Data ISO (AAAA-MM-DD) — ordenável e consultável por intervalo. */
  date: string;
  /** Hora de início (HH:MM). */
  time: string;
  durationMin: number;
  service: string | null;
  professional: string | null;
  status: AppointmentStatus;
  /** Observações da sessão (cifradas em repouso). */
  notes: string | null;
}
export interface Appointment extends SyncRecord, AppointmentFields {}
export interface Service extends SyncRecord, ServiceFields {}

/** Evolução = registro de prontuário de uma sessão. Conteúdo cifrado em repouso. */
export interface EvolutionFields {
  patientId: string;
  /** Data da sessão (DD/MM/AAAA). */
  sessionDate: string;
  content: string;
  authorId: string | null;
  authorName: string | null;
}
export interface Evolution extends SyncRecord, EvolutionFields {}

export type NewUser = Omit<User, 'id' | 'createdAt'>;
export type NewClinic = Omit<Clinic, 'id' | 'createdAt' | 'updatedAt' | 'ownerUserId'>;

export interface Session {
  userId: string;
  expiresAt: string;
}

export interface AuditEntry {
  id: number;
  at: string;
  userId: string;
  clinicId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  /** Offset da próxima página, ou null se acabou. */
  nextOffset: number | null;
}

/** Catálogo inicial de toda clínica nova (valores do mock da Tela 9). */
export const DEFAULT_SERVICES: ServiceFields[] = [
  { name: 'Psicoterapia', description: 'Sessões semanais de atendimento psicológico.', durationMin: 50, priceCents: 15000, active: true },
  { name: 'Avaliação', description: 'Avaliação psicológica e devolução inicial.', durationMin: 60, priceCents: 20000, active: true },
  { name: 'Acompanhamento', description: 'Acompanhamento breve e monitoramento.', durationMin: 50, priceCents: 12000, active: true },
];
