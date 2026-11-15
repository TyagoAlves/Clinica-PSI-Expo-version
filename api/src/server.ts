import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createPostgresDb, openDatabase } from './db/connection.js';
import { createPostgresRepositories } from './repositories/postgres.js';
import { createFieldCipher, parseKey } from './security/fieldCipher.js';

const env = loadEnv();
const db = await openDatabase(createPostgresDb(env.DATABASE_URL));
const repos = createPostgresRepositories(db, createFieldCipher(parseKey(env.DATA_ENCRYPTION_KEY)));
const app = createApp({
  repos,
  sessionTtlDays: env.SESSION_TTL_DAYS,
  corsOrigins: env.CORS_ORIGINS,
  trustProxy: env.TRUST_PROXY,
});

// Limpeza periódica de sessões expiradas.
const cleanup = setInterval(() => {
  repos.sessions.deleteExpired(new Date().toISOString()).catch((e) => console.error('[api] limpeza de sessões:', e));
}, 60 * 60 * 1000);
cleanup.unref();

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`[api] clinica-api ouvindo em http://${env.HOST}:${env.PORT} (${env.NODE_ENV}) · banco PostgreSQL ${new URL(env.DATABASE_URL).host}`);
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
      db.close().finally(() => process.exit(0));
    });
  });
}
