// Schemas de entrada (zod) — mesmas regras e mensagens das telas do app.
import { z } from 'zod';
import { APPOINTMENT_STATUSES, PATIENT_STATUSES } from '../domain/types.js';
import {
  collapseSpaces,
  isNotFutureBr,
  isRealDateBr,
  isValidCnpj,
  isValidCpf,
  isValidPhone,
  normalizeCrp,
  onlyDigits,
  PERSON_NAME,
} from '../domain/validators.js';

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

/** E-mail: guardado em minúsculas. */
const optionalEmail = optionalText(80)
  .transform((v) => (v ? v.toLowerCase() : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, 'Informe um e-mail válido.');

/** Telefone: validado e guardado SÓ com dígitos (o app formata na tela). */
const optionalPhone = optionalText(20)
  .refine((v) => v === null || isValidPhone(v), 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).')
  .transform((v) => (v ? onlyDigits(v) : null));

/** CRP: aceita variações e guarda no formato padrão "CRP 06/123456". */
const optionalCrp = optionalText(20)
  .refine((v) => v === null || normalizeCrp(v) !== null, 'CRP no formato CRP 06/00000, ex.: CRP 06/123456.')
  .transform((v) => (v ? normalizeCrp(v) : null));

/** Nome de pessoa: só letras (com acento), espaço, apóstrofo, hífen e ponto; espaços colapsados. */
const personName = (required: string) =>
  z
    .string({ required_error: required })
    .transform(collapseSpaces)
    .pipe(z.string().min(1, required).max(120).regex(PERSON_NAME, 'O nome deve ter só letras.'));
const optionalPersonName = optionalText(120)
  .transform((v) => (v ? collapseSpaces(v) : null))
  .refine((v) => v === null || PERSON_NAME.test(v), 'O nome deve ter só letras.');

/** Documento do paciente: CPF (validado, guardado só com dígitos) ou RG (letras/números). */
const optionalDocument = optionalText(30)
  .transform((v) => {
    if (!v) return null;
    return /^[\d.\-\s]+$/.test(v) ? onlyDigits(v) : v.toUpperCase().replace(/[^0-9A-Z]/g, '');
  })
  .refine((v) => v === null || !/^\d{11}$/.test(v) || isValidCpf(v), 'CPF inválido (dígito verificador).');

/** CNPJ ou CPF da clínica: guardado só com dígitos, com dígito verificador. */
const optionalCpfCnpj = optionalText(18)
  .transform((v) => (v ? onlyDigits(v) : null))
  .refine(
    (v) => v === null || (v.length === 11 ? isValidCpf(v) : v.length === 14 ? isValidCnpj(v) : false),
    'CNPJ ou CPF inválido (confira os números).'
  );

export const RegisterSchema = z.object({
  name: personName('Informe o nome.'),
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().toLowerCase().email('Informe um e-mail válido.').max(80),
  password: z
    .string({ required_error: 'A senha precisa de ao menos 6 caracteres.' })
    .min(6, 'A senha precisa de ao menos 6 caracteres.')
    .max(128),
  crp: optionalCrp,
  role: z.enum(['psychologist', 'admin']).optional(),
});

export const LoginSchema = z.object({
  email: z.string({ required_error: 'Informe um e-mail válido.' }).trim().email('Informe um e-mail válido.'),
  password: z.string({ required_error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(128),
});

const ClinicFields = {
  name: z.string({ required_error: 'Informe o nome da clínica.' }).trim().min(1, 'Informe o nome da clínica.').max(120),
  unit: optionalText(64),
  technicalResponsible: optionalPersonName,
  cnpj: optionalCpfCnpj,
  phone: optionalPhone,
  email: optionalEmail,
  address: optionalText(160),
  acronym: optionalText(3)
    .transform((v) => (v ? v.toUpperCase() : null))
    .refine((v) => v === null || /^[A-ZÀ-ÖØ-Þ]{1,3}$/.test(v), 'A sigla deve ter até 3 letras.'),
};

export const CreateClinicSchema = z.object(ClinicFields);
export const UpdateClinicSchema = z.object(ClinicFields).partial();

export const PatientFieldsSchema = z.object({
  name: personName('Informe o nome completo.'),
  phone: optionalPhone,
  email: optionalEmail,
  birthDate: optionalDateBr('Nascimento inválido (DD/MM/AAAA).').refine(
    (v) => v === null || isNotFutureBr(v),
    'A data de nascimento não pode estar no futuro.'
  ),
  document: optionalDocument,
  service: optionalText(80),
  treatmentStart: optionalDateBr('Início do tratamento inválido (DD/MM/AAAA).'),
  status: z.enum(PATIENT_STATUSES).default('Em tratamento'),
  professional: optionalText(120),
  address: optionalText(200),
  guardian: optionalPersonName,
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
    name: personName('Informe o nome.'),
    crp: optionalCrp,
  })
  .partial();

export const ChangePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Informe a senha atual.' }).min(1, 'Informe a senha atual.'),
  newPassword: z
    .string({ required_error: 'A nova senha precisa de ao menos 6 caracteres.' })
    .min(6, 'A nova senha precisa de ao menos 6 caracteres.')
    .max(128),
});

const requiredDateBr = (message: string) =>
  z.string({ required_error: message }).trim().refine((v) => isRealDateBr(v), message);

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
