import { randomUUID } from 'node:crypto';
import { createApp } from './app.js';
import { DEFAULT_SERVICES } from './domain/types.js';
import { loadEnv } from './config/env.js';
import { openDatabase } from './db/connection.js';
import { createSqliteRepositories } from './repositories/sqlite.js';
import { createFieldCipher, parseKey, parseOldKeys } from './security/fieldCipher.js';

const env = loadEnv();
const db = openDatabase(env.DB_PATH);
const repos = createSqliteRepositories(db, createFieldCipher(parseKey(env.DATA_ENCRYPTION_KEY), env.DATA_ENCRYPTION_KEY_ID, parseOldKeys(env.DATA_ENCRYPTION_OLD_KEYS)));
const app = createApp({
  repos,
  sessionTtlDays: env.SESSION_TTL_DAYS,
  corsOrigins: env.CORS_ORIGINS,
  trustProxy: env.TRUST_PROXY,
});

// Clínicas criadas antes do catálogo de serviços existir recebem os serviços padrão.
{
  const semServicos = db
    .prepare('SELECT id FROM clinics WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.clinic_id = clinics.id)')
    .all() as { id: string }[];
  const now = new Date().toISOString();
  for (const { id } of semServicos) {
    for (const svc of DEFAULT_SERVICES) {
      await repos.services.save({ ...svc, id: randomUUID(), clinicId: id, createdAt: now, updatedAt: now, deletedAt: null });
    }
  }
  if (semServicos.length) console.log(`[api] catálogo padrão de serviços criado para ${semServicos.length} clínica(s)`);
}

// Limpeza periódica de sessões expiradas.
const cleanup = setInterval(() => {
  repos.sessions.deleteExpired(new Date().toISOString()).catch((e) => console.error('[api] limpeza de sessões:', e));
}, 60 * 60 * 1000);
cleanup.unref();

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`[api] clinica-api ouvindo em http://${env.HOST}:${env.PORT} (${env.NODE_ENV}) · banco ${env.DB_PATH}`);
  console.log(`[api] Emulador Android: http://10.0.2.2:${env.PORT}/health`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] Porta ${env.PORT} já está em uso. Feche o outro processo ou mude PORT no .env.`);
  } else {
    console.error('[api] Falha ao iniciar:', err);
  }
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[api] ${signal} recebido, encerrando...`);
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
}
