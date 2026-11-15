import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { isRealDateBr } from '../src/domain/validators.js';
import { auth, makeApp, signUp } from './helpers.js';

describe('validadores', () => {
  it('data DD/MM/AAAA precisa existir no calendário', () => {
    expect(isRealDateBr('10/03/2026')).toBe(true);
    expect(isRealDateBr('29/02/2024')).toBe(true);
    expect(isRealDateBr('29/02/2026')).toBe(false);
    expect(isRealDateBr('2026-03-10')).toBe(false);
    expect(isRealDateBr('01/01/1800')).toBe(false);
  });
});

describe('normalização ao gravar', () => {
  it('paciente: nome sem espaços extras; textos vazios viram null', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const res = await request(app)
      .post(`/api/v1/clinics/${clinicId}/patients`)
      .set(auth(token))
      .send({ name: '  Maria   da  Silva ', service: '', complaint: '   ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Maria da Silva', service: null, treatmentStart: null, complaint: null });
  });

  it('paciente: recusa dados inválidos com mensagem clara', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/patients`;
    const tries: [Record<string, unknown>, string][] = [
      [{ name: 'Maria 123' }, 'O nome deve ter só letras.'],
      [{ name: 'Maria', treatmentStart: '31/02/2026' }, 'Início do tratamento inválido (DD/MM/AAAA).'],
      [{ name: 'Maria', treatmentStart: '2026-03-10' }, 'Início do tratamento inválido (DD/MM/AAAA).'],
    ];
    for (const [body, msg] of tries) {
      const res = await request(app).post(base).set(auth(token)).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.message).toBe(msg);
    }
  });

  it('cadastro: e-mail em minúsculas e nome só com letras', async () => {
    const { app } = await makeApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana  Souza', email: 'ANA@X.COM', password: 'segredo1' });
    expect(reg.body.user).toMatchObject({ name: 'Ana Souza', email: 'ana@x.com' });
    const bad = await request(app).post('/api/v1/auth/register').send({ name: 'Ana 2', email: 'b@x.com', password: 'segredo1' });
    expect(bad.body.error.message).toBe('O nome deve ter só letras.');
  });
});
