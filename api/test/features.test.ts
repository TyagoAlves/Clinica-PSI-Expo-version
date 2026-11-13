import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, one, signUp } from './helpers.js';

async function createPatient(app: Parameters<typeof request>[0], token: string, clinicId: string, name = 'João') {
  const res = await request(app)
    .post(`/api/v1/clinics/${clinicId}/patients`)
    .set(auth(token))
    .send({ name, phone: '11999990000', service: 'Psicoterapia' });
  return res.body as { id: string };
}

describe('serviços e profissionais', () => {
  it('clínica nova vem com o catálogo padrão e lista os profissionais', async () => {
    const { app } = await makeApp();
    const { token, clinicId, userId } = await signUp(app);
    const services = await request(app).get(`/api/v1/clinics/${clinicId}/services`).set(auth(token));
    expect(services.body.items.map((s: { name: string }) => s.name)).toEqual(['Acompanhamento', 'Avaliação', 'Psicoterapia']);

    const members = await request(app).get(`/api/v1/clinics/${clinicId}/members`).set(auth(token));
    expect(members.body).toEqual([{ id: userId, name: 'Ana Souza', crp: 'CRP 06/123456', role: 'psychologist' }]);
  });

  it('CRUD de serviço, sem nome duplicado', async () => {
    const { app } = await makeApp();
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
    const { app, db } = await makeApp();
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

    const row = await one<{ content_enc: string }>(db, 'SELECT content_enc FROM evolutions');
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
    const { app } = await makeApp();
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
