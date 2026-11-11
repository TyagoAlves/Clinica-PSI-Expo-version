// src/services/format.ts
// Datas e dinheiro. Convenção: na API/banco datas de agenda são ISO (AAAA-MM-DD);
// na tela, DD/MM/AAAA. Dinheiro é guardado em centavos (inteiro).

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

/** 15000 → "R$ 150" · 9990 → "R$ 99,90" */
export function formatPrice(cents: number | null): string {
  if (cents === null) return '—';
  const reais = cents / 100;
  return Number.isInteger(reais)
    ? `R$ ${reais}`
    : `R$ ${reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "150" · "99,90" · "R$ 1.200,50" → centavos (ou null se vazio/ inválido). */
export function parsePriceToCents(text: string): number | null {
  const clean = text.replace(/[R$\s.]/g, '').replace(',', '.');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}

/** Centavos → texto editável ("150" ou "99,90"). */
export function centsToInput(cents: number | null): string {
  if (cents === null) return '';
  const reais = cents / 100;
  return Number.isInteger(reais) ? String(reais) : reais.toFixed(2).replace('.', ',');
}
