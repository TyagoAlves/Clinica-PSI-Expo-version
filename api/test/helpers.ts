import { randomBytes, randomUUID } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDatabase, type Db } from '../src/db/connection.js';
import { createSqliteRepositories } from '../src/repositories/sqlite.js';
import { LoginRateLimiter } from '../src/security/loginRateLimiter.js';
import { createFieldCipher } from '../src/security/fieldCipher.js';

export interface TestCtx {
  app: Express;
  db: Db;
}

/** App com banco SQLite em memória e chave aleatória — cada teste começa limpo. */
export function makeApp(limiter = new LoginRateLimiter()): TestCtx {
  const db = openDatabase(':memory:');
  const repos = createSqliteRepositories(db, createFieldCipher(randomBytes(32)));
  return { app: createApp({ repos, logRequests: false, loginLimiter: limiter }), db };
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
      .send({ name: 'Clínica Psi', unit: 'Unidade Pinheiros', cnpj: '12.345.678/0001-90' });
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
