// src/database/repositories/SyncTableRepo.ts
// Repositório genérico de tabela sincronizável no SQLite do aparelho.
import type { SQLiteDatabase, SQLiteBindValue } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import type { AppointmentFields, EvolutionFields, PatientFields, ServiceFields, SyncBase } from '../../services/apiTypes';
import type { ISyncTableRepository, ListFilter, LocalRecord } from './types';

export interface TableDef<F> {
  table: string;
  /** campo do objeto -> coluna */
  fields: Record<keyof F & string, string>;
  orderBy: string;
  /** Campos booleanos (gravados como 0/1 no SQLite). */
  bools?: (keyof F & string)[];
}

type Row = Record<string, string | number | null>;

const BASE: Record<string, string> = {
  id: 'id',
  clinicId: 'clinic_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  deletedAt: 'deleted_at',
};

const nowIso = () => new Date().toISOString();

export class SyncTableRepo<T extends SyncBase, F> implements ISyncTableRepository<T, F> {
  private listeners = new Set<() => void>();
  private readonly columns: [string, string][];

  constructor(
    private readonly db: SQLiteDatabase,
    private readonly def: TableDef<F>
  ) {
    this.columns = [...Object.entries(BASE), ...(Object.entries(def.fields) as [string, string][])];
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private column(key: string): string {
    const c = this.columns.find(([k]) => k === key)?.[1];
    if (!c) throw new Error(`Campo desconhecido em ${this.def.table}: ${key}`);
    return c;
  }

  private async upsert(rec: LocalRecord<T>): Promise<void> {
    const r = rec as unknown as Record<string, unknown>;
    const cols = [...this.columns.map(([, c]) => c), 'dirty'];
    const bools = new Set<string>(this.def.bools ?? []);
    const values = [
      ...this.columns.map(([k]) => {
        const v = r[k] ?? null;
        return (bools.has(k) && v !== null ? (v ? 1 : 0) : v) as SQLiteBindValue;
      }),
      rec.dirty ? 1 : 0,
    ];
    const updates = cols.filter((c) => c !== 'id' && c !== 'clinic_id' && c !== 'created_at');
    await this.db.runAsync(
      `INSERT INTO ${this.def.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
       ON CONFLICT(id) DO UPDATE SET ${updates.map((c) => `${c} = excluded.${c}`).join(', ')}`,
      values
    );
  }

  async create(clinicId: string, fields: F): Promise<LocalRecord<T>> {
    const now = nowIso();
    const rec = {
      ...fields,
      id: Crypto.randomUUID(),
      clinicId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      dirty: true,
    } as unknown as LocalRecord<T>;
    await this.upsert(rec);
    this.emit();
    return rec;
  }

  async update(id: string, fields: Partial<F>): Promise<LocalRecord<T> | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const next = { ...current, ...fields, updatedAt: nowIso(), dirty: true } as LocalRecord<T>;
    await this.upsert(next);
    this.emit();
    return next;
  }

  async softDelete(id: string): Promise<void> {
    const now = nowIso();
    await this.db.runAsync(`UPDATE ${this.def.table} SET deleted_at = ?, updated_at = ?, dirty = 1 WHERE id = ?`, [
      now,
      now,
      id,
    ]);
    this.emit();
  }

  async findById(id: string): Promise<LocalRecord<T> | null> {
    const row = await this.db.getFirstAsync<Row>(`SELECT * FROM ${this.def.table} WHERE id = ?`, [id]);
    return row ? this.map(row) : null;
  }

