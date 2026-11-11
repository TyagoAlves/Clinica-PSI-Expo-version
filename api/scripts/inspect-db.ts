// Inspeciona o banco SQLite do .env: tabelas, contagem de linhas e rev de sincronização.
// Uso: npm run db:inspect
import { loadEnv } from '../src/config/env.js';
import { createSqliteDb } from '../src/db/sqlite.js';

const env = loadEnv();
const db = createSqliteDb(env.DATABASE_PATH);

const tables = await db.query<{ name: string }>(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
);
console.log(`banco: ${env.DATABASE_PATH}`);
for (const { name } of tables) {
  const [row] = await db.query<{ n: number }>(`SELECT COUNT(*) AS n FROM ${name}`);
  console.log(`  ${name.padEnd(16)} ${row?.n ?? 0} linha(s)`);
}

const [rev] = await db.query<{ v: number }>('SELECT value AS v FROM meta WHERE key = $1', ['rev']);
if (rev) console.log(`rev de sincronização: ${rev.v}`);
await db.close();
