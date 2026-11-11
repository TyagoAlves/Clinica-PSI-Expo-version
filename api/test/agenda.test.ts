import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, one, patientChange, signUp } from './helpers.js';

type App = Parameters<typeof request>[0];

async function createPatient(app: App, token: string, clinicId: string, name = 'João') {
  const res = await request(app)
    .post(`/api/v1/clinics/${clinicId}/patients`)
    .set(auth(token))
    .send({ name, phone: '11999990000', service: 'Psicoterapia' });
  return res.body as { id: string };
}

describe('serviços completos (Tela 9)', () => {
  it('catálogo padrão vem com descrição, duração, preço e ativo', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const res = await request(app).get(`/api/v1/clinics/${clinicId}/services`).set(auth(token));
    const psico = res.body.items.find((s: { name: string }) => s.name === 'Psicoterapia');
    expect(psico).toMatchObject({
      description: 'Sessões semanais de atendimento psicológico.',
      durationMin: 50,
      priceCents: 15000,
      active: true,
    });
  });

  it('cria com todos os campos, desativa pelo toggle e valida valores', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/services`;
    const bad = await request(app).post(base).set(auth(token)).send({ name: 'X', durationMin: 2 });
    expect(bad.status).toBe(400);
    expect(bad.body.error.message).toBe('Duração mínima de 5 minutos.');

    const created = await request(app)
      .post(base)
      .set(auth(token))
      .send({ name: 'Orientação parental', description: 'Para pais', durationMin: 45, priceCents: 9990 });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ durationMin: 45, priceCents: 9990, active: true });

    const off = await request(app).patch(`/api/v1/services/${created.body.id}`).set(auth(token)).send({ active: false });
    expect(off.body.active).toBe(false);
    expect(off.body.name).toBe('Orientação parental'); // patch parcial não apaga o resto
  });
});

describe('agenda — sessões (Tela 8)', () => {
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
    expect(s1.body.status).toBe('Agendada');

    const day = await request(app).get(`${base}?from=2026-11-10&to=2026-11-10`).set(auth(token));
    expect(day.body.items.map((s: { time: string }) => s.time)).toEqual(['09:30', '16:00']);

    const done = await request(app).patch(`/api/v1/appointments/${s2.body.id}`).set(auth(token)).send({ status: 'Realizada' });
    expect(done.body.status).toBe('Realizada');
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

  it('sessão criada offline sobe pelo /sync junto com o paciente; observações cifradas', async () => {
    const { app, db } = await makeApp();
    const { token } = await signUp(app);
    const p = patientChange();
    const now = new Date().toISOString();
    const appt = {
      id: randomUUID(),
      patientId: p.id,
      date: '2026-11-12',
      time: '08:00',
      durationMin: 50,
      service: 'Psicoterapia',
      professional: 'Ana Souza',
      status: 'Agendada',
      notes: 'Trazer exames',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    const res = await request(app).post('/api/v1/sync').set(auth(token)).send({ changes: { patients: [p], appointments: [appt] } });
    expect(res.body.rejected).toEqual([]);
    expect(res.body.changes.appointments[0]).toMatchObject({ id: appt.id, time: '08:00', notes: 'Trazer exames' });
    const row = await one<{ notes_enc: string }>(db, 'SELECT notes_enc FROM appointments');
    expect(row.notes_enc).not.toContain('exames');
  });
});

describe('perfil e senha (Tela 10 — Configurações)', () => {
  it('edita nome e CRP', async () => {
    const { app } = await makeApp();
    const { token } = await signUp(app);
    const res = await request(app).patch('/api/v1/me').set(auth(token)).send({ name: 'Ana S. Souza', crp: 'CRP 06/654321' });
    expect(res.body).toMatchObject({ name: 'Ana S. Souza', crp: 'CRP 06/654321' });
    expect(res.body).not.toHaveProperty('passwordHash');
    expect((await request(app).patch('/api/v1/me').set(auth(token)).send({ crp: 'xyz' })).status).toBe(400);
  });

  it('troca a senha exigindo a atual e encerra as outras sessões', async () => {
    const { app } = await makeApp();
    const { token, email } = await signUp(app);
    const other = await request(app).post('/api/v1/auth/login').send({ email, password: 'segredo1' });

    const wrong = await request(app)
      .post('/api/v1/auth/change-password')
      .set(auth(token))
      .send({ currentPassword: 'errada', newPassword: 'novaSenha9' });
    expect(wrong.status).toBe(400);

    const ok = await request(app)
      .post('/api/v1/auth/change-password')
      .set(auth(token))
      .send({ currentPassword: 'segredo1', newPassword: 'novaSenha9' });
    expect(ok.status).toBe(204);

    expect((await request(app).get('/api/v1/me').set(auth(token))).status).toBe(200); // sessão atual continua
    expect((await request(app).get('/api/v1/me').set(auth(other.body.token))).status).toBe(401); // outra caiu
    expect((await request(app).post('/api/v1/auth/login').send({ email, password: 'segredo1' })).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/login').send({ email, password: 'novaSenha9' })).status).toBe(200);
  });
});

describe('consultas usadas pelo app online', () => {
  it('últimas evoluções da clínica e sessões de um paciente', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const p1 = await createPatient(app, token, clinicId, 'Ana');
    const p2 = await createPatient(app, token, clinicId, 'Bia');
    for (const p of [p1, p2]) {
      await request(app).post(`/api/v1/patients/${p.id}/evolutions`).set(auth(token)).send({ sessionDate: '10/11/2026', content: `evo ${p.id}` });
      await request(app)
        .post(`/api/v1/clinics/${clinicId}/appointments`)
        .set(auth(token))
        .send({ patientId: p.id, date: '2026-11-12', time: '09:00', durationMin: 50 });
    }
    const recent = await request(app).get(`/api/v1/clinics/${clinicId}/evolutions?limit=5`).set(auth(token));
    expect(recent.body.items).toHaveLength(2);
    const doP1 = await request(app).get(`/api/v1/clinics/${clinicId}/appointments?patientId=${p1.id}`).set(auth(token));
    expect(doP1.body.items).toHaveLength(1);
    expect(doP1.body.items[0].patientId).toBe(p1.id);
  });
});
