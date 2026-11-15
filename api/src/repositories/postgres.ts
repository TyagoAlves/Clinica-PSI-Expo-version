// Implementação PostgreSQL (Supabase) dos repositórios.
import { randomUUID } from 'node:crypto';
import type { Db, Row } from '../db/connection.js';
import type { Appointment, BaseRecord, Clinic, NewUser, Page, Patient, Session, User, UserRole } from '../domain/types.js';
import type { FieldCipher } from '../security/fieldCipher.js';
import type {
  IClinicRepository,
  ISessionRepository,
  IRecordRepository,
  IUserRepository,
  ListOptions,
  Repositories,
} from './types.js';

const nowIso = () => new Date().toISOString();
const str = (v: unknown): string => String(v);
const strOrNull = (v: unknown): string | null => (v === null || v === undefined ? null : String(v));

// ---- Conversão de datas (banco usa DATE / TIME / TIMESTAMPTZ; a API expõe texto) ----
const pad2 = (n: number) => String(n).padStart(2, '0');
/** TIMESTAMPTZ → ISO-8601 UTC ("2026-11-11T01:23:34.041Z"). */
const isoTs = (v: unknown): string | null =>
  v === null || v === undefined ? null : (v instanceof Date ? v : new Date(String(v))).toISOString();
/** DATE → "AAAA-MM-DD" (sem deslocar o dia por fuso). */
const isoDate = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return `${v.getUTCFullYear()}-${pad2(v.getUTCMonth() + 1)}-${pad2(v.getUTCDate())}`;
  return String(v).slice(0, 10);
};
/** DATE → "DD/MM/AAAA". */
const brDate = (v: unknown): string | null => {
  const iso = isoDate(v);
  return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : null;
};
/** "DD/MM/AAAA" → "AAAA-MM-DD" (parâmetro para coluna DATE). */
const brToIso = (v: unknown): string | null => {
  if (v === null || v === undefined || v === '') return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : String(v);
};
/** TIME → "HH:MM". */
const hhmm = (v: unknown): string | null => (v === null || v === undefined ? null : String(v).slice(0, 5));

/** Placeholders $n incrementais para montar SQL dinâmico com segurança. */
class Params {
  readonly values: unknown[] = [];
  add(v: unknown): string {
    this.values.push(v);
    return `$${this.values.length}`;
  }
}

// ---------------------------------------------------------------- usuários
class PgUserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async create(data: NewUser): Promise<User> {
    const id = randomUUID();
    await this.db.query(
      `INSERT INTO users (id, name, email, password_hash, salt, crp, role, clinic_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)`,
      [id, data.name, data.email, data.passwordHash, data.salt, data.crp, data.role, data.clinicId, nowIso()]
    );
    return (await this.findById(id))!;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email.trim()]);
    return row ? this.map(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return row ? this.map(row) : null;
  }

  async updateClinicId(id: string, clinicId: string): Promise<void> {
    await this.db.query('UPDATE users SET clinic_id = $1 WHERE id = $2', [clinicId, id]);
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
      createdAt: isoTs(r.created_at)!,
    };
  }
}

// ---------------------------------------------------------------- clínicas
class PgClinicRepository implements IClinicRepository {
  constructor(private readonly db: Db) {}

  async create(data: { name: string; acronym: string | null }, ownerUserId: string): Promise<Clinic> {
    const id = randomUUID();
    const now = nowIso();
    await this.db.query(
      `INSERT INTO clinics (id, name, acronym, owner_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz)`,
      [id, data.name, data.acronym, ownerUserId, now, now]
    );
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Clinic | null> {
    const [row] = await this.db.query('SELECT * FROM clinics WHERE id = $1', [id]);
    return row ? this.map(row) : null;
  }

  private map(r: Row): Clinic {
    return {
      id: str(r.id),
      name: str(r.name),
      acronym: strOrNull(r.acronym),
      ownerUserId: strOrNull(r.owner_user_id),
      createdAt: isoTs(r.created_at)!,
      updatedAt: isoTs(r.updated_at)!,
    };
  }
}

// ---------------------------------------------------------------- sessões
class PgSessionRepository implements ISessionRepository {
  constructor(private readonly db: Db) {}

  async create(tokenHash: string, userId: string, expiresAt: string): Promise<void> {
    await this.db.query('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3::timestamptz, $4::timestamptz)', [
      tokenHash,
      userId,
      nowIso(),
      expiresAt,
    ]);
  }

  async find(tokenHash: string): Promise<Session | null> {
    const [row] = await this.db.query('SELECT user_id, expires_at FROM sessions WHERE token_hash = $1', [tokenHash]);
    return row ? { userId: str(row.user_id), expiresAt: isoTs(row.expires_at)! } : null;
  }

  async delete(tokenHash: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
  }

