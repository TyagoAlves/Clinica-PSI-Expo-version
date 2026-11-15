import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createFieldCipher, parseKey } from '../src/security/fieldCipher.js';
import { LoginRateLimiter } from '../src/security/loginRateLimiter.js';
import { deriveAcronym } from '../src/services/clinic.js';
import { hashPassword, verifyPassword } from '../src/services/password.js';

describe('fieldCipher', () => {
  it('cifra e decifra; IV aleatório gera textos diferentes', () => {
    const c = createFieldCipher(randomBytes(32));
    const a = c.encrypt('segredo clínico')!;
    const b = c.encrypt('segredo clínico')!;
    expect(a).not.toBe(b);
    expect(c.decrypt(a)).toBe('segredo clínico');
    expect(c.encrypt(null)).toBeNull();
    expect(c.encrypt('')).toBeNull();
  });

  it('detecta adulteração e chave errada', () => {
    const c = createFieldCipher(randomBytes(32));
    const stored = c.encrypt('x')!;
    const tampered = stored.slice(0, -2) + (stored.endsWith('A') ? 'B' : 'A') + '=';
    expect(() => c.decrypt(tampered)).toThrow();
    expect(() => createFieldCipher(randomBytes(32)).decrypt(stored)).toThrow();
  });

  it('rejeita chave de tamanho errado', () => {
    expect(() => parseKey(randomBytes(16).toString('base64'))).toThrow(/32 bytes/);
  });
});

describe('password', () => {
  it('verifica a senha certa e recusa a errada', async () => {
    const { hash, salt } = await hashPassword('segredo1');
    expect(await verifyPassword('segredo1', salt, hash)).toBe(true);
    expect(await verifyPassword('segredo2', salt, hash)).toBe(false);
    expect(await verifyPassword('segredo1', salt, 'lixo')).toBe(false);
  });
});

describe('LoginRateLimiter', () => {
  it('bloqueia após N falhas e libera após a janela', () => {
    const l = new LoginRateLimiter(3, 1000);
    for (let i = 0; i < 3; i++) l.fail('ip', 'a@b.com', 0);
    expect(l.retryAfter('ip', 'A@B.com', 10)).toBeGreaterThan(0);
    expect(l.retryAfter('outro-ip', 'a@b.com', 10)).toBe(0);
    expect(l.retryAfter('ip', 'a@b.com', 2000)).toBe(0);
  });
});

describe('deriveAcronym', () => {
  it.each([
    ['Clínica Psi', 'CP'],
    ['Espaço de Psicologia Integrada', 'EPI'],
    ['Mente', 'M'],
  ])('%s -> %s', (name, expected) => {
    expect(deriveAcronym(name)).toBe(expected);
  });
});
