// PostgreSQL embutido (PGlite, WASM) para testes e teste de carga: mesmo SQL do Supabase,
// sem depender de rede nem de Docker.
import { PGlite } from '@electric-sql/pglite';
import { migrate, type Db } from '../src/db/connection.js';

function wrap(pg: { query: PGlite['query']; exec: PGlite['exec'] }, root?: PGlite): Db {
  return {
    async query<T>(text: string, params: unknown[] = []) {
      return (await pg.query(text, params as unknown[])).rows as T[];
    },
    async exec(text: string) {
      await pg.exec(text);
    },
    async tx<T>(fn: (db: Db) => Promise<T>) {
      if (!root) return fn(wrap(pg)); // já dentro de transação
      return root.transaction((t) => fn(wrap(t)));
    },
    async close() {
      await root?.close();
    },
  };
}

/** Banco novo em memória, já migrado. */
export async function createPgliteDb(): Promise<Db> {
  const pg = new PGlite();
  const db = wrap(pg, pg);
  await migrate(db);
  return db;
}

const TABLES = ['audit_log', 'appointments', 'evolutions', 'services', 'patients', 'sessions', 'users', 'clinics'];

/** Zera os dados (mantém o schema): permite reaproveitar o mesmo banco entre testes. */
export async function resetDb(db: Db): Promise<void> {
  await db.exec(`
    UPDATE clinics SET owner_user_id = NULL;
    TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE;
    UPDATE meta SET value = 0 WHERE key = 'rev';
  `);
}
