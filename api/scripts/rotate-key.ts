// Rotação da chave de criptografia dos campos clínicos.
// Passo a passo:
//   1. npm run gen:key                      -> nova chave
//   2. no .env: mova a chave atual para DATA_ENCRYPTION_OLD_KEYS (ex.: v1=<antiga>),
//      coloque a nova em DATA_ENCRYPTION_KEY e mude DATA_ENCRYPTION_KEY_ID (ex.: v2)
//   3. npm run rotate-key                   -> re-cifra tudo com a chave nova (API pode ficar no ar)
//   4. confirme "0 restantes" e então remova a chave antiga de DATA_ENCRYPTION_OLD_KEYS
import { loadEnv } from '../src/config/env.js';
import { createPostgresDb, openDatabase } from '../src/db/connection.js';
import { createPostgresRepositories } from '../src/repositories/postgres.js';
import { createFieldCipher, parseKey, parseOldKeys } from '../src/security/fieldCipher.js';

const env = loadEnv();
const cipher = createFieldCipher(parseKey(env.DATA_ENCRYPTION_KEY), env.DATA_ENCRYPTION_KEY_ID, parseOldKeys(env.DATA_ENCRYPTION_OLD_KEYS));
const db = await openDatabase(createPostgresDb(env.DATABASE_URL));
const repos = createPostgresRepositories(db, cipher);

console.log(`Re-cifrando com a chave "${cipher.currentKeyId}"...`);
for (const [name, repo] of [
  ['patients', repos.patients],
  ['evolutions', repos.evolutions],
  ['appointments', repos.appointments],
] as const) {
  const n = await repo.reencryptAll!();
  const again = await repo.reencryptAll!();
  console.log(`${name}: ${n} registro(s) re-cifrado(s), ${again} restantes`);
}
await db.close();
