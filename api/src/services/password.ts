// Derivação de senha com PBKDF2-SHA256 (node:crypto), como os guias pedem:
// a senha nunca é guardada, só o derivado + salt. Parâmetros finais são decisão de segurança do backend.
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

const ITERATIONS = 210_000; // recomendação OWASP para PBKDF2-HMAC-SHA256
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16).toString('hex');
  const key = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return { hash: `pbkdf2$${ITERATIONS}$${key.toString('hex')}`, salt };
}

export async function verifyPassword(password: string, salt: string, stored: string): Promise<boolean> {
  const [scheme, iterStr, hex] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterStr || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const key = await pbkdf2Async(password, salt, Number(iterStr), expected.length, DIGEST);
  return key.length === expected.length && timingSafeEqual(key, expected);
}
