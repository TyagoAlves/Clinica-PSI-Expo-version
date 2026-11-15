// Schemas de entrada (zod) — mesmas regras e mensagens das telas do app.
import { z } from 'zod';
import { collapseSpaces, isRealDateBr, PERSON_NAME } from '../domain/validators.js';

/** Texto opcional: '' / null / ausente viram null. */
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Data DD/MM/AAAA que existe no calendário (rejeita 31/02). */
const optionalDateBr = (message: string) => optionalText(10).refine((v) => v === null || isRealDateBr(v), message);

/** Nome de pessoa: só letras (com acento), espaço, apóstrofo, hífen e ponto; espaços colapsados. */
const personName = (required: string) =>
  z
    .string({ required_error: required })
    .transform(collapseSpaces)
    .pipe(z.string().min(1, required).max(120).regex(PERSON_NAME, 'O nome deve ter só letras.'));

/** Nova conta: usuário + a clínica dele (criada junto). */
export const RegisterSchema = z.object({
  name: personName('Informe o nome.'),
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().toLowerCase().email('Informe um e-mail válido.').max(80),
  password: z
    .string({ required_error: 'A senha precisa de ao menos 6 caracteres.' })
    .min(6, 'A senha precisa de ao menos 6 caracteres.')
    .max(128),
  clinicName: z.string().trim().max(120).optional(),
});

export const LoginSchema = z.object({
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().email('Informe um e-mail válido.'),
  password: z.string({ required_error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(128),
});

export const PatientSchema = z.object({
  name: personName('Informe o nome completo.'),
  service: optionalText(80),
  treatmentStart: optionalDateBr('Início do tratamento inválido (DD/MM/AAAA).'),
  complaint: optionalText(4000),
});
export const UpdatePatientSchema = PatientSchema.partial();

const DATE_ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const AppointmentSchema = z.object({
  patientId: z.string({ required_error: 'Selecione o paciente.' }).uuid('Selecione o paciente.'),
  date: z.string({ required_error: 'Informe a data.' }).regex(DATE_ISO, 'Data no formato AAAA-MM-DD.'),
  time: z.string({ required_error: 'Informe o horário.' }).regex(TIME_HM, 'Horário no formato HH:MM.'),
  durationMin: z.number().int().min(5, 'Duração mínima de 5 minutos.').max(480, 'Duração máxima de 8 horas.'),
  service: optionalText(80),
  notes: optionalText(4000),
});
export const UpdateAppointmentSchema = AppointmentSchema.partial();

/** Filtros da agenda: ?from=2026-11-01&to=2026-11-30 */
export const AppointmentRangeSchema = z.object({
  from: z.string().regex(DATE_ISO, 'from no formato AAAA-MM-DD.').optional(),
  to: z.string().regex(DATE_ISO, 'to no formato AAAA-MM-DD.').optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Paginação: ?limit=50&offset=0&search=ana */
export const PageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(80).optional(),
});
