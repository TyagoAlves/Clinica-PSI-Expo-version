// Criptografia de campos clínicos sensíveis em repouso (AES-256-GCM), com rotação de chave.
// Formato gravado no banco: "<keyId>:<iv b64>:<tag b64>:<cifra b64>".
// - Cifra sempre com a chave atual (DATA_ENCRYPTION_KEY, id DATA_ENCRYPTION_KEY_ID, padrão "v1").
// - Decifra com a chave indicada pelo prefixo (atual ou antigas em DATA_ENCRYPTION_OLD_KEYS).
// - `npm run rotate-key` re-cifra tudo com a chave atual; depois disso a antiga pode ser descartada.
// Perder uma chave ainda em uso = perder os dados cifrados com ela.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface FieldCipher {
  readonly currentKeyId: string;
  encrypt(plain: string | null): string | null;
  decrypt(stored: string | null): string | null;
  /** Id da chave usada num valor cifrado (para saber se precisa rotacionar). */
  keyIdOf(stored: string): string;
}

export function parseKey(base64Key: string): Buffer {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('Chave de criptografia precisa ter 32 bytes em base64 (gere com: npm run gen:key).');
  }
  return key;
}

const KEY_ID_RE = /^[A-Za-z0-9_-]{1,16}$/;

/** "v0=base64;v00=base64" -> Map */
export function parseOldKeys(spec: string | undefined): Map<string, Buffer> {
  const map = new Map<string, Buffer>();
  for (const part of (spec ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
    const eq = part.indexOf('=');
    const id = part.slice(0, eq);
    if (eq < 1 || !KEY_ID_RE.test(id)) throw new Error(`DATA_ENCRYPTION_OLD_KEYS inválido perto de "${id}". Use id=base64;id2=base64`);
    map.set(id, parseKey(part.slice(eq + 1)));
  }
  return map;
}

export function createFieldCipher(key: Buffer, keyId = 'v1', oldKeys: Map<string, Buffer> = new Map()): FieldCipher {
  if (!KEY_ID_RE.test(keyId)) throw new Error('DATA_ENCRYPTION_KEY_ID deve ter só letras, números, _ ou - (até 16).');
  const keys = new Map(oldKeys);
  keys.set(keyId, key);

  return {
    currentKeyId: keyId,
    encrypt(plain) {
      if (plain === null || plain === '') return null;
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
      return [keyId, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
    },
    decrypt(stored) {
      if (stored === null) return null;
      const [id, ivB64, tagB64, ctB64] = stored.split(':');
      if (!id || !ivB64 || !tagB64 || ctB64 === undefined) throw new Error('Campo criptografado em formato desconhecido.');
      const k = keys.get(id);
      if (!k) throw new Error(`Chave de criptografia "${id}" não configurada (DATA_ENCRYPTION_OLD_KEYS).`);
      const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(ivB64, 'base64'));
      decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8');
    },
    keyIdOf(stored) {
      return stored.split(':')[0] ?? '';
    },
  };
}
