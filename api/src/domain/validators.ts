// Validação e normalização de textos (mesmas regras das máscaras do app,
// app/src/utils/masks.ts). A API é a última barreira: o banco só recebe dado limpo.

/** DD/MM/AAAA que existe no calendário (rejeita 31/02) e ano >= 1900. */
export function isRealDateBr(br: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return false;
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  return dt.getUTCFullYear() === yyyy && dt.getUTCMonth() === mm - 1 && dt.getUTCDate() === dd && yyyy >= 1900;
}

/** Nome de pessoa: letras (com acento), espaço, apóstrofo, hífen e ponto. */
export const PERSON_NAME = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ\s'.\-]*$/;

/** Colapsa espaços repetidos. */
export const collapseSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
