// CRUD online de pacientes, serviços e evoluções (o app usa o /sync; estas rotas servem a outros
// clientes, ao painel web futuro e aos testes). Todo acesso a dado clínico é auditado.
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
  SyncRecord,
} from '../domain/types.js';
import type { ISyncRepository, ListOptions } from '../repositories/types.js';
import type { Actor, AuditService } from './audit.js';
import { assertClinicAccess, requireClinic } from './clinic.js';
import { HttpError, notFound } from './errors.js';

const now = () => new Date().toISOString();

/** Operações comuns: buscar respeitando a clínica, atualizar e excluir (soft delete). */
class RecordService<T extends SyncRecord, F> {
  constructor(
    protected readonly repo: ISyncRepository<T>,
    protected readonly audit: AuditService,
    protected readonly entity: string,
    private readonly label: string,
    private readonly auditReads: boolean
  ) {}

  async get(actor: Actor, id: string): Promise<T> {
    const rec = await this.repo.findById(id);
    // 404 também quando é de outra clínica: não revela que o ID existe.
    if (!rec || rec.deletedAt || rec.clinicId !== actor.user.clinicId) throw notFound(this.label);
    if (this.auditReads) await this.audit.log(actor, 'read', this.entity, id);
    return rec;
  }

  async list(actor: Actor, clinicId: string, opts: ListOptions): Promise<Page<T>> {
    assertClinicAccess(actor.user, clinicId);
    if (this.auditReads) await this.audit.log(actor, 'list', this.entity, null);
    return this.repo.list(clinicId, opts);
  }

  async update(actor: Actor, id: string, fields: Partial<F>): Promise<T> {
    const current = await this.getSilently(actor, id);
    const saved = await this.repo.save({ ...current, ...fields, updatedAt: now() });
    await this.audit.log(actor, 'update', this.entity, id);
    return saved;
  }

  async remove(actor: Actor, id: string): Promise<void> {
    const current = await this.getSilently(actor, id);
    const t = now();
    await this.repo.save({ ...current, updatedAt: t, deletedAt: t });
    await this.audit.log(actor, 'delete', this.entity, id);
  }

  protected async getSilently(actor: Actor, id: string): Promise<T> {
    const rec = await this.repo.findById(id);
    if (!rec || rec.deletedAt || rec.clinicId !== actor.user.clinicId) throw notFound(this.label);
    return rec;
  }

  protected async insert(actor: Actor, clinicId: string, fields: F): Promise<T> {
    const t = now();
    const rec = { ...fields, id: randomUUID(), clinicId, createdAt: t, updatedAt: t, deletedAt: null } as unknown as Omit<T, 'rev'>;
    const saved = await this.repo.save(rec);
    await this.audit.log(actor, 'create', this.entity, saved.id);
    return saved;
  }
}

export class PatientService extends RecordService<Patient, PatientFields> {
  constructor(repo: ISyncRepository<Patient>, audit: AuditService) {
    super(repo, audit, 'patient', 'Paciente', true);
  }

  async create(actor: Actor, clinicId: string, fields: PatientFields): Promise<Patient> {
    assertClinicAccess(actor.user, clinicId);
    return this.insert(actor, clinicId, fields);
  }
}

export class ServiceCatalog extends RecordService<Service, ServiceFields> {
  constructor(repo: ISyncRepository<Service>, audit: AuditService) {
    super(repo, audit, 'service', 'Serviço', false);
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
    repo: ISyncRepository<Evolution>,
    private readonly patients: ISyncRepository<Patient>,
    audit: AuditService
  ) {
    super(repo, audit, 'evolution', 'Evolução', true);
  }

  async listByPatient(actor: Actor, patientId: string, limit: number, offset: number): Promise<Page<Evolution>> {
    const clinicId = requireClinic(actor.user);
    await this.ensurePatient(clinicId, patientId);
    await this.audit.log(actor, 'list', 'evolution', patientId);
    return this.repo.list(clinicId, { limit, offset, where: { patientId } });
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
    repo: ISyncRepository<Appointment>,
    private readonly patients: ISyncRepository<Patient>,
    audit: AuditService
  ) {
    super(repo, audit, 'appointment', 'Sessão', true);
  }

  /** Sessões da clínica num intervalo de datas (AAAA-MM-DD), em ordem de data/hora. */
  async listRange(actor: Actor, clinicId: string, from: string | undefined, to: string | undefined, limit: number, offset: number) {
    assertClinicAccess(actor.user, clinicId);
    await this.audit.log(actor, 'list', 'appointment', null);
    return this.repo.list(clinicId, { limit, offset, range: { key: 'date', from, to } });
  }

  async create(actor: Actor, clinicId: string, fields: AppointmentFields): Promise<Appointment> {
    assertClinicAccess(actor.user, clinicId);
    const p = await this.patients.findById(fields.patientId);
    if (!p || p.deletedAt || p.clinicId !== clinicId) throw notFound('Paciente');
    return this.insert(actor, clinicId, fields);
  }
}
