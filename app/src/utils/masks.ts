// src/utils/masks.ts
// Máscaras aplicadas ENQUANTO o usuário digita (onChangeText). Cada função recebe o texto
// bruto do campo e devolve o texto já limpo e formatado. Os dados vão para a API formatados;
// a API normaliza de novo (só dígitos para telefone/documento) — ver api/src/routes/schemas.ts.

const digits = (s: string) => s.replace(/\D/g, '');

/**
 * Telefone BR: "61900000000" → "61 9 0000-0000" (celular, 11 dígitos)
 *              "6130000000"  → "61 3000-0000"   (fixo, 10 dígitos)
 */
export function maskPhone(text: string): string {
  const d = digits(text).slice(0, 11);
  if (d.length <= 2) return d;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  // Celular: começa com 9 depois do DDD (ou já tem 11 dígitos).
  if (rest[0] === '9' || d.length === 11) {
    if (rest.length <= 1) return `${ddd} ${rest}`;
    if (rest.length <= 5) return `${ddd} ${rest[0]} ${rest.slice(1)}`;
    return `${ddd} ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5)}`;
  }
  if (rest.length <= 4) return `${ddd} ${rest}`;
  return `${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

/** CPF: "12345678909" → "123.456.789-09" */
export function maskCpf(text: string): string {
  const d = digits(text).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Documento do paciente ("CPF ou RG"): só números → CPF formatado.
 * Se tiver letra (RG com dígito "X"), mantém letras/números/ponto/traço, em maiúsculas.
 */
export function maskDocument(text: string): string {
  if (/^[\d.\-\s]*$/.test(text)) return maskCpf(text);
  return text.toUpperCase().replace(/[^0-9A-Z.\-]/g, '').slice(0, 20);
}

/** CNPJ: "12345678000190" → "12.345.678/0001-90" */
export function maskCnpj(text: string): string {
  const d = digits(text).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

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

/** CRP: "06123456" → "CRP 06/123456" (região com 2 dígitos + registro). */
export function maskCrp(text: string): string {
  const d = digits(text).slice(0, 8);
  if (!d) return '';
  if (d.length <= 2) return `CRP ${d}`;
  return `CRP ${d.slice(0, 2)}/${d.slice(2)}`;
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

/** Dinheiro: "15000" → "150,00" (digita da direita para a esquerda, como em app de banco). */
export function maskMoney(text: string): string {
  const d = digits(text).replace(/^0+/, '').slice(0, 9);
  if (!d) return '';
  const cents = d.padStart(3, '0');
  const reais = String(Number(cents.slice(0, -2))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${reais},${cents.slice(-2)}`;
}

/** Sigla da clínica: até 3 letras maiúsculas. */
export function maskAcronym(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-ZÀ-ÖØ-Þ]/g, '')
    .slice(0, 3);
}

// ===== Validação (usada antes de salvar) =====

/** Valida os dígitos verificadores do CPF. */
export function isValidCpf(text: string): boolean {
  const d = digits(text);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

/** Valida os dígitos verificadores do CNPJ. */
export function isValidCnpj(text: string): boolean {
  const d = digits(text);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + w * Number(d[i]), 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Telefone completo: 10 (fixo) ou 11 (celular) dígitos, DDD válido (11–99). */
export function isValidPhone(text: string): boolean {
  const d = digits(text);
  return (d.length === 10 || d.length === 11) && Number(d.slice(0, 2)) >= 11 && (d.length === 10 || d[2] === '9');
}

/** Data DD/MM/AAAA que existe no calendário (rejeita 31/02). */
export function isRealDate(br: string): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return false;
  const [, dd, mm, yyyy] = m.map(Number) as [number, number, number, number];
  const dt = new Date(yyyy, mm - 1, dd);
  return dt.getFullYear() === yyyy && dt.getMonth() === mm - 1 && dt.getDate() === dd && yyyy >= 1900;
}

/** Data DD/MM/AAAA não está no futuro (nascimento). */
export function isNotFuture(br: string): boolean {
  const [dd, mm, yyyy] = br.split('/').map(Number);
  return new Date(yyyy!, mm! - 1, dd!) <= new Date();
}

/** "CNPJ / documento" da clínica: até 11 dígitos → CPF; acima → CNPJ (troca enquanto digita). */
export function maskCpfCnpj(text: string): string {
  const d = digits(text);
  return d.length <= 11 ? maskCpf(d) : maskCnpj(d);
}

/** CPF (11) ou CNPJ (14) com dígitos verificadores válidos. */
export function isValidCpfCnpj(text: string): boolean {
  const d = digits(text);
  return d.length === 11 ? isValidCpf(d) : d.length === 14 ? isValidCnpj(d) : false;
}
