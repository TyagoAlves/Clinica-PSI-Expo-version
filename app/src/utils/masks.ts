// src/utils/masks.ts
// Máscaras aplicadas ENQUANTO o usuário digita (onChangeText). Cada função recebe o texto
// bruto do campo e devolve o texto já limpo e formatado. A API confere de novo antes de
// gravar — ver api/src/routes/schemas.ts.

const digits = (s: string) => s.replace(/\D/g, '');

/** Data: "10112026" → "10/11/2026" */
export function maskDate(text: string): string {
  const d = digits(text).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Hora: "1430" → "14:30" */
export function maskTime(text: string): string {
  const d = digits(text).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Nomes de pessoa: só letras (com acento), espaço, apóstrofo, hífen e ponto. Sem espaços duplos. */
export function maskName(text: string): string {
  // Faixas explícitas de letras (com acentos do português) — compatível com o Hermes.
  return text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'.\-]/g, '').replace(/\s{2,}/g, ' ').replace(/^\s+/, '');
}

/** E-mail: sem espaços, minúsculo. */
export function maskEmail(text: string): string {
  return text.replace(/\s/g, '').toLowerCase();
}

/** Só números inteiros (ex.: duração em minutos). */
export function maskInteger(text: string, maxLen = 3): string {
  return digits(text).slice(0, maxLen);
}

/** Data DD/MM/AAAA que existe no calendário (rejeita 31/02). */
export function isRealDate(br: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return false;
  const [, dd, mm, yyyy] = m.map(Number) as [number, number, number, number];
  const dt = new Date(yyyy, mm - 1, dd);
  return dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd && yyyy >= 1900;
}
