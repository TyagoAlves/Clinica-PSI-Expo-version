// Validação e normalização de dados brasileiros (mesmas regras das máscaras do app,
// app/src/services/masks.ts). A API é a última barreira: o banco só recebe dado limpo.

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** CPF com dígitos verificadores corretos (aceita com ou sem pontuação). */
export function isValidCpf(text: string): boolean {
  const d = onlyDigits(text);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

/** CNPJ com dígitos verificadores corretos. */
export function isValidCnpj(text: string): boolean {
  const d = onlyDigits(text);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: 12 | 13) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Telefone BR: 10 dígitos (fixo) ou 11 (celular, começa com 9 após o DDD); DDD 11–99. */
export function isValidPhone(text: string): boolean {
  const d = onlyDigits(text);
  if (d.length !== 10 && d.length !== 11) return false;
  if (Number(d.slice(0, 2)) < 11) return false;
  return d.length === 10 || d[2] === '9';
}

/** DD/MM/AAAA que existe no calendário (rejeita 31/02) e ano >= 1900. */
export function isRealDateBr(br: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return false;
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  return dt.getUTCFullYear() === yyyy && dt.getUTCMonth() === mm - 1 && dt.getUTCDate() === dd && yyyy >= 1900;
}

/** DD/MM/AAAA não posterior a hoje (com 1 dia de folga por fuso). */
export function isNotFutureBr(br: string): boolean {
  const [dd, mm, yyyy] = br.split('/').map(Number);
  return Date.UTC(yyyy!, mm! - 1, dd!) <= Date.now() + 86_400_000;
}

/** "crp 6/12345", "06/123456", "CRP 06 / 123456" → "CRP 06/123456" (ou null se não reconhecer). */
export function normalizeCrp(text: string): string | null {
  const m = /^(?:CRP\s*)?(\d{1,2})\s*\/\s*(\d{3,6})$/i.exec(text.trim()) ?? /^(\d{2})(\d{3,6})$/.exec(onlyDigits(text));
  if (!m) return null;
  return `CRP ${m[1]!.padStart(2, '0')}/${m[2]}`;
}

/** Nome de pessoa: letras (com acento), espaço, apóstrofo, hífen e ponto. */
export const PERSON_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'.\-]*$/;

/** Colapsa espaços repetidos. */
export const collapseSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
