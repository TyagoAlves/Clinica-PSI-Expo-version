import type { User } from '../domain/types.js';
import type { IAuditRepository } from '../repositories/types.js';

/** Quem está agindo (usuário autenticado + IP da requisição). */
export interface Actor {
  user: User;
  ip: string | null;
}

export type AuditAction = 'read' | 'list' | 'create' | 'update' | 'delete' | 'sync.push' | 'sync.pull';

/** Registra acesso a dado clínico (LGPD). Nunca grava o conteúdo, só o quê/quem/quando. */
export class AuditService {
  constructor(private readonly repo: IAuditRepository) {}

  async log(actor: Actor, action: AuditAction, entity: string, entityId: string | null = null): Promise<void> {
    await this.repo.record({
      userId: actor.user.id,
      clinicId: actor.user.clinicId,
      action,
      entity,
      entityId,
      ip: actor.ip,
    });
  }

  list(clinicId: string, limit: number, offset: number) {
    return this.repo.list(clinicId, limit, offset);
  }
}
