// Schemas de entrada (zod) — mesmas regras e mensagens das telas do app.
import { z } from 'zod';
import { APPOINTMENT_STATUSES, PATIENT_STATUSES } from '../domain/types.js';

/** Texto opcional: '' / null / ausente viram null. */
const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const DATE_BR = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const optionalDateBr = (message: string) =>
  optionalText(10).refine((v) => v === null || DATE_BR.test(v), message);

const optionalEmail = optionalText(80).refine(
  (v) => v === null || z.string().email().safeParse(v).success,
  'Informe um e-mail válido.'
);

export const CRP_REGEX = /^(CRP\s*)?\d{2}\s*\/\s*\d{3,6}$/i;
export const CNPJ_REGEX = /^(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{11}|\d{14})$/;

export const RegisterSchema = z.object({
  name: z.string({ required_error: 'Informe o nome.' }).trim().min(1, 'Informe o nome.').max(120),
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().email('Informe um e-mail válido.').max(80),
  password: z
    .string({ required_error: 'A senha precisa de ao menos 6 caracteres.' })
    .min(6, 'A senha precisa de ao menos 6 caracteres.')
    .max(128),
  crp: optionalText(20).refine((v) => v === null || CRP_REGEX.test(v), 'CRP no formato CRP 06/00000, ex.: CRP 06/123456.'),
  role: z.enum(['psychologist', 'admin']).optional(),
});

export const LoginSchema = z.object({
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().email('Informe um e-mail válido.'),
  password: z.string({ required_error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(128),
});

const ClinicFields = {
  name: z.string({ required_error: 'Informe o nome da clínica.' }).trim().min(1, 'Informe o nome da clínica.').max(120),
  unit: optionalText(64),
  technicalResponsible: optionalText(80),
  cnpj: optionalText(18).refine((v) => v === null || CNPJ_REGEX.test(v), 'CNPJ no formato 00.000.000/0001-90.'),
  phone: optionalText(20),
  email: optionalEmail,
  address: optionalText(160),
  acronym: optionalText(3).transform((v) => (v ? v.toUpperCase() : null)),
};

export const CreateClinicSchema = z.object(ClinicFields);
export const UpdateClinicSchema = z.object(ClinicFields).partial();

export const PatientFieldsSchema = z.object({
  name: z.string({ required_error: 'Informe o nome completo.' }).trim().min(1, 'Informe o nome completo.').max(120),
  phone: optionalText(20),
  email: optionalEmail,
  birthDate: optionalDateBr('Nascimento no formato DD/MM/AAAA.'),
  document: optionalText(30),
  service: optionalText(80),
  treatmentStart: optionalDateBr('Início do tratamento no formato DD/MM/AAAA.'),
  status: z.enum(PATIENT_STATUSES).default('Em tratamento'),
  professional: optionalText(120),
  address: optionalText(200),
  guardian: optionalText(120),
  complaint: optionalText(4000),
  notes: optionalText(4000),
});

/** Regras de negócio do cadastro (iguais ao modal do app): telefone e serviço obrigatórios. */
export const CreatePatientSchema = PatientFieldsSchema.superRefine((p, ctx) => {
  if (!p.phone) ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Informe um telefone de contato.' });
  if (!p.service) ctx.addIssue({ code: 'custom', path: ['service'], message: 'Selecione o serviço.' });
});

export const UpdatePatientSchema = PatientFieldsSchema.extend({ status: z.enum(PATIENT_STATUSES) }).partial();

export const ServiceSchema = z.object({
  name: z.string({ required_error: 'Informe o nome do serviço.' }).trim().min(1, 'Informe o nome do serviço.').max(80),
  description: optionalText(200),
  durationMin: z
    .number({ invalid_type_error: 'Duração em minutos.' })
    .int('Duração em minutos inteiros.')
    .min(5, 'Duração mínima de 5 minutos.')
    .max(480, 'Duração máxima de 8 horas.')
    .nullish()
    .transform((v) => v ?? null),
  priceCents: z
    .number({ invalid_type_error: 'Preço inválido.' })
    .int('Preço em centavos.')
    .min(0, 'Preço não pode ser negativo.')
    .max(100_000_00, 'Preço acima do permitido.')
    .nullish()
    .transform((v) => v ?? null),
  active: z.boolean().default(true),
});
export const UpdateServiceSchema = ServiceSchema.extend({ active: z.boolean() }).partial();

const DATE_ISO = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const AppointmentFieldsSchema = z.object({
  patientId: z.string({ required_error: 'Selecione o paciente.' }).uuid('Selecione o paciente.'),
  date: z.string({ required_error: 'Informe a data.' }).regex(DATE_ISO, 'Data no formato AAAA-MM-DD.'),
  time: z.string({ required_error: 'Informe o horário.' }).regex(TIME_HM, 'Horário no formato HH:MM.'),
  durationMin: z.number().int().min(5, 'Duração mínima de 5 minutos.').max(480, 'Duração máxima de 8 horas.'),
  service: optionalText(80),
  professional: optionalText(120),
  status: z.enum(APPOINTMENT_STATUSES).default('Agendada'),
  notes: optionalText(4000),
});
export const UpdateAppointmentSchema = AppointmentFieldsSchema.extend({ status: z.enum(APPOINTMENT_STATUSES) }).partial();

export const AppointmentRangeSchema = z.object({
  from: z.string().regex(DATE_ISO, 'from no formato AAAA-MM-DD.').optional(),
  to: z.string().regex(DATE_ISO, 'to no formato AAAA-MM-DD.').optional(),
  patientId: z.string().uuid('patientId inválido.').optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome.').max(120),
    crp: optionalText(20).refine((v) => v === null || CRP_REGEX.test(v), 'CRP no formato CRP 06/00000, ex.: CRP 06/123456.'),
  })
  .partial();

export const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Informe a senha atual.' }).min(1, 'Informe a senha atual.'),
  newPassword: z
    .string({ required_error: 'A nova senha precisa de ao menos 6 caracteres.' })
    .min(6, 'A nova senha precisa de ao menos 6 caracteres.')
    .max(128),
});

