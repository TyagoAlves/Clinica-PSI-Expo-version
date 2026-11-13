import { randomUUID } from 'node:crypto';
import { DEFAULT_SERVICES, type Clinic, type Member, type NewClinic, type Service, type User } from '../domain/types.js';
import type { IClinicRepository, IRecordRepository, IUserRepository } from '../repositories/types.js';
import { forbidden, HttpError, notFound } from './errors.js';

/** Regra de acesso: o usuário só enxerga a clínica à qual está vinculado. */
export function assertClinicAccess(user: User, clinicId: string): void {
  if (user.clinicId !== clinicId) throw forbidden();
}

/** Precisa ter clínica; devolve o id. */
export function requireClinic(user: User): string {
  if (!user.clinicId) throw new HttpError(409, 'Cadastre a clínica antes de continuar.', 'clinic_required');
  return user.clinicId;
}

/** Admin da clínica: papel admin ou quem criou a clínica. */
export function isClinicAdmin(user: User, clinic: Clinic): boolean {
  return user.role === 'admin' || clinic.ownerUserId === user.id;
}

export class ClinicService {
  constructor(
    private readonly clinics: IClinicRepository,
    private readonly users: IUserRepository,
    private readonly services: IRecordRepository<Service>
  ) {}

  /** Passo 2 do cadastro: cria a clínica, vincula o usuário como dono e cria o catálogo padrão de serviços. */
  async createForUser(user: User, data: NewClinic): Promise<Clinic> {
    if (user.clinicId) {
      throw new HttpError(409, 'Seu usuário já está vinculado a uma clínica.', 'already_has_clinic');
    }
    const clinic = await this.clinics.create({ ...data, acronym: data.acronym ?? deriveAcronym(data.name) }, user.id);
    await this.users.updateClinicId(user.id, clinic.id);
    const now = new Date().toISOString();
    for (const svc of DEFAULT_SERVICES) {
      await this.services.save({ ...svc, id: randomUUID(), clinicId: clinic.id, createdAt: now, updatedAt: now, deletedAt: null });
    }
    return clinic;
  }

  async get(user: User, id: string): Promise<Clinic> {
    assertClinicAccess(user, id);
    const clinic = await this.clinics.findById(id);
    if (!clinic) throw notFound('Clínica');
    return clinic;
  }

  async update(user: User, id: string, data: Partial<NewClinic>): Promise<Clinic> {
    const clinic = await this.get(user, id);
    if (!isClinicAdmin(user, clinic)) throw forbidden('Só o administrador da clínica pode alterar os dados dela.');
    return (await this.clinics.update(id, data))!;
  }

  async members(user: User, id: string): Promise<Member[]> {
    assertClinicAccess(user, id);
    return this.users.listMembers(id);
  }
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
