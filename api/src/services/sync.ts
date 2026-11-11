// Sincronização offline-first (push + pull) de pacientes, serviços, evoluções e sessões da agenda.
// 1. push: aplica as mudanças do aparelho. Conflito = "última edição vence" (maior updatedAt);
//    exclusão vence edição antiga; nunca sobrescreve registro de outra clínica.
// 2. pull: devolve tudo da clínica com rev > lastPulledRev (inclui removidos), em páginas.
//    Se `hasMore`, o app chama de novo com o `rev` recebido até hasMore = false.
import type { Appointment, Evolution, Patient, Service, SyncRecord, User } from '../domain/types.js';
import type { IMetaRepository, ISyncRepository } from '../repositories/types.js';
import type { Actor, AuditService } from './audit.js';
import { requireClinic } from './clinic.js';

export const SYNC_PAGE_SIZE = 500;

type Incoming<T extends SyncRecord> = Omit<T, 'rev' | 'clinicId'>;

export interface SyncChanges {
  patients: Incoming<Patient>[];
  services: Incoming<Service>[];
  evolutions: Incoming<Evolution>[];
  appointments: Incoming<Appointment>[];
}

type Kind = keyof SyncChanges;
/** Ordem do push: pacientes antes das evoluções/sessões que apontam para eles. */
const KINDS: Kind[] = ['patients', 'services', 'evolutions', 'appointments'];

export interface SyncResult {
  /** Cursor: o app guarda e manda de volta como `lastPulledRev`. */
  rev: number;
  /** Ainda há mudanças a baixar (chame de novo com `rev`). */
  hasMore: boolean;
  changes: { patients: Patient[]; services: Service[]; evolutions: Evolution[]; appointments: Appointment[] };
  /** IDs enviados e ignorados (servidor tinha versão mais nova ou o registro é de outra clínica). */
  rejected: string[];
}

export interface SyncRepos {
  patients: ISyncRepository<Patient>;
  services: ISyncRepository<Service>;
  evolutions: ISyncRepository<Evolution>;
  appointments: ISyncRepository<Appointment>;
}

export class SyncService {
  constructor(
    private readonly repos: SyncRepos,
    private readonly meta: IMetaRepository,
    private readonly audit: AuditService,
    private readonly pageSize = SYNC_PAGE_SIZE
  ) {}

  async sync(actor: Actor, lastPulledRev: number, pushed: SyncChanges): Promise<SyncResult> {
    const clinicId = requireClinic(actor.user);
    const rejected: string[] = [];

    const patientOfClinic = async (rec: { patientId: string }) => {
      const p = await this.repos.patients.findById(rec.patientId);
      return !!p && p.clinicId === clinicId;
    };

    await this.push(clinicId, this.repos.patients, pushed.patients, rejected);
    await this.push(clinicId, this.repos.services, pushed.services, rejected);
    await this.push(clinicId, this.repos.evolutions, this.prepareEvolutions(actor.user, pushed.evolutions), rejected, patientOfClinic);
    await this.push(clinicId, this.repos.appointments, pushed.appointments, rejected, patientOfClinic);

    const clinical = pushed.patients.length + pushed.evolutions.length + pushed.appointments.length;
    if (clinical > 0) await this.audit.log(actor, 'sync.push', 'clinic', String(clinical));

    // Pull paginado sobre o cursor global `rev` (vale para todas as tabelas).
    const limit = this.pageSize;
    const fetched = await Promise.all(
      KINDS.map(async (kind) =>
        (await (this.repos[kind] as ISyncRepository<SyncRecord>).changedSince(clinicId, lastPulledRev, limit + 1)).map((r) => ({
          kind,
          r,
        }))
      )
    );
    const merged = fetched.flat().sort((a, b) => a.r.rev - b.r.rev);
    const hasMore = merged.length > limit;
    const page = merged.slice(0, limit);
    const rev = hasMore ? page[page.length - 1]!.r.rev : await this.meta.currentRev();

    const changes: SyncResult['changes'] = { patients: [], services: [], evolutions: [], appointments: [] };
    for (const { kind, r } of page) (changes[kind] as SyncRecord[]).push(r);
    const pulledClinical = changes.patients.length + changes.evolutions.length + changes.appointments.length;
    if (pulledClinical > 0) await this.audit.log(actor, 'sync.pull', 'clinic', String(pulledClinical));
    return { rev, hasMore, changes, rejected };
  }

  /** Autor de evolução nova = quem está sincronizando (não confia no que o aparelho mandou). */
  private prepareEvolutions(user: User, list: Incoming<Evolution>[]): Incoming<Evolution>[] {
    return list.map((e) => ({ ...e, authorId: e.authorId ?? user.id, authorName: e.authorName ?? user.name }));
  }

  private async push<T extends SyncRecord>(
    clinicId: string,
    repo: ISyncRepository<T>,
    incoming: Incoming<T>[],
    rejected: string[],
    extraCheck?: (rec: Incoming<T> & { patientId: string }) => Promise<boolean>
  ) {
    for (const change of incoming) {
      const existing = await repo.findById(change.id);
      const stale =
        (existing && existing.clinicId !== clinicId) || // ID de outra clínica: nunca sobrescrever
        (existing && existing.updatedAt > change.updatedAt) || // servidor tem edição mais nova
        (existing?.deletedAt && !change.deletedAt); // exclusão vence edição antiga
      if (stale || (extraCheck && !(await extraCheck(change as Incoming<T> & { patientId: string })))) {
        rejected.push(change.id);
        continue;
      }
      // Evolução: autor original é preservado em edições.
      const keep = existing as unknown as Record<string, unknown> | null;
      const merged = {
        ...change,
        ...(keep && 'authorId' in keep ? { authorId: keep.authorId, authorName: keep.authorName } : {}),
        clinicId,
        createdAt: existing?.createdAt ?? change.createdAt,
      } as unknown as Omit<T, 'rev'>;
      await repo.save(merged);
    }
  }
}