  async deleteExpired(now: string): Promise<number> {
    const rows = await this.db.query('DELETE FROM sessions WHERE expires_at <= $1::timestamptz RETURNING 1', [now]);
    return rows.length;
  }
}

// ---------------------------------------------------------------- pacientes e sessões (agenda)
interface Column {
  key: string;
  column: string;
  encrypted?: boolean;
  /** Tipo no PostgreSQL quando não for texto. dateBr = DATE exposto como DD/MM/AAAA. */
  type?: 'int' | 'timestamp' | 'date' | 'dateBr' | 'time';
}

interface EntityDef {
  table: string;
  columns: Column[];
  orderBy: string;
  searchColumn?: string;
}

/** Cast explícito do parâmetro por tipo (o driver envia texto). */
const CAST: Record<string, string> = { timestamp: '::timestamptz', date: '::date', dateBr: '::date', time: '::time' };

const BASE_COLUMNS: Column[] = [
  { key: 'id', column: 'id' },
  { key: 'clinicId', column: 'clinic_id' },
  { key: 'createdAt', column: 'created_at', type: 'timestamp' },
  { key: 'updatedAt', column: 'updated_at', type: 'timestamp' },
  { key: 'deletedAt', column: 'deleted_at', type: 'timestamp' },
];

const PATIENTS: EntityDef = {
  table: 'patients',
  orderBy: 'lower(name)',
  searchColumn: 'name',
  columns: [
    { key: 'name', column: 'name' },
    { key: 'service', column: 'service' },
    { key: 'treatmentStart', column: 'treatment_start', type: 'dateBr' },
    { key: 'complaint', column: 'complaint_enc', encrypted: true },
  ],
};

const APPOINTMENTS: EntityDef = {
  table: 'appointments',
  orderBy: 'date, time',
  columns: [
    { key: 'patientId', column: 'patient_id' },
    { key: 'date', column: 'date', type: 'date' },
    { key: 'time', column: 'time', type: 'time' },
    { key: 'durationMin', column: 'duration_min', type: 'int' },
    { key: 'service', column: 'service' },
    { key: 'notes', column: 'notes_enc', encrypted: true },
  ],
};

class PgRecordRepository<T extends BaseRecord> implements IRecordRepository<T> {
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

  async save(data: T): Promise<T> {
    const rec = data as unknown as Record<string, unknown>;
    const values = this.cols.map((c) => {
      const v = rec[c.key] ?? null;
      if (c.encrypted) return this.cipher.encrypt(v as string | null);
      if (c.type === 'int') return v === null ? null : Number(v);
      if (c.type === 'dateBr') return brToIso(v);
      return v;
    });
    const names = [...this.cols.map((c) => c.column), 'rev'];
    const updates = names.filter((n) => n !== 'id' && n !== 'clinic_id' && n !== 'created_at');
    // Upsert: se o id ainda não existe, INSERT; se já existe, UPDATE dos campos.
    // (A coluna "rev" sobrou de uma versão antiga; é obrigatória no banco, então gravamos sempre 0.)
    await this.db.query(
      `INSERT INTO ${this.def.table} (${names.join(', ')}) VALUES (${names.map((_, i) => `$${i + 1}${CAST[this.cols[i]?.type ?? ''] ?? ''}`).join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${updates.map((n) => `${n} = excluded.${n}`).join(', ')}`,
      [...values, 0]
    );
    return (await this.findById(String(rec.id)))!;
  }

  async findById(id: string): Promise<T | null> {
    const [row] = await this.db.query(`SELECT * FROM ${this.def.table} WHERE id = $1`, [id]);
    return row ? this.map(row) : null;
  }

  async list(clinicId: string, opts: ListOptions): Promise<Page<T>> {
    const p = new Params();
    const where = [`clinic_id = ${p.add(clinicId)}`, 'deleted_at IS NULL'];
    if (opts.range) {
      const col = this.byKey.get(opts.range.key);
      if (!col || col.encrypted) throw new Error(`Intervalo inválido: ${opts.range.key}`);
      const cast = CAST[col.type ?? ''] ?? '';
      if (opts.range.from) where.push(`${col.column} >= ${p.add(opts.range.from)}${cast}`);
      if (opts.range.to) where.push(`${col.column} <= ${p.add(opts.range.to)}${cast}`);
    }
    if (opts.search && this.def.searchColumn) {
      where.push(`${this.def.searchColumn} ILIKE ${p.add(`%${opts.search.replace(/[\\%_]/g, (m) => `\\${m}`)}%`)}`);
    }
    const sqlWhere = where.join(' AND ');
    const [count] = await this.db.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM ${this.def.table} WHERE ${sqlWhere}`, p.values);
    const total = Number(count?.n ?? 0);
    const limit = p.add(opts.limit);
    const offset = p.add(opts.offset);
    const rows = await this.db.query(
      `SELECT * FROM ${this.def.table} WHERE ${sqlWhere} ORDER BY ${this.def.orderBy}, id LIMIT ${limit} OFFSET ${offset}`,
      p.values
    );
    const next = opts.offset + rows.length;
    return { items: rows.map((r) => this.map(r)), total, nextOffset: next < total ? next : null };
  }

  private map(r: Row): T {
    const out: Record<string, unknown> = {};
    for (const c of this.cols) {
      const raw = r[c.column];
      if (c.type === 'int') out[c.key] = raw === null || raw === undefined ? null : Number(raw);
      else if (c.type === 'timestamp') out[c.key] = isoTs(raw);
      else if (c.type === 'date') out[c.key] = isoDate(raw);
      else if (c.type === 'dateBr') out[c.key] = brDate(raw);
      else if (c.type === 'time') out[c.key] = hhmm(raw);
      else out[c.key] = c.encrypted ? this.cipher.decrypt(strOrNull(raw)) : strOrNull(raw);
    }
    return out as T;
  }
}

export function createPostgresRepositories(db: Db, cipher: FieldCipher): Repositories {
  return {
    users: new PgUserRepository(db),
    clinics: new PgClinicRepository(db),
    sessions: new PgSessionRepository(db),
    patients: new PgRecordRepository<Patient>(db, cipher, PATIENTS),
    appointments: new PgRecordRepository<Appointment>(db, cipher, APPOINTMENTS),
  };
}
