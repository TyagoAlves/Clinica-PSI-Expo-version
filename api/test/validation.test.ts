import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { isValidCnpj, isValidCpf, isValidPhone, normalizeCrp } from '../src/domain/validators.js';
import { auth, makeApp, one, signUp } from './helpers.js';

describe('validadores', () => {
  it('CPF, CNPJ, telefone e CRP', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('123.456.789-00')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-80')).toBe(false);
    expect(isValidPhone('61 9 0000-0000')).toBe(true);
    expect(isValidPhone('61 3000-0000')).toBe(true);
    expect(isValidPhone('61 8 0000-0000')).toBe(false); // 11 dígitos sem o 9
    expect(isValidPhone('00 3000-0000')).toBe(false); // DDD inválido
    expect(normalizeCrp('crp 6/12345')).toBe('CRP 06/12345');
    expect(normalizeCrp('06123456')).toBe('CRP 06/123456');
    expect(normalizeCrp('abc')).toBeNull();
  });
});

describe('normalização ao gravar', () => {
  it('paciente: telefone e CPF viram só dígitos; e-mail minúsculo; nome sem espaços extras', async () => {
    const { app, db } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const res = await request(app)
      .post(`/api/v1/clinics/${clinicId}/patients`)
      .set(auth(token))
      .send({
        name: '  Maria   da  Silva ',
        phone: '61 9 0000-0000',
        email: 'Maria@Email.COM',
        document: '529.982.247-25',
        service: 'Psicoterapia',
        birthDate: '10/02/1990',
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Maria da Silva', phone: '61900000000', email: 'maria@email.com', document: '52998224725' });
    const row = await one<{ phone: string }>(db, 'SELECT phone FROM patients');
    expect(row.phone).toBe('61900000000');
  });

  it('paciente: recusa dados inválidos com mensagem clara', async () => {
    const { app } = await makeApp();
    const { token, clinicId } = await signUp(app);
    const base = `/api/v1/clinics/${clinicId}/patients`;
    const ok = { name: 'Maria', phone: '61900000000', service: 'Psicoterapia' };
    const tries: [Record<string, unknown>, string][] = [
      [{ ...ok, phone: '6190000' }, 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).'],
      [{ ...ok, name: 'Maria 123' }, 'O nome deve ter só letras.'],
      [{ ...ok, document: '123.456.789-00' }, 'CPF inválido (dígito verificador).'],
      [{ ...ok, birthDate: '31/02/1990' }, 'Nascimento inválido (DD/MM/AAAA).'],
      [{ ...ok, birthDate: '01/01/2999' }, 'A data de nascimento não pode estar no futuro.'],
      [{ ...ok, email: 'maria@' }, 'Informe um e-mail válido.'],
    ];
    for (const [body, msg] of tries) {
      const res = await request(app).post(base).set(auth(token)).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body.error.message).toBe(msg);
    }
    // RG com letra é aceito como documento
    const rg = await request(app).post(base).set(auth(token)).send({ ...ok, document: '12.345.678-x' });
    expect(rg.body.document).toBe('12345678X');
  });

  it('clínica e cadastro: CNPJ/telefone só dígitos, CRP padronizado, sigla só letras', async () => {
    const { app } = await makeApp();
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana Souza', email: 'ANA@X.COM', password: 'segredo1', crp: '06/123456' });
    expect(reg.body.user).toMatchObject({ email: 'ana@x.com', crp: 'CRP 06/123456' });

    const token = reg.body.token as string;
    const bad = await request(app).post('/api/v1/clinics').set(auth(token)).send({ name: 'C', cnpj: '11.222.333/0001-80' });
    expect(bad.body.error.message).toBe('CNPJ ou CPF inválido (confira os números).');
    const badSigla = await request(app).post('/api/v1/clinics').set(auth(token)).send({ name: 'C', acronym: 'C1' });
    expect(badSigla.status).toBe(400);

    const c = await request(app)
      .post('/api/v1/clinics')
      .set(auth(token))
      .send({ name: 'Clínica Psi', cnpj: '11.222.333/0001-81', phone: '(61) 3000-0000', acronym: 'cp' });
    expect(c.body).toMatchObject({ cnpj: '11222333000181', phone: '6130000000', acronym: 'CP' });
  });
});
