// Implementação SQLite dos repositórios (node:sqlite).
import { randomUUID } from 'node:crypto';
import type { SQLInputValue } from 'node:sqlite';
import { transaction, type Db } from '../db/connection.js';
import type {
  Appointment,
  AuditEntry,
  Clinic,
  Evolution,
  Member,
  NewClinic,
  NewUser,
  Page,
  Patient,
  Service,
  Session,
  SyncRecord,
  User,
  UserRole,
} from '../domain/types.js';
import type { FieldCipher } from '../security/fieldCipher.js';
import type {
  IAuditRepository,
  IClinicRepository,
  IMetaRepository,
  ISessionRepository,
  ISyncRepository,
  IUserRepository,
  ListOptions,
  Repositories,
} from './types.js';

type Row = Record<string, SQLInputValue>;
const nowIso = () => new Date().toISOString();
const str = (v: unknown): string => String(v);
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

// ---------------------------------------------------------------- usuários
class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async create(data: NewUser): Promise<User> {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO users (id, name, email, password_hash, salt, crp, role, clinic_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, data.name, data.email, data.passwordHash, data.salt, data.crp, data.role, data.clinicId, nowIso());
    return (await this.findById(id))!;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim()) as Row | undefined;
    return row ? this.map(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Row | undefined;
    return row ? this.map(row) : null;
  }

  async updateClinicId(id: string, clinicId: string): Promise<void> {
    this.db.prepare('UPDATE users SET clinic_id = ? WHERE id = ?').run(clinicId, id);
  }

  async updateProfile(id: string, data: { name?: string; crp?: string | null }): Promise<void> {
    if (data.name !== undefined) this.db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, id);
    if (data.crp !== undefined) this.db.prepare('UPDATE users SET crp = ? WHERE id = ?').run(data.crp, id);
  }

  async updatePassword(id: string, passwordHash: string, salt: string): Promise<void> {
    this.db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(passwordHash, salt, id);
  }

  async listMembers(clinicId: string): Promise<Member[]> {
    const rows = this.db
      .prepare('SELECT id, name, crp, role FROM users WHERE clinic_id = ? ORDER BY name COLLATE NOCASE')
      .all(clinicId) as Row[];
    return rows.map((r) => ({ id: str(r.id), name: str(r.name), crp: strOrNull(r.crp), role: str(r.role) as UserRole }));
  }

  private map(r: Row): User {
    return {
      id: str(r.id),
      name: str(r.name),
      email: str(r.email),
      passwordHash: str(r.password_hash),
      salt: str(r.salt),
      crp: strOrNull(r.crp),
      role: str(r.role) as UserRole,
      clinicId: strOrNull(r.clinic_id),
      createdAt: str(r.created_at),
    };
  }
}

// ---------------------------------------------------------------- clínicas
const CLINIC_COLUMNS: Record<keyof NewClinic, string> = {
  name: 'name',
  unit: 'unit',
  technicalResponsible: 'technical_responsible',
  cnpj: 'cnpj',
  phone: 'phone',
  email: 'email',
  address: 'address',
  acronym: 'acronym',
};

class SqliteClinicRepository implements IClinicRepository {
  constructor(private readonly db: Db) {}

  async create(data: NewClinic, ownerUserId: string): Promise<Clinic> {
    const id = randomUUID();
    const now = nowIso();
    this.db
      .prepare(
        `INSERT INTO clinics (id, name, unit, technical_responsible, cnpj, phone, email, address, acronym, owner_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.name,
        data.unit,
        data.technicalResponsible,
        data.cnpj,
        data.phone,
        data.email,
        data.address,
        data.acronym,
        ownerUserId,
        now,
        now
      );
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Clinic | null> {
    const row = this.db.prepare('SELECT * FROM clinics WHERE id = ?').get(id) as Row | undefined;
    return row ? this.map(row) : null;
  }

  async update(id: string, data: Partial<NewClinic>): Promise<Clinic | null> {
    const sets: string[] = [];
    const params: SQLInputValue[] = [];
    for (const [key, column] of Object.entries(CLINIC_COLUMNS) as [keyof NewClinic, string][]) {
      if (data[key] !== undefined) {
        sets.push(`${column} = ?`);
        params.push(data[key] ?? null);
      }
    }
    if (sets.length > 0) {
      sets.push('updated_at = ?');
      params.push(nowIso(), id);
      this.db.prepare(`UPDATE clinics SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    }
    return this.findById(id);
  }