const requiredDateBr = (message: string) => z.string({ required_error: message }).trim().regex(DATE_BR, message);

export const EvolutionCreateSchema = z.object({
  sessionDate: requiredDateBr('Data da sessão no formato DD/MM/AAAA.'),
  content: z.string({ required_error: 'Escreva a evolução.' }).trim().min(1, 'Escreva a evolução.').max(20000),
});
export const EvolutionUpdateSchema = EvolutionCreateSchema.partial();

/** Paginação: ?limit=50&offset=0&search=ana */
export const PageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(80).optional(),
});

const isoDate = z.string().datetime({ offset: true, message: 'Data ISO 8601 inválida.' });
const syncBase = {
  id: z.string().uuid('ID precisa ser UUID.'),
  createdAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.nullish().transform((v) => v ?? null),
};
const MAX_PUSH = 500;

export const SyncSchema = z.object({
  lastPulledRev: z.number().int().min(0).default(0),
  changes: z
    .object({
      patients: z
        .array(PatientFieldsSchema.extend(syncBase))
        .max(MAX_PUSH, `Envie no máximo ${MAX_PUSH} pacientes por sincronização.`)
        .default([]),
      services: z.array(ServiceSchema.extend(syncBase)).max(MAX_PUSH).default([]),
      evolutions: z
        .array(
          EvolutionCreateSchema.extend({
            ...syncBase,
            patientId: z.string().uuid('ID de paciente precisa ser UUID.'),
            authorId: z.string().uuid().nullish().transform((v) => v ?? null),
            authorName: optionalText(120),
          })
        )
        .max(MAX_PUSH)
        .default([]),
      appointments: z.array(AppointmentFieldsSchema.extend(syncBase)).max(MAX_PUSH).default([]),
    })
    .default({}),
});
