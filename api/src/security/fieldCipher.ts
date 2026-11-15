// Criptografia dos campos clínicos sensíveis no banco (AES-256-GCM).
// Formato gravado: "v1:<iv b64>:<tag b64>:<cifra b64>". A chave fica em DATA_ENCRYPTION_KEY (.env).
// Perder a chave = perder os dados cifrados.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface FieldCipher {
  encrypt(plain: string | null): string | null;
  decrypt(stored: string | null): string | null;
}

const KEY_ID = 'v1';

export function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('Chave de criptografia precisa ter 32 bytes em base64 (gere com: npm run gen:key).');
  }
  return key;
}

export function createFieldCipher(key: Buffer): FieldCipher {
  return {
    encrypt(plain) {
      if (plain === null || plain === '') return null;
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return [KEY_ID, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
    },
    decrypt(stored) {
      if (stored === null) return null;
      const [, ivB64, tagB64, ctB64] = stored.split(':');
      if (!ivB64 || !tagB64 || ctB64 === undefined) throw new Error('Campo criptografado em formato desconhecido.');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
    },
  };
}