  private map(r: Row): Clinic {
    return {
      id: str(r.id),
      name: str(r.name),
      unit: strOrNull(r.unit),
      technicalResponsible: strOrNull(r.technical_responsible),
      cnpj: strOrNull(r.cnpj),
      phone: strOrNull(r.phone),
      email: strOrNull(r.email),
      address: strOrNull(r.address),
      acronym: strOrNull(r.acronym),
      ownerUserId: strOrNull(r.owner_user_id),
      createdAt: str(r.created_at),
      updatedAt: str(r.updated_at),
    };
  }
}

// ---------------------------------------------------------------- sessões
class SqliteSessionRepository implements ISessionRepository {
  constructor(private readonly db: Db) {}

  async create(tokenHash: string, userId: string, expiresAt: string): Promise<void> {
    this.db
      .prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run(tokenHash, userId, nowIso(), expiresAt);
  }

  async find(tokenHash: string): Promise<Session | null> {
    const row = this.db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?').get(tokenHash) as
      | Row
      | undefined;
    return row ? { userId: str(row.user_id), expiresAt: str(row.expires_at) } : null;
  }

  async delete(tokenHash: string): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }

  async deleteOthers(userId: string, keepTokenHash: string): Promise<number> {
    return Number(
      this.db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?').run(userId, keepTokenHash).changes
    );
  }

  async deleteExpired(now: string): Promise<number> {
    return Number(this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes);
  }
}

// ---------------------------------------------------------------- entidades sincronizáveis
interface Column {
  /** Nome do campo no objeto de domínio. */
  key: string;
  column: string;
  /** Gravado cifrado (AES-256-GCM). */
  encrypted?: boolean;
  /** Tipo no SQLite quando não for texto. */
  type?: 'int' | 'bool';
}

interface EntityDef {
  table: string;
  columns: Column[];
  /** ORDER BY da listagem. */
  orderBy: string;
  /** Coluna usada pela busca por texto (`search`). */
  searchColumn?: string;
}

const BASE_COLUMNS: Column[] = [
  { key: 'id', column: 'id' },
  { key: 'clinicId', column: 'clinic_id' },
  { key: 'createdAt', column: 'created_at' },
  { key: 'updatedAt', column: 'updated_at' },
  { key: 'deletedAt', column: 'deleted_at' },
];

const PATIENTS: EntityDef = {
  table: 'patients',
  orderBy: 'name COLLATE NOCASE',
  searchColumn: 'name',
  columns: [
    { key: 'name', column: 'name' },
    { key: 'phone', column: 'phone' },
    { key: 'email', column: 'email' },
    { key: 'birthDate', column: 'birth_date' },
    { key: 'document', column: 'document_enc', encrypted: true },
    { key: 'service', column: 'service' },
    { key: 'treatmentStart', column: 'treatment_start' },
    { key: 'status', column: 'status' },
    { key: 'professional', column: 'professional' },
    { key: 'address', column: 'address_enc', encrypted: true },
    { key: 'guardian', column: 'guardian_enc', encrypted: true },
    { key: 'complaint', column: 'complaint_enc', encrypted: true },
    { key: 'notes', column: 'notes_enc', encrypted: true },
  ],
};

const SERVICES: EntityDef = {
  table: 'services',
  orderBy: 'name COLLATE NOCASE',
  searchColumn: 'name',
  columns: [
    { key: 'name', column: 'name' },
    { key: 'description', column: 'description' },
    { key: 'durationMin', column: 'duration_min', type: 'int' },
    { key: 'priceCents', column: 'price_cents', type: 'int' },
    { key: 'active', column: 'active', type: 'bool' },
  ],
};

const APPOINTMENTS: EntityDef = {
  table: 'appointments',
  orderBy: 'date, time',
  columns: [
    { key: 'patientId', column: 'patient_id' },
    { key: 'date', column: 'date' },
    { key: 'time', column: 'time' },
    { key: 'durationMin', column: 'duration_min', type: 'int' },
    { key: 'service', column: 'service' },
    { key: 'professional', column: 'professional' },
    { key: 'status', column: 'status' },
    { key: 'notes', column: 'notes_enc', encrypted: true },
  ],
};

