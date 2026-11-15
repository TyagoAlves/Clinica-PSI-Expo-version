import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, one, signUp } from './helpers.js';

type App = Parameters<typeof request>[0];

async function createPatient(app: App, token: string, clinicId: string, name = 'João') {
  const res = await request(app)
    .post(`/api/v1/clinics/${clinicId}/patients`)
    .set(auth(token))
    .send({ name, service: 'Psicoterapia' });
  return res.body as { id: string };
}

describe('agenda — sessões', () => {
  it('CRUD, filtro por dia e ordenação por horário', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const p = await createPatient(app, token, clinicId);
    const base = `/api/v1/clinics/${clinicId}/appointments`;
    const mk = (date: string, time: string) =>
      request(app).post(base).set(auth(token)).send({ patientId: p.id, date, time, durationMin: 50, service: 'Psicoterapia' });

    expect((await mk('10/11/2026', '14:00')).status).toBe(400); // data precisa ser AAAA-MM-DD
    expect((await mk('2026-11-10', '25:00')).status).toBe(400);
    const s2 = await mk('2026-11-10', '16:00');
    const s1 = await mk('2026-11-10', '09:30');
    await mk('2026-11-11', '10:00');

    const day = await request(app).get(`${base}?from=2026-11-10&to=2026-11-10`).set(auth(token));
    expect(day.body.items.map((s: { time: string }) => s.time)).toEqual(['09:30', '16:00']);

    const moved = await request(app).patch(`/api/v1/appointments/${s2.body.id}`).set(auth(token)).send({ time: '17:00' });
    expect(moved.body).toMatchObject({ time: '17:00', service: 'Psicoterapia' });
    expect((await request(app).delete(`/api/v1/appointments/${s1.body.id}`).set(auth(token))).status).toBe(204);
    expect((await request(app).get(`${base}?from=2026-11-10&to=2026-11-10`).set(auth(token))).body.items).toHaveLength(1);
  });

  it('isola sessões entre clínicas e exige paciente da própria clínica', async () => {
    const { app } = await makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = await createPatient(app, a.token, a.clinicId);
    const s = await request(app)
      .post(`/api/v1/clinics/${a.clinicId}/appointments`)
      .set(auth(a.token))
      .send({ patientId: p.id, date: '2026-11-10', time: '10:00', durationMin: 50 });
    expect((await request(app).get(`/api/v1/appointments/${s.body.id}`).set(auth(b.token))).status).toBe(404);
    const cross = await request(app)
      .post(`/api/v1/clinics/${b.clinicId}/appointments`)
      .set(auth(b.token))
      .send({ patientId: p.id, date: '2026-11-10', time: '10:00', durationMin: 50 });
    expect(cross.status).toBe(404);
  });

  it('observações da sessão ficam cifradas no banco e legíveis na API', async () => {
    const { app, db } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const p = await createPatient(app, token, clinicId);
    const res = await request(app)
      .post(`/api/v1/clinics/${clinicId}/appointments`)
      .set(auth(token))
      .send({ patientId: p.id, date: '2026-11-12', time: '08:00', durationMin: 50, notes: 'Trazer exames' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ time: '08:00', notes: 'Trazer exames' });
    const row = await one<{ notes_enc: string }>(db, 'SELECT notes_enc FROM appointments');
    expect(row.notes_enc).not.toContain('exames');
  });
});

describe('paginação', () => {
  it('lista pacientes em páginas, com busca por nome', async () => {
    const { app } = await makeApp();
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
});
