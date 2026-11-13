// CRUD de pacientes, serviços, evoluções (prontuário) e sessões (agenda).
// Toda operação confere se o registro é da clínica de quem está logado.
import { randomUUID } from 'node:crypto';
import type {
  Appointment,
  AppointmentFields,
  Evolution,
  EvolutionFields,
  Page,
  Patient,
  PatientFields,
  Service,
  ServiceFields,
  BaseRecord,
  User,
} from '../domain/types.js';
import type { IRecordRepository, ListOptions } from '../repositories/types.js';
import { assertClinicAccess, requireClinic } from './clinic.js';
import { HttpError, notFound } from './errors.js';

const now = () => new Date().toISOString();

/** Quem está fazendo a requisição (o usuário do login). */
export interface Actor {
  user: User;
}

/** Operações comuns: buscar respeitando a clínica, atualizar e excluir (soft delete). */
class RecordService<T extends BaseRecord, F> {
  constructor(
    protected readonly repo: IRecordRepository<T>,
    private readonly label: string
  ) {}

  /** Busca um registro. 404 também quando é de outra clínica: não revela que o ID existe. */
  async get(actor: Actor, id: string): Promise<T> {
    const rec = await this.repo.findById(id);
    if (!rec || rec.deletedAt || rec.clinicId !== actor.user.clinicId) throw notFound(this.label);
    return rec;
  }

  async list(actor: Actor, clinicId: string, opts: ListOptions): Promise<Page<T>> {
    assertClinicAccess(actor.user, clinicId);
    return this.repo.list(clinicId, opts);
  }

  async update(actor: Actor, id: string, fields: Partial<F>): Promise<T> {
    const current = await this.get(actor, id);
    return this.repo.save({ ...current, ...fields, updatedAt: now() });
  }

  async remove(actor: Actor, id: string): Promise<void> {
    const current = await this.get(actor, id);
    const t = now();
    await this.repo.save({ ...current, updatedAt: t, deletedAt: t });
  }

  protected async insert(actor: Actor, clinicId: string, fields: F): Promise<T> {
    const t = now();
    const rec = { ...fields, id: randomUUID(), clinicId, createdAt: t, updatedAt: t, deletedAt: null } as unknown as T;
    return this.repo.save(rec);
  }
}

export class PatientService extends RecordService<Patient, PatientFields> {
  constructor(repo: IRecordRepository<Patient>) {
    super(repo, 'Paciente');
  }

  async create(actor: Actor, clinicId: string, fields: PatientFields): Promise<Patient> {
    assertClinicAccess(actor.user, clinicId);
    return this.insert(actor, clinicId, fields);
  }
}

export class ServiceCatalog extends RecordService<Service, ServiceFields> {
  constructor(repo: IRecordRepository<Service>) {
    super(repo, 'Serviço');
  }

  async create(actor: Actor, clinicId: string, fields: ServiceFields): Promise<Service> {
    assertClinicAccess(actor.user, clinicId);
    const existing = await this.repo.list(clinicId, { limit: 1000, offset: 0 });
    if (existing.items.some((s) => s.name.toLowerCase() === fields.name.toLowerCase())) {
      throw new HttpError(409, 'Já existe um serviço com esse nome.', 'service_exists');
    }
    return this.insert(actor, clinicId, fields);
  }
}

export class EvolutionService extends RecordService<Evolution, EvolutionFields> {
  constructor(
    repo: IRecordRepository<Evolution>,
    private readonly patients: IRecordRepository<Patient>
  ) {
    super(repo, 'Evolução');
  }

  async listByPatient(actor: Actor, patientId: string, limit: number, offset: number): Promise<Page<Evolution>> {
    const clinicId = requireClinic(actor.user);
    await this.ensurePatient(clinicId, patientId);
    return this.repo.list(clinicId, { limit, offset, where: { patientId } });
  }

  /** Últimas evoluções da clínica (Painel → "Últimos registros"). */
  async listRecent(actor: Actor, clinicId: string, limit: number, offset: number): Promise<Page<Evolution>> {
    assertClinicAccess(actor.user, clinicId);
    return this.repo.list(clinicId, { limit, offset });
  }

  async create(actor: Actor, patientId: string, fields: Pick<EvolutionFields, 'sessionDate' | 'content'>): Promise<Evolution> {
    const clinicId = requireClinic(actor.user);
    await this.ensurePatient(clinicId, patientId);
    return this.insert(actor, clinicId, {
      ...fields,
      patientId,
      authorId: actor.user.id,
      authorName: actor.user.name,
    });
  }

  private async ensurePatient(clinicId: string, patientId: string) {
    const p = await this.patients.findById(patientId);
    if (!p || p.deletedAt || p.clinicId !== clinicId) throw notFound('Paciente');
  }
}

export class AppointmentService extends RecordService<Appointment, AppointmentFields> {
  constructor(
    repo: IRecordRepository<Appointment>,
    private readonly patients: IRecordRepository<Patient>
  ) {
    super(repo, 'Sessão');
  }

  /** Sessões da clínica num intervalo de datas (AAAA-MM-DD), em ordem de data/hora. */
  async listRange(
    actor: Actor,
    clinicId: string,
    from: string | undefined,
    to: string | undefined,
    limit: number,
    offset: number,
    patientId?: string
  ) {
    assertClinicAccess(actor.user, clinicId);
    return this.repo.list(clinicId, { limit, offset, range: { key: 'date', from, to }, where: patientId ? { patientId } : undefined });
  }

  async create(actor: Actor, clinicId: string, fields: AppointmentFields): Promise<Appointment> {
    assertClinicAccess(actor.user, clinicId);
    const p = await this.patients.findById(fields.patientId);
    if (!p || p.deletedAt || p.clinicId !== clinicId) throw notFound('Paciente');
    return this.insert(actor, clinicId, fields);
  }
}