const EVOLUTIONS: EntityDef = {
  table: 'evolutions',
  orderBy: 'created_at DESC',
  columns: [
    { key: 'patientId', column: 'patient_id' },
    { key: 'sessionDate', column: 'session_date' },
    { key: 'content', column: 'content_enc', encrypted: true },
    { key: 'authorId', column: 'author_id' },
    { key: 'authorName', column: 'author_name' },
  ],
};

class SqliteSyncRepository<T extends SyncRecord> implements ISyncRepository<T> {
  private readonly cols: Column[];
  private readonly byKey: Map<string, Column>;

  constructor(
    private readonly db: Db,
    private readonly cipher: FieldCipher,
    private readonly def: EntityDef
  ) {
    this.cols = [...BASE_COLUMNS, ...def.columns];
    this.byKey = new Map(this.cols.map((c) => [c.key, c]));
  }

  private nextRev(): number {
    const row = this.db.prepare("UPDATE meta SET value = value + 1 WHERE key = 'rev' RETURNING value").get() as Row;
    return Number(row.value);
  }

  async save(data: Omit<T, 'rev'>): Promise<T> {
    const rec = data as unknown as Record<string, unknown>;
    const names = [...this.cols.map((c) => c.column), 'rev'];
    const values: SQLInputValue[] = this.cols.map((c) => {
      const v = rec[c.key] ?? null;
      if (c.encrypted) return this.cipher.encrypt(v as string | null);
      if (c.type === 'bool') return v === null ? null : v ? 1 : 0;
      if (c.type === 'int') return v === null ? null : Number(v);
      return v as string | null;
    });
    const updates = names.filter((n) => n !== 'id' && n !== 'clinic_id' && n !== 'created_at');
    transaction(this.db, () => {
      values.push(this.nextRev());
      this.db
        .prepare(
          `INSERT INTO ${this.def.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})
           ON CONFLICT(id) DO UPDATE SET ${updates.map((n) => `${n} = excluded.${n}`).join(', ')}`
        )
        .run(...values);
    });
    return (await this.findById(String(rec.id)))!;
  }

  async findById(id: string): Promise<T | null> {
    const row = this.db.prepare(`SELECT * FROM ${this.def.table} WHERE id = ?`).get(id) as Row | undefined;
    return row ? this.map(row) : null;
  }

