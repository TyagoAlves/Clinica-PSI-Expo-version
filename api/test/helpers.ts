import { randomBytes, randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/types.js';
import { createSqliteRepositories } from '../src/repositories/sqlite.js';
import { LoginRateLimiter } from '../src/security/loginRateLimiter.js';
import { createFieldCipher, type FieldCipher } from '../src/security/fieldCipher.js';
import { createTestDb, resetDb } from './db.js';

export interface TestCtx {
  app: Express;
  db: Db;
}

// Um banco SQLite em memória por arquivo de teste, zerado a cada makeApp().
let shared: Promise<Db> | null = null;
export async function testDb(): Promise<Db> {
  shared ??= createTestDb();
  const db = await shared;
  await resetDb(db);
  return db;
}

/** App com banco SQLite em memória e chave aleatória — cada teste começa limpo. */
export async function makeApp(
  opts: { limiter?: LoginRateLimiter; cipher?: FieldCipher; syncPageSize?: number } = {}
): Promise<TestCtx> {
  const db = await testDb();
  const repos = createSqliteRepositories(db, opts.cipher ?? createFieldCipher(randomBytes(32)));
  return {
    app: createApp({
      repos,
      logRequests: false,
      loginLimiter: opts.limiter ?? new LoginRateLimiter(),
      syncPageSize: opts.syncPageSize,
    }),
    db,
  };
}

/** Primeira linha de uma consulta (atalho para asserções diretas no banco). */
export async function one<T = Record<string, unknown>>(db: Db, sql: string, params: unknown[] = []): Promise<T> {
  return (await db.query<T>(sql, params))[0] as T;
}

let seq = 0;

/** Cadastra usuário + clínica e devolve token e ids. */
export async function signUp(app: Express, opts: { email?: string; clinic?: boolean } = {}) {
  const email = opts.email ?? `user${++seq}@clinica.com.br`;
  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Ana Souza', email, password: 'segredo1', crp: 'CRP 06/123456' });
  const token: string = reg.body.token;
  let clinicId: string | null = null;
  if (opts.clinic !== false) {
    const c = await request(app)
      .post('/api/v1/clinics')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clínica Psi', unit: 'Unidade Pinheiros', cnpj: '11.222.333/0001-81' });
    clinicId = c.body.id;
  }
  return { email, token, userId: reg.body.user.id as string, clinicId: clinicId as string };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export function patientChange(overrides: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: 'João da Silva',
    phone: '(11) 99999-0000',
    service: 'Psicoterapia',
    status: 'Em tratamento',
    complaint: 'Ansiedade',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}
