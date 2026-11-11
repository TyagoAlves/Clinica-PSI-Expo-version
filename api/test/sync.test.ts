import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, patientChange, signUp } from './helpers.js';

const later = (iso: string, ms: number) => new Date(new Date(iso).getTime() + ms).toISOString();

describe('POST /api/v1/sync', () => {
  it('push de paciente criado offline e pull por outro aparelho', async () => {
    const { app } = makeApp();
    const { token } = await signUp(app);
    const p = patientChange();

    const first = await request(app)
      .post('/api/v1/sync')
      .set(auth(token))
      .send({ lastPulledRev: 0, changes: { patients: [p] } });
    expect(first.status).toBe(200);
    expect(first.body.rejected).toEqual([]);
    expect(first.body.rev).toBeGreaterThan(0);
    expect(first.body.changes.patients[0].id).toBe(p.id);

    // Segundo aparelho, do zero: recebe o paciente.
    const other = await request(app).post('/api/v1/sync').set(auth(token)).send({ lastPulledRev: 0 });
    expect(other.body.changes.patients).toHaveLength(1);
    expect(other.body.changes.patients[0].complaint).toBe('Ansiedade');

    // Sem novidades desde o último cursor.
    const none = await request(app).post('/api/v1/sync').set(auth(token)).send({ lastPulledRev: first.body.rev });
    expect(none.body.changes.patients).toHaveLength(0);
  });

  it('conflito: a edição mais recente vence', async () => {
    const { app } = makeApp();
    const { token } = await signUp(app);
    const p = patientChange();
    await request(app).post('/api/v1/sync').set(auth(token)).send({ changes: { patients: [p] } });

    const newer = { ...p, name: 'João (novo)', updatedAt: later(p.updatedAt, 60_000) };
    await request(app).post('/api/v1/sync').set(auth(token)).send({ changes: { patients: [newer] } });

    const stale = { ...p, name: 'João (velho)', updatedAt: later(p.updatedAt, 1_000) };
    const res = await request(app).post('/api/v1/sync').set(auth(token)).send({ lastPulledRev: 0, changes: { patients: [stale] } });
    expect(res.body.rejected).toEqual([p.id]);
    expect(res.body.changes.patients[0].name).toBe('João (novo)');
  });

  it('exclusão propaga como deletedAt', async () => {
    const { app } = makeApp();
    const { token } = await signUp(app);
    const p = patientChange();
    const r1 = await request(app).post('/api/v1/sync').set(auth(token)).send({ changes: { patients: [p] } });
    const del = { ...p, updatedAt: later(p.updatedAt, 5_000), deletedAt: later(p.updatedAt, 5_000) };
    const r2 = await request(app)
      .post('/api/v1/sync')
      .set(auth(token))
      .send({ lastPulledRev: r1.body.rev, changes: { patients: [del] } });
    expect(r2.body.changes.patients[0].deletedAt).toBe(del.deletedAt);
  });

  it('não permite sobrescrever paciente de outra clínica pelo ID', async () => {
    const { app } = makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = patientChange();
    await request(app).post('/api/v1/sync').set(auth(a.token)).send({ changes: { patients: [p] } });

    const attack = { ...p, name: 'Invadido', updatedAt: later(p.updatedAt, 60_000) };
    const res = await request(app).post('/api/v1/sync').set(auth(b.token)).send({ changes: { patients: [attack] } });
    expect(res.body.rejected).toEqual([p.id]);
    expect(res.body.changes.patients).toHaveLength(0);

    const check = await request(app).post('/api/v1/sync').set(auth(a.token)).send({});
    expect(check.body.changes.patients[0].name).toBe('João da Silva');
  });

  it('exige clínica cadastrada e valida payload', async () => {
    const { app } = makeApp();
    const noClinic = await signUp(app, { clinic: false });
    const r = await request(app).post('/api/v1/sync').set(auth(noClinic.token)).send({});
    expect(r.status).toBe(409);

    const { token } = await signUp(app);
    const bad = await request(app)
      .post('/api/v1/sync')
      .set(auth(token))
      .send({ changes: { patients: [patientChange({ id: '123' })] } });
    expect(bad.status).toBe(400);
  });
});
