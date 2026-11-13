// Implementação PostgreSQL (Supabase) dos repositórios.
import { randomUUID } from 'node:crypto';
import type { Db, Row } from '../db/connection.js';
import type {
  Appointment,
  Clinic,
  Evolution,
  Member,
  NewClinic,
  NewUser,
  Page,
  Patient,
  Service,
  Session,
  BaseRecord,
  User,
  UserRole,
} from '../domain/types.js';
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

  async updateProfile(id: string, data: { name?: string; crp?: string | null }): Promise<void> {
    if (data.name !== undefined) await this.db.query('UPDATE users SET name = $1 WHERE id = $2', [data.name, id]);
    if (data.crp !== undefined) await this.db.query('UPDATE users SET crp = $1 WHERE id = $2', [data.crp, id]);
  }

  async updatePassword(id: string, passwordHash: string, salt: string): Promise<void> {
    await this.db.query('UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3', [passwordHash, salt, id]);
  }

  async listMembers(clinicId: string): Promise<Member[]> {
    const rows = await this.db.query('SELECT id, name, crp, role FROM users WHERE clinic_id = $1 ORDER BY lower(name)', [
      clinicId,
    ]);
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
      createdAt: isoTs(r.created_at)!,
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

class PgClinicRepository implements IClinicRepository {
  constructor(private readonly db: Db) {}

  async create(data: NewClinic, ownerUserId: string): Promise<Clinic> {
    const id = randomUUID();
    const now = nowIso();
    await this.db.query(
      `INSERT INTO clinics (id, name, unit, technical_responsible, cnpj, phone, email, address, acronym, owner_user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::timestamptz)`,
      [
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
        now,
      ]
    );
    return (await this.findById(id))!;
  }

  async findById(id: string): Promise<Clinic | null> {
    const [row] = await this.db.query('SELECT * FROM clinics WHERE id = $1', [id]);
    return row ? this.map(row) : null;
  }

  async update(id: string, data: Partial<NewClinic>): Promise<Clinic | null> {
    const p = new Params();
    const sets: string[] = [];
    for (const [key, column] of Object.entries(CLINIC_COLUMNS) as [keyof NewClinic, string][]) {
      if (data[key] !== undefined) sets.push(`${column} = ${p.add(data[key] ?? null)}`);
    }
    if (sets.length > 0) {
      sets.push(`updated_at = ${p.add(nowIso())}::timestamptz`);
      await this.db.query(`UPDATE clinics SET ${sets.join(', ')} WHERE id = ${p.add(id)}`, p.values);
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

  async deleteOthers(userId: string, keepTokenHash: string): Promise<number> {
    const rows = await this.db.query('DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2 RETURNING 1', [
      userId,
      keepTokenHash,
    ]);
    return rows.length;
  }

  async deleteExpired(now: string): Promise<number> {
    const rows = await this.db.query('DELETE FROM sessions WHERE expires_at <= $1::timestamptz RETURNING 1', [now]);
    return rows.length;
  }
}

// ---------------------------------------------------------------- pacientes, serviços, evoluções e sessões
interface Column {
  key: string;
  column: string;
  encrypted?: boolean;
  /** Tipo no PostgreSQL quando não for texto. dateBr = DATE exposto como DD/MM/AAAA. */
  type?: 'int' | 'bool' | 'timestamp' | 'date' | 'dateBr' | 'time';
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
    { key: 'phone', column: 'phone' },
    { key: 'email', column: 'email' },
    { key: 'birthDate', column: 'birth_date', type: 'dateBr' },
    { key: 'document', column: 'document_enc', encrypted: true },
    { key: 'service', column: 'service' },
    { key: 'treatmentStart', column: 'treatment_start', type: 'dateBr' },
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
  orderBy: 'lower(name)',
  searchColumn: 'name',
  columns: [
    { key: 'name', column: 'name' },
    { key: 'description', column: 'description' },
    { key: 'durationMin', column: 'duration_min', type: 'int' },
    { key: 'priceCents', column: 'price_cents', type: 'int' },
    { key: 'active', column: 'active', type: 'bool' },
  ],
};

const EVOLUTIONS: EntityDef = {
  table: 'evolutions',
  orderBy: 'session_date DESC, created_at DESC',
  columns: [
    { key: 'patientId', column: 'patient_id' },
    { key: 'sessionDate', column: 'session_date', type: 'dateBr' },
    { key: 'content', column: 'content_enc', encrypted: true },
    { key: 'authorId', column: 'author_id' },
    { key: 'authorName', column: 'author_name' },
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
    { key: 'professional', column: 'professional' },
    { key: 'status', column: 'status' },
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
      if (c.type === 'bool') return v === null ? null : Boolean(v);
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
    for (const [key, value] of Object.entries(opts.where ?? {})) {
      const col = this.byKey.get(key);
      if (!col || col.encrypted) throw new Error(`Filtro inválido: ${key}`);
      where.push(`${col.column} = ${p.add(value)}`);
    }
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
      if (c.type === 'bool') out[c.key] = raw === null || raw === undefined ? null : raw === true || raw === 1;
      else if (c.type === 'int') out[c.key] = raw === null || raw === undefined ? null : Number(raw);
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
    services: new PgRecordRepository<Service>(db, cipher, SERVICES),
    evolutions: new PgRecordRepository<Evolution>(db, cipher, EVOLUTIONS),
    appointments: new PgRecordRepository<Appointment>(db, cipher, APPOINTMENTS),
  };
}