  async list(clinicId: string, opts: ListOptions): Promise<Page<T>> {
    const where = ['clinic_id = ?', 'deleted_at IS NULL'];
    const params: SQLInputValue[] = [clinicId];
    for (const [key, value] of Object.entries(opts.where ?? {})) {
      const col = this.byKey.get(key);
      if (!col || col.encrypted) throw new Error(`Filtro inválido: ${key}`);
      where.push(`${col.column} = ?`);
      params.push(value);
    }
    if (opts.range) {
      const col = this.byKey.get(opts.range.key);
      if (!col || col.encrypted) throw new Error(`Intervalo inválido: ${opts.range.key}`);
      if (opts.range.from) {
        where.push(`${col.column} >= ?`);
        params.push(opts.range.from);
      }
      if (opts.range.to) {
        where.push(`${col.column} <= ?`);
        params.push(opts.range.to);
      }
    }
    if (opts.search && this.def.searchColumn) {
      where.push(`${this.def.searchColumn} LIKE ? ESCAPE '\\'`);
      params.push(`%${opts.search.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
    }
    const sqlWhere = where.join(' AND ');
    const total = Number(
      (this.db.prepare(`SELECT COUNT(*) AS n FROM ${this.def.table} WHERE ${sqlWhere}`).get(...params) as Row).n
    );
    const rows = this.db
      .prepare(`SELECT * FROM ${this.def.table} WHERE ${sqlWhere} ORDER BY ${this.def.orderBy} LIMIT ? OFFSET ?`)
      .all(...params, opts.limit, opts.offset) as Row[];
    const next = opts.offset + rows.length;
    return { items: rows.map((r) => this.map(r)), total, nextOffset: next < total ? next : null };
  }

  async changedSince(clinicId: string, sinceRev: number, limit: number): Promise<T[]> {
    const rows = this.db
      .prepare(`SELECT * FROM ${this.def.table} WHERE clinic_id = ? AND rev > ? ORDER BY rev LIMIT ?`)
      .all(clinicId, sinceRev, limit) as Row[];
    return rows.map((r) => this.map(r));
  }

  /** Re-cifra com a chave atual todo valor cifrado com chave antiga. Não altera rev (não é edição). */
  async reencryptAll(): Promise<number> {
    const encCols = this.def.columns.filter((c) => c.encrypted);
    if (encCols.length === 0) return 0;
    let changed = 0;
    const rows = this.db.prepare(`SELECT id, ${encCols.map((c) => c.column).join(', ')} FROM ${this.def.table}`).all() as Row[];
    transaction(this.db, () => {
      for (const row of rows) {
        const sets: string[] = [];
        const params: SQLInputValue[] = [];
        for (const c of encCols) {
          const v = strOrNull(row[c.column]);
          if (v && this.cipher.keyIdOf(v) !== this.cipher.currentKeyId) {
            sets.push(`${c.column} = ?`);
            params.push(this.cipher.encrypt(this.cipher.decrypt(v)));
          }
        }
        if (sets.length) {
          this.db.prepare(`UPDATE ${this.def.table} SET ${sets.join(', ')} WHERE id = ?`).run(...params, str(row.id));
          changed++;
        }
      }
    });
    return changed;
  }

  private map(r: Row): T {
    const out: Record<string, unknown> = { rev: Number(r.rev) };
    for (const c of this.cols) {
      const raw = r[c.column];
      if (c.type === 'bool') out[c.key] = raw === null || raw === undefined ? null : Number(raw) === 1;
      else if (c.type === 'int') out[c.key] = raw === null || raw === undefined ? null : Number(raw);
      else out[c.key] = c.encrypted ? this.cipher.decrypt(strOrNull(raw)) : strOrNull(raw);
    }
    return out as T;
  }
}

// ---------------------------------------------------------------- auditoria
class SqliteAuditRepository implements IAuditRepository {
  constructor(private readonly db: Db) {}

  async record(e: Omit<AuditEntry, 'id' | 'at'>): Promise<void> {
    this.db
      .prepare('INSERT INTO audit_log (at, user_id, clinic_id, action, entity, entity_id, ip) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(nowIso(), e.userId, e.clinicId, e.action, e.entity, e.entityId, e.ip);
  }

  async list(clinicId: string, limit: number, offset: number): Promise<Page<AuditEntry>> {
    const total = Number((this.db.prepare('SELECT COUNT(*) AS n FROM audit_log WHERE clinic_id = ?').get(clinicId) as Row).n);
    const rows = this.db
      .prepare('SELECT * FROM audit_log WHERE clinic_id = ? ORDER BY id DESC LIMIT ? OFFSET ?')
      .all(clinicId, limit, offset) as Row[];
    const next = offset + rows.length;
    return {
      items: rows.map((r) => ({
        id: Number(r.id),
        at: str(r.at),
        userId: str(r.user_id),
        clinicId: strOrNull(r.clinic_id),
        action: str(r.action),
        entity: str(r.entity),
        entityId: strOrNull(r.entity_id),
        ip: strOrNull(r.ip),
      })),
      total,
      nextOffset: next < total ? next : null,
    };
  }
}

class SqliteMetaRepository implements IMetaRepository {
  constructor(private readonly db: Db) {}
  async currentRev(): Promise<number> {
    return Number((this.db.prepare("SELECT value FROM meta WHERE key = 'rev'").get() as Row).value);
  }
}

export function createSqliteRepositories(db: Db, cipher: FieldCipher): Repositories {
  return {
    users: new SqliteUserRepository(db),
    clinics: new SqliteClinicRepository(db),
    sessions: new SqliteSessionRepository(db),
    patients: new SqliteSyncRepository<Patient>(db, cipher, PATIENTS),
    services: new SqliteSyncRepository<Service>(db, cipher, SERVICES),
    evolutions: new SqliteSyncRepository<Evolution>(db, cipher, EVOLUTIONS),
    appointments: new SqliteSyncRepository<Appointment>(db, cipher, APPOINTMENTS),
    audit: new SqliteAuditRepository(db),
    meta: new SqliteMetaRepository(db),
  };
}
