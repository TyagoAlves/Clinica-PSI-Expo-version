// src/utils/format.ts
// Datas, horários, iniciais do nome e a lista de serviços.
// Convenção: na API/banco as datas da agenda são ISO (AAAA-MM-DD); na tela, DD/MM/AAAA.

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local → AAAA-MM-DD (sem fuso: usa o dia do aparelho). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  return toIsoDate(dt);
}

/** AAAA-MM-DD → DD/MM/AAAA */
export function isoToBr(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** DD/MM/AAAA → AAAA-MM-DD (ou null se inválida). */
export function brToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (dt.getDate() !== Number(d) || dt.getMonth() !== Number(mo) - 1) return null;
  return `${y}-${mo}-${d}`;
}

/** "Hoje · 10/11/2026" ou "Quarta-feira · 11/11/2026" (navegação da Agenda). */
export function dayTitle(iso: string): string {
  const br = isoToBr(iso);
  if (iso === todayIso()) return `Hoje · ${br}`;
  const [y, m, d] = iso.split('-').map(Number);
  const wd = new Date(y!, m! - 1, d!).toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} · ${br}`;
}

export const TIME_HM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "14:00" + 50 min → "14:50" */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h! * 60 + m! + minutes) % (24 * 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

/** Hoje em DD/MM/AAAA. */
export function hojeBr(): string {
  return isoToBr(todayIso());
}

/** "Ana Maria Souza" → "AS" (bolinha com as iniciais). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** Serviços que a clínica oferece (opções do campo "Serviço" do paciente e da sessão). */
export const SERVICOS = ['Psicoterapia', 'Avaliação', 'Acompanhamento'];