  async list(clinicId: string, filter: ListFilter = {}): Promise<LocalRecord<T>[]> {
    const where = ['clinic_id = ?', 'deleted_at IS NULL'];
    const params: SQLiteBindValue[] = [clinicId];
    for (const [key, value] of Object.entries(filter.where ?? {})) {
      where.push(`${this.column(key)} = ?`);
      params.push(value);
    }
    if (filter.range) {
      const col = this.column(filter.range.key);
      if (filter.range.from) {
        where.push(`${col} >= ?`);
        params.push(filter.range.from);
      }
      if (filter.range.to) {
        where.push(`${col} <= ?`);
        params.push(filter.range.to);
      }
    }
    let sql = `SELECT * FROM ${this.def.table} WHERE ${where.join(' AND ')} ORDER BY ${this.def.orderBy}`;
    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }
    const rows = await this.db.getAllAsync<Row>(sql, params);
    return rows.map((r) => this.map(r));
  }

  async listDirty(clinicId: string): Promise<LocalRecord<T>[]> {
    const rows = await this.db.getAllAsync<Row>(`SELECT * FROM ${this.def.table} WHERE clinic_id = ? AND dirty = 1`, [
      clinicId,
    ]);
    return rows.map((r) => this.map(r));
  }

  async countDirty(clinicId: string): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      `SELECT COUNT(*) AS n FROM ${this.def.table} WHERE clinic_id = ? AND dirty = 1`,
      [clinicId]
    );
    return row?.n ?? 0;
  }

  async applyRemote(clinicId: string, remote: T): Promise<void> {
    const local = await this.findById(remote.id);
    // Edição local mais nova ainda não enviada: mantém (vai no próximo push).
    if (local?.dirty && local.updatedAt > remote.updatedAt) return;
    if (remote.deletedAt) {
      // Removido no servidor: apaga de verdade do aparelho (dado clínico não fica sobrando).
      await this.db.runAsync(`DELETE FROM ${this.def.table} WHERE id = ?`, [remote.id]);
    } else {
      await this.upsert({ ...remote, clinicId, dirty: false } as LocalRecord<T>);
    }
    this.emit();
  }

  async markSynced(id: string, updatedAt: string): Promise<void> {
    await this.db.runAsync(`UPDATE ${this.def.table} SET dirty = 0 WHERE id = ? AND updated_at = ?`, [id, updatedAt]);
    // Exclusão já confirmada pelo servidor: some do aparelho.
    await this.db.runAsync(`DELETE FROM ${this.def.table} WHERE id = ? AND dirty = 0 AND deleted_at IS NOT NULL`, [id]);
    this.emit();
  }

  async clearAll(): Promise<void> {
    await this.db.runAsync(`DELETE FROM ${this.def.table}`);
    this.emit();
  }

  private map(r: Row): LocalRecord<T> {
    const out: Record<string, unknown> = { dirty: r.dirty === 1 };
    const bools = new Set<string>(this.def.bools ?? []);
    for (const [key, col] of this.columns) {
      const v = r[col] ?? null;
      out[key] = bools.has(key) && v !== null ? v === 1 : v;
    }
    return out as unknown as LocalRecord<T>;
  }
}

// ===== Definições das tabelas =====

export const PATIENTS_TABLE: TableDef<PatientFields> = {
  table: 'patients',
  orderBy: 'name COLLATE NOCASE',
  fields: {
    name: 'name',
    phone: 'phone',
    email: 'email',
    birthDate: 'birth_date',
    document: 'document',
    service: 'service',
    treatmentStart: 'treatment_start',
    status: 'status',
    professional: 'professional',
    address: 'address',
    guardian: 'guardian',
    complaint: 'complaint',
    notes: 'notes',
  },
};

export const SERVICES_TABLE: TableDef<ServiceFields> = {
  table: 'services',
  orderBy: 'name COLLATE NOCASE',
  bools: ['active'],
  fields: {
    name: 'name',
    description: 'description',
    durationMin: 'duration_min',
    priceCents: 'price_cents',
    active: 'active',
  },
};

export const APPOINTMENTS_TABLE: TableDef<AppointmentFields> = {
  table: 'appointments',
  orderBy: 'date, time',
  fields: {
    patientId: 'patient_id',
    date: 'date',
    time: 'time',
    durationMin: 'duration_min',
    service: 'service',
    professional: 'professional',
    status: 'status',
    notes: 'notes',
  },
};

export const EVOLUTIONS_TABLE: TableDef<EvolutionFields> = {
  table: 'evolutions',
  orderBy: 'created_at DESC',
  fields: {
    patientId: 'patient_id',
    sessionDate: 'session_date',
    content: 'content',
    authorId: 'author_id',
    authorName: 'author_name',
  },
};
