// src/database/repositories/ApiTableRepo.ts
// Repositório "online": lê e grava direto na API (que persiste em SQLite).
// Implementa a mesma interface do antigo repositório SQLite local, então as telas não mudam.
// Não há banco no aparelho: sem internet, as operações falham com "Sem conexão com o servidor".
import { apiRequest } from '../../services/api';
import type { SyncBase } from '../../services/apiTypes';
import type { ISyncTableRepository, ListFilter, LocalRecord } from './types';

interface Page<T> {
  items: T[];
  total: number;
  nextOffset: number | null;
}

export interface ApiTableDef<F> {
  /** GET (lista) da clínica — recebe o filtro e devolve caminho + querystring. */
  listPath(clinicId: string, filter: ListFilter): string;
  /** POST de criação. */
  createPath(clinicId: string, fields: F): string;
  /** Corpo do POST (algumas rotas não aceitam todos os campos, ex.: evolução). */
  createBody?(fields: F): unknown;
  /** GET/PATCH/DELETE de um item. */
  itemPath(id: string): string;
  /** Campos que o PATCH aceita (o resto é ignorado). */
  patchBody?(fields: Partial<F>): unknown;
}

const PAGE = 200;

export class ApiTableRepo<T extends SyncBase, F> implements ISyncTableRepository<T, F> {
  private listeners = new Set<() => void>();

  constructor(private readonly def: ApiTableDef<F>) {}

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Avisa as telas para recarregar (após gravar ou ao pedir "atualizar"). */
  emit() {
    this.listeners.forEach((l) => l());
  }

  private local(rec: T): LocalRecord<T> {
    return { ...(rec as T & { clinicId: string }), dirty: false } as LocalRecord<T>;
  }

  async create(clinicId: string, fields: F): Promise<LocalRecord<T>> {
    const body = this.def.createBody ? this.def.createBody(fields) : fields;
    const created = await apiRequest<T>('POST', this.def.createPath(clinicId, fields), body);
    this.emit();
    return this.local(created);
  }

  async update(id: string, fields: Partial<F>): Promise<LocalRecord<T> | null> {
    const body = this.def.patchBody ? this.def.patchBody(fields) : fields;
    const updated = await apiRequest<T>('PATCH', this.def.itemPath(id), body);
    this.emit();
    return this.local(updated);
  }

  async softDelete(id: string): Promise<void> {
    await apiRequest<void>('DELETE', this.def.itemPath(id));
    this.emit();
  }

  async findById(id: string): Promise<LocalRecord<T> | null> {
    try {
      return this.local(await apiRequest<T>('GET', this.def.itemPath(id)));
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  }

  async list(clinicId: string, filter: ListFilter = {}): Promise<LocalRecord<T>[]> {
    const out: T[] = [];
    const max = filter.limit ?? Infinity;
    let offset = 0;
    for (;;) {
      const limit = Math.min(PAGE, max - out.length);
      const path = this.def.listPath(clinicId, filter);
      const sep = path.includes('?') ? '&' : '?';
      const page = await apiRequest<Page<T>>('GET', `${path}${sep}limit=${limit}&offset=${offset}`);
      out.push(...page.items);
      if (page.nextOffset === null || out.length >= max) break;
      offset = page.nextOffset;
    }
    return out.map((r) => this.local(r));
  }

  // Sem banco local, nada fica pendente: os métodos de sincronização viram no-op.
  async listDirty(): Promise<LocalRecord<T>[]> {
    return [];
  }
  async countDirty(): Promise<number> {
    return 0;
  }
  async applyRemote(): Promise<void> {}
  async markSynced(): Promise<void> {}
  async clearAll(): Promise<void> {
    this.emit();
  }
}
