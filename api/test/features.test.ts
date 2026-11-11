import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db/connection.js';
import { createSqliteRepositories } from '../src/repositories/sqlite.js';
import { createFieldCipher } from '../src/security/fieldCipher.js';
import { auth, makeApp, patientChange, signUp } from './helpers.js';

async function createPatient(app: Parameters<typeof request>[0], token: string, clinicId: string, name = 'João') {
  const res = await request(app)
    .post(`/api/v1/clinics/${clinicId}/patients`)
    .set(auth(token))
    .send({ name, phone: '11999990000', service: 'Psicoterapia' });
  return res.body as { id: string };
}

describe('serviços e profissionais', () => {
  it('clínica nova vem com o catálogo padrão e lista os profissionais', async () => {
    const { app } = makeApp();
    const { token, clinicId, userId } = await signUp(app);
    const services = await request(app).get(`/api/v1/clinics/${clinicId}/services`).set(auth(token));
    expect(services.body.items.map((s: { name: string }) => s.name)).toEqual(['Acompanhamento', 'Avaliação', 'Psicoterapia']);

    const members = await request(app).get(`/api/v1/clinics/${clinicId}/members`).set(auth(token));
    expect(members.body).toEqual([{ id: userId, name: 'Ana Souza', crp: 'CRP 06/123456', role: 'psychologist' }]);
  });

  it('CRUD de serviço, sem nome duplicado', async () => {
    const { app } = makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/services`;
    const created = await request(app).post(base).set(auth(token)).send({ name: 'Orientação parental' });
    expect(created.status).toBe(201);
    expect((await request(app).post(base).set(auth(token)).send({ name: 'psicoterapia' })).status).toBe(409);
    const renamed = await request(app).patch(`/api/v1/services/${created.body.id}`).set(auth(token)).send({ name: 'Orientação' });
    expect(renamed.body.name).toBe('Orientação');
    expect((await request(app).delete(`/api/v1/services/${created.body.id}`).set(auth(token))).status).toBe(204);
    expect((await request(app).get(base).set(auth(token))).body.total).toBe(3);
  });
});

describe('evoluções (prontuário)', () => {
  it('cria, lista, edita e exclui; conteúdo cifrado; autor = usuário logado', async () => {
    const { app, db } = makeApp();
    const { token, clinicId, userId } = await signUp(app);
    const p = await createPatient(app, token, clinicId);
    const base = `/api/v1/patients/${p.id}/evolutions`;

    expect((await request(app).post(base).set(auth(token)).send({ sessionDate: '2026-11-10', content: 'x' })).status).toBe(400);
    const ev = await request(app)
      .post(base)
      .set(auth(token))
      .send({ sessionDate: '10/11/2026', content: 'Paciente relata melhora do sono.' });
    expect(ev.status).toBe(201);
    expect(ev.body.authorId).toBe(userId);
    expect(ev.body.authorName).toBe('Ana Souza');

    const row = db.prepare('SELECT content_enc FROM evolutions').get() as { content_enc: string };
    expect(row.content_enc).toMatch(/^v1:/);
    expect(row.content_enc).not.toContain('sono');

    const list = await request(app).get(base).set(auth(token));
    expect(list.body.items).toHaveLength(1);

    const edited = await request(app).patch(`/api/v1/evolutions/${ev.body.id}`).set(auth(token)).send({ content: 'Editado' });
    expect(edited.body.content).toBe('Editado');
    expect((await request(app).delete(`/api/v1/evolutions/${ev.body.id}`).set(auth(token))).status).toBe(204);
    expect((await request(app).get(base).set(auth(token))).body.items).toHaveLength(0);
  });

  it('isola evoluções entre clínicas', async () => {
    const { app } = makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = await createPatient(app, a.token, a.clinicId);
    const ev = await request(app)
      .post(`/api/v1/patients/${p.id}/evolutions`)
      .set(auth(a.token))
      .send({ sessionDate: '10/11/2026', content: 'sigiloso' });
    expect((await request(app).get(`/api/v1/patients/${p.id}/evolutions`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).get(`/api/v1/evolutions/${ev.body.id}`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).post(`/api/v1/patients/${p.id}/evolutions`).set(auth(b.token)).send({ sessionDate: '10/11/2026', content: 'x' })).status).toBe(404);
  });
});

describe('paginação', () => {
  it('lista pacientes em páginas, com busca por nome', async () => {
    const { app } = makeApp();
    const { token, clinicId } = await signUp(app);
    for (const n of ['Ana', 'Bruno', 'Carla', 'Daniel', 'Elisa']) await createPatient(app, token, clinicId, n);
    const base = `/api/v1/clinics/${clinicId}/patients`;

    const p1 = await request(app).get(`${base}?limit=2`).set(auth(token));
    expect(p1.body.items.map((p: { name: string }) => p.name)).toEqual(['Ana', 'Bruno']);
    expect(p1.body).toMatchObject({ total: 5, nextOffset: 2 });
    const p3 = await request(app).get(`${base}?limit=2&offset=4`).set(auth(token));
    expect(p3.body).toMatchObject({ nextOffset: null });

    const found = await request(app).get(`${base}?search=ar`).set(auth(token));
    expect(found.body.items.map((p: { name: string }) => p.name)).toEqual(['Carla']);
    expect((await request(app).get(`${base}?limit=999`).set(auth(token))).status).toBe(400);
  });

  it('pull do /sync vem em páginas até hasMore = false', async () => {
    const db = openDatabase(':memory:');
    const app = createApp({
      repos: createSqliteRepositories(db, createFieldCipher(randomBytes(32))),
      logRequests: false,
      syncPageSize: 2,
    });
    const { token } = await signUp(app);
    const pushed = Array.from({ length: 4 }, (_, i) => patientChange({ name: `P${i}` }));
    await request(app).post('/api/v1/sync').set(auth(token)).send({ changes: { patients: pushed } });

    let cursor = 0;
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/api/v1/sync').set(auth(token)).send({ lastPulledRev: cursor });
      for (const k of ['patients', 'services', 'evolutions'] as const) for (const r of res.body.changes[k]) seen.add(r.id);
      cursor = res.body.rev;
      if (!res.body.hasMore) break;
    }
    expect(seen.size).toBe(4 + 3); // 4 pacientes + 3 serviços padrão
    const last = await request(app).post('/api/v1/sync').set(auth(token)).send({ lastPulledRev: cursor });
    expect(last.body.hasMore).toBe(false);
    expect(last.body.changes.patients).toHaveLength(0);
  });
});

describe('sync de serviços e evoluções', () => {
  it('evolução criada offline sobe junto com o paciente e o autor é preservado', async () => {
    const { app } = makeApp();
    const { token, userId } = await signUp(app);
    const p = patientChange();
    const now = new Date().toISOString();
    const ev = { id: randomUUID(), patientId: p.id, sessionDate: '10/11/2026', content: 'Primeira sessão', createdAt: now, updatedAt: now, deletedAt: null };
    const svc = { id: randomUUID(), name: 'Neuropsicologia', createdAt: now, updatedAt: now, deletedAt: null };

    const res = await request(app)
      .post('/api/v1/sync')
      .set(auth(token))
      .send({ changes: { patients: [p], evolutions: [ev], services: [svc] } });
    expect(res.body.rejected).toEqual([]);
    expect(res.body.changes.evolutions[0]).toMatchObject({ id: ev.id, authorId: userId, content: 'Primeira sessão' });
    expect(res.body.changes.services.map((s: { name: string }) => s.name)).toContain('Neuropsicologia');
  });

  it('rejeita evolução apontando para paciente de outra clínica', async () => {
    const { app } = makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = await createPatient(app, a.token, a.clinicId);
    const now = new Date().toISOString();
    const ev = { id: randomUUID(), patientId: p.id, sessionDate: '10/11/2026', content: 'x', createdAt: now, updatedAt: now };
    const res = await request(app).post('/api/v1/sync').set(auth(b.token)).send({ changes: { evolutions: [ev] } });
    expect(res.body.rejected).toEqual([ev.id]);
  });
});

describe('auditoria (LGPD)', () => {
  it('registra leitura e escrita de dado clínico; só o dono/admin consulta', async () => {
    const { app, db } = makeApp();
    const { token, clinicId } = await signUp(app);
    const p = await createPatient(app, token, clinicId);
    await request(app).get(`/api/v1/patients/${p.id}`).set(auth(token));
    await request(app).post(`/api/v1/patients/${p.id}/evolutions`).set(auth(token)).send({ sessionDate: '10/11/2026', content: 'segredo' });

    const log = await request(app).get(`/api/v1/clinics/${clinicId}/audit`).set(auth(token));
    expect(log.status).toBe(200);
    const actions = log.body.items.map((e: { action: string; entity: string }) => `${e.action}:${e.entity}`);
    expect(actions).toEqual(expect.arrayContaining(['create:patient', 'read:patient', 'create:evolution']));
    // A auditoria nunca guarda o conteúdo clínico.
    const dump = JSON.stringify(db.prepare('SELECT * FROM audit_log').all());
    expect(dump).not.toContain('segredo');

    // Outro usuário (sem ser dono) na mesma clínica não pode — simulado vinculando um 2º usuário.
    const other = await signUp(app, { clinic: false });
    db.prepare('UPDATE users SET clinic_id = ? WHERE id = ?').run(clinicId, other.userId);
    expect((await request(app).get(`/api/v1/clinics/${clinicId}/audit`).set(auth(other.token))).status).toBe(403);
    expect((await request(app).get(`/api/v1/clinics/${clinicId}/members`).set(auth(other.token))).body).toHaveLength(2);
  });
});

describe('rotação de chave', () => {
  it('lê dados da chave antiga e re-cifra tudo com a nova', async () => {
    const db = openDatabase(':memory:');
    const oldKey = randomBytes(32);
    const appOld = createApp({ repos: createSqliteRepositories(db, createFieldCipher(oldKey, 'v1')), logRequests: false });
    const { token, clinicId } = await signUp(appOld);
    await request(appOld)
      .post(`/api/v1/clinics/${clinicId}/patients`)
      .set(auth(token))
      .send({ name: 'João', phone: '11', service: 'Psicoterapia', complaint: 'Insônia' });

    const newKey = randomBytes(32);
    const rotated = createFieldCipher(newKey, 'v2', new Map([['v1', oldKey]]));
    const repos = createSqliteRepositories(db, rotated);
    const before = (await repos.patients.list(clinicId, { limit: 10, offset: 0 })).items[0]!;
    expect(before.complaint).toBe('Insônia'); // decifra com a chave antiga

    expect(await repos.patients.reencryptAll!()).toBe(1);
    expect(await repos.patients.reencryptAll!()).toBe(0);
    const row = db.prepare('SELECT complaint_enc FROM patients').get() as { complaint_enc: string };
    expect(row.complaint_enc).toMatch(/^v2:/);

    // Chave antiga descartada: só com a nova ainda lê tudo.
    const onlyNew = createSqliteRepositories(db, createFieldCipher(newKey, 'v2'));
    expect((await onlyNew.patients.list(clinicId, { limit: 10, offset: 0 })).items[0]!.complaint).toBe('Insônia');
  });
});
