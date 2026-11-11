import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { auth, makeApp, signUp } from './helpers.js';

describe('health', () => {
  it('GET /health responde ok com cabeçalhos de segurança', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rota inexistente devolve 404 em JSON', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/api/v1/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('route_not_found');
  });
});

describe('auth', () => {
  it('registra, devolve token e não expõe hash/salt', async () => {
    const { app } = makeApp();
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
    const { app } = makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'Ana@Clinica.com.br', password: 'segredo1' });
    expect(res.status).toBe(409);
  });

  it('valida campos com as mensagens do app', async () => {
    const { app } = makeApp();
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'ana@clinica.com.br', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('A senha precisa de ao menos 6 caracteres.');
  });

  it('banco não guarda a senha em claro', async () => {
    const { app, db } = makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    const row = db.prepare('SELECT password_hash FROM users').get() as { password_hash: string };
    expect(row.password_hash).toMatch(/^pbkdf2\$\d+\$[0-9a-f]{64}$/);
    expect(row.password_hash).not.toContain('segredo1');
  });

  it('login aceita senha certa e recusa errada, substring e e-mail inexistente', async () => {
    const { app } = makeApp();
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
    const { app } = makeApp();
    await signUp(app, { email: 'ana@clinica.com.br' });
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password: 'errada99' });
    }
    const res = await request(app).post('/api/v1/auth/login').send({ email: 'ana@clinica.com.br', password: 'segredo1' });
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('rotas protegidas exigem token; logout revoga o token', async () => {
    const { app } = makeApp();
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/me').set(auth('token-falso'))).status).toBe(401);

    const { token } = await signUp(app);
    const me = await request(app).get('/api/v1/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.clinic.unit).toBe('Unidade Pinheiros');

    expect((await request(app).post('/api/v1/auth/logout').set(auth(token))).status).toBe(204);
    expect((await request(app).get('/api/v1/me').set(auth(token))).status).toBe(401);
  });
});

describe('clínicas', () => {
  it('vincula o usuário à clínica criada e deriva a sigla', async () => {
    const { app } = makeApp();
    const { token, clinicId } = await signUp(app);
    const me = await request(app).get('/api/v1/me').set(auth(token));
    expect(me.body.user.clinicId).toBe(clinicId);
    expect(me.body.clinic.acronym).toBe('CP');
  });

  it('não deixa criar segunda clínica nem ver clínica alheia', async () => {
    const { app } = makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const again = await request(app).post('/api/v1/clinics').set(auth(a.token)).send({ name: 'Outra' });
    expect(again.status).toBe(409);
    const other = await request(app).get(`/api/v1/clinics/${b.clinicId}`).set(auth(a.token));
    expect(other.status).toBe(403);
  });
});

describe('pacientes', () => {
  it('CRUD com regras de negócio e soft delete', async () => {
    const { app } = makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/patients`;

    const missing = await request(app).post(base).set(auth(token)).send({ name: 'João' });
    expect(missing.status).toBe(400);
    expect(missing.body.error.message).toBe('Informe um telefone de contato.');

    const badDate = await request(app)
      .post(base)
      .set(auth(token))
      .send({ name: 'João', phone: '11', service: 'Psicoterapia', birthDate: '2020-01-01' });
    expect(badDate.status).toBe(400);

    const created = await request(app)
      .post(base)
      .set(auth(token))
      .send({ name: 'João', phone: '(11) 99999-0000', service: 'Psicoterapia', birthDate: '10/02/1990' });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('Em tratamento');

    const patched = await request(app).patch(`/api/v1/patients/${created.body.id}`).set(auth(token)).send({ status: 'Alta' });
    expect(patched.body.status).toBe('Alta');

    expect((await request(app).delete(`/api/v1/patients/${created.body.id}`).set(auth(token))).status).toBe(204);
    expect((await request(app).get(base).set(auth(token))).body.items).toHaveLength(0);
    expect((await request(app).get(`/api/v1/patients/${created.body.id}`).set(auth(token))).status).toBe(404);
  });

  it('isola pacientes entre clínicas', async () => {
    const { app } = makeApp();
    const a = await signUp(app);
    const b = await signUp(app);
    const p = await request(app)
      .post(`/api/v1/clinics/${a.clinicId}/patients`)
      .set(auth(a.token))
      .send({ name: 'João', phone: '11', service: 'Psicoterapia' });

    expect((await request(app).get(`/api/v1/clinics/${a.clinicId}/patients`).set(auth(b.token))).status).toBe(403);
    expect((await request(app).get(`/api/v1/patients/${p.body.id}`).set(auth(b.token))).status).toBe(404);
    expect((await request(app).delete(`/api/v1/patients/${p.body.id}`).set(auth(b.token))).status).toBe(404);
  });

  it('campos clínicos ficam cifrados no banco e legíveis na API', async () => {
    const { app, db } = makeApp();
    const { token, clinicId } = await signUp(app);
    const created = await request(app)
      .post(`/api/v1/clinics/${clinicId}/patients`)
      .set(auth(token))
      .send({ name: 'João', phone: '11', service: 'Psicoterapia', complaint: 'Crises de pânico', document: '123.456.789-00' });

    const row = db.prepare('SELECT complaint_enc, document_enc FROM patients').get() as Record<string, string>;
    expect(row.complaint_enc).toMatch(/^v1:/);
    expect(row.complaint_enc).not.toContain('pânico');
    expect(row.document_enc).not.toContain('123.456');
    expect(created.body.complaint).toBe('Crises de pânico');
  });

  it('id inválido devolve 400', async () => {
    const { app } = makeApp();
    const { token } = await signUp(app);
    expect((await request(app).get('/api/v1/patients/abc').set(auth(token))).status).toBe(400);
  });
});
