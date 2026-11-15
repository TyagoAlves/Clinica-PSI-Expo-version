import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, one, signUp } from './helpers.js';

describe('health', () => {
  it('GET /health responde ok com cabeçalhos de segurança', async () => {
    const { app } = await makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rota inexistente devolve 404 em JSON', async () => {
    const { app } = await makeApp();
    const res = await request(app).get('/api/v1/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('route_not_found');
  });
});

describe('auth', () => {
  it('registra, devolve token e não expõe hash/salt', async () => {
    const { app } = await makeApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ANA@clinica.com.br', password: 'segredo1' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@clinica.com.br');
    expect(res.body.token).toMatch(/^[\w-]{40,}$/);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('salt');
  });

  it('recusa e-mail duplicado (sem diferenciar maiúsculas) com 409', async () => {
    const { app } = await makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'Ana@Clinica.com.br', password: 'segredo1' });
    expect(res.status).toBe(409);
  });

  it('valida campos com as mensagens do app', async () => {
    const { app } = await makeApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@clinica.com.br', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('A senha precisa de ao menos 6 caracteres.');
  });

  it('banco não guarda a senha em claro', async () => {
    const { app, db } = await makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    const row = await one<{ password_hash: string }>(db, 'SELECT password_hash FROM users');
    expect(row.password_hash).toMatch(/^pbkdf2\$\d+\$[0-9a-f]{64}$/);
    expect(row.password_hash).not.toContain('segredo1');
  });

  it('login aceita senha certa e recusa errada, substring e e-mail inexistente', async () => {
    const { app } = await makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });

    const ok = await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password: 'segredo1' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
    expect(ok.body.clinic.name).toBe('Clínica Psi');

    for (const password of ['errada99', 'segredo', 'pbkdf2']) {
      const bad = await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password });
      expect(bad.status).toBe(401);
    }
    const unknown = await request(app).post('/api/v1/auth/login').send({ email: 'x@y.com', password: 'segredo1' });
    expect(unknown.status).toBe(401);
  });

  it('bloqueia força bruta com 429 depois de 5 erros', async () => {
    const { app } = await makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password: 'errada99' });
    }
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password: 'segredo1' });
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('rotas protegidas exigem token; logout revoga o token', async () => {
    const { app } = await makeApp();
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/me').set(auth('token-falso'))).status).toBe(401);

    const { token } = await signUp(app);
    const me = await request(app).get('/api/v1/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.clinic.name).toBe('Clínica Psi');

    expect((await request(app).post('/api/v1/auth/logout').set(auth(token))).status).toBe(204);
    expect((await request(app).get('/api/v1/me').set(auth(token))).status).toBe(401);
  });
});

describe('clínica criada junto com a conta', () => {
  it('vincula o usuário à clínica e deriva a sigla', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const me = await request(app).get('/api/v1/me').set(auth(token));
    expect(me.body.user.clinicId).toBe(clinicId);
    expect(me.body.clinic.acronym).toBe('CP');
  });

  it('sem nome de clínica, usa "Clínica Psi"', async () => {
    const { app } = await makeApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Bia', email: 'bia@clinica.com.br', password: 'segredo1' });
    expect(reg.status).toBe(201);
    expect(reg.body.clinic.name).toBe('Clínica Psi');
  });
});

describe('pacientes', () => {
  it('CRUD e soft delete', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/patients`;

    const missing = await request(app).post(base).set(auth(token)).send({ service: 'Psicoterapia' });
    expect(missing.status).toBe(400);
    expect(missing.body.error.message).toBe('Informe o nome completo.');

    const created = await request(app)
      .post(base)
      .set(auth(token))
      .send({ name: 'João', service: 'Psicoterapia', treatmentStart: '10/03/2026', complaint: 'Ansiedade' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: 'João', service: 'Psicoterapia', treatmentStart: '10/03/2026', complaint: 'Ansiedade' });

    const patched = await request(app).patch(`/api/v1/patients/${created.body.id}`).set(auth(token)).send({ service: 'Avaliação' });
    expect(patched.body.service).toBe('Avaliação');
    expect(patched.body.complaint).toBe('Ansiedade'); // patch parcial não apaga o resto

    expect((await request(app).delete(`/api/v1/patients/${created.body.id}`).set(auth(token))).status).toBe(204);
    expect((await request(app).get(base).set(auth(token))).body.items).toHaveLength(0);
    expect((await request(app).get(`/api/v1/patients/${created.body.id}`).set(auth(token))).status).toBe(404);
  });

  it('isola pacientes entre clínicas', async () => {
    const { app } = await makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = await request(app).post(`/api/v1/clinics/${a.clinicId}/patients`).set(auth(a.token)).send({ name: 'João' });

    expect((await request(app).get(`/api/v1/clinics/${a.clinicId}/patients`).set(auth(b.token))).status).toBe(403);
    expect((await request(app).get(`/api/v1/patients/${p.body.id}`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).delete(`/api/v1/patients/${p.body.id}`).set(auth(b.token))).status).toBe(404);
  });

  it('a descrição fica cifrada no banco e legível na API', async () => {
    const { app, db } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const created = await request(app)
      .post(`/api/v1/clinics/${clinicId}/patients`)
      .set(auth(token))
      .send({ name: 'João', complaint: 'Crises de pânico' });

    const row = await one<Record<string, string>>(db, 'SELECT complaint_enc FROM patients');
    expect(row.complaint_enc).toMatch(/^v1:/);
    expect(row.complaint_enc).not.toContain('pânico');
    expect(created.body.complaint).toBe('Crises de pânico');
  });

  it('id inválido devolve 400', async () => {
    const { app } = await makeApp();
    const { token } = await signUp(app);
    expect((await request(app).get('/api/v1/patients/abc').set(auth(token))).status).toBe(400);
  });
});
