// src/services/patientForm.ts
// Conversão entre o formulário do modal (strings em português) e os campos do paciente.
import type { NovoPacientePayload } from '../componentes/NovoPacienteModal';
import { PATIENT_STATUSES, type PatientFields, type PatientStatus } from './apiTypes';

const toNull = (v: string) => (v.trim() ? v.trim() : null);

export function payloadToFields(p: NovoPacientePayload, notes: string | null = null): PatientFields {
  return {
    name: p.nome.trim(),
    phone: toNull(p.telefone),
    email: toNull(p.email),
    birthDate: toNull(p.nascimento),
    document: toNull(p.documento),
    service: toNull(p.servico),
    treatmentStart: toNull(p.inicio),
    status: (PATIENT_STATUSES as readonly string[]).includes(p.situacao)
      ? (p.situacao as PatientStatus)
      : 'Em tratamento',
    professional: toNull(p.profissional),
    address: toNull(p.endereco),
    guardian: toNull(p.responsavel),
    complaint: toNull(p.descricao),
    notes,
  };
}

export function fieldsToPayload(f: PatientFields): NovoPacientePayload {
  return {
    nome: f.name,
    telefone: f.phone ?? '',
    email: f.email ?? '',
    nascimento: f.birthDate ?? '',
    documento: f.document ?? '',
    servico: f.service ?? '',
    inicio: f.treatmentStart ?? '',
    situacao: f.status,
    profissional: f.professional ?? '',
    endereco: f.address ?? '',
    responsavel: f.guardian ?? '',
    descricao: f.complaint ?? '',
  };
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** Hoje em DD/MM/AAAA. */
export function hojeBr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export const DATE_BR = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
