import type { User } from '../domain/types.js';
import { forbidden } from './errors.js';

/** Regra de acesso: o usuário só enxerga a clínica à qual está vinculado. */
export function assertClinicAccess(user: User, clinicId: string): void {
  if (user.clinicId !== clinicId) throw forbidden();
}

/** "Clínica Psi Pinheiros" -> "CP" (até 3 letras das palavras significativas). */
export function deriveAcronym(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-ZÀ-Ú]/.test(w));
  const letters = words.map((w) => w[0]!.toUpperCase()).join('');
  return (letters || name.trim().slice(0, 2).toUpperCase()).slice(0, 3);
}
