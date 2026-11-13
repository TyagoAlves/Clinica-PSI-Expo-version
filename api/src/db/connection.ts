// Conexão PostgreSQL (Supabase em produção/dev; PGlite em memória nos testes) + migrações versionadas.
// Os repositórios só conhecem a interface `Db`, então trocar o provedor de Postgres não mexe no resto.
import postgres from 'postgres';
import { MIGRATIONS } from './migrations.js';

export type Row = Record<string, unknown>;

export interface Db {
  /** Consulta parametrizada ($1, $2…). Devolve as linhas. */
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Executa SQL com vários comandos, sem parâmetros (migrações). */
  exec(text: string): Promise<void>;
  /** Executa `fn` numa transação; desfaz tudo se lançar erro. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Adaptador postgres.js (Supabase). `prepare: false` = compatível com o pooler do Supabase. */
export function createPostgresDb(url: string): Db {
  const sql = postgres(url, {
    prepare: false,
    max: 10,
    idle_timeout: 30,
    connect_timeout: 15,
    onnotice: () => {},
  });

  const wrap = (q: postgres.Sql | postgres.TransactionSql): Db => ({
    async query<T>(text: string, params: unknown[] = []) {
      return (await q.unsafe(text, params as postgres.ParameterOrJSON<never>[])) as unknown as T[];
    },
    async exec(text: string) {
      await q.unsafe(text);
    },
    async tx<T>(fn: (db: Db) => Promise<T>) {
      if ('begin' in q) return (await (q as postgres.Sql).begin((t) => fn(wrap(t)))) as T;
      return fn(wrap(q)); // já dentro de uma transação
    },
    async close() {
      await sql.end({ timeout: 5 });
    },
  });
  return wrap(sql);
}

/** Abre o banco e aplica as migrações pendentes. */
export async function openDatabase(db: Db): Promise<Db> {
  await migrate(db);
  return db;
}

export async function migrate(db: Db): Promise<void> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`);
  const [row] = await db.query<{ v: number }>('SELECT COALESCE(MAX(version), 0)::int AS v FROM schema_migrations');
  for (const m of MIGRATIONS) {
    if (m.version <= (row?.v ?? 0)) continue;
    await db.tx(async (t) => {
      await t.exec(m.sql);
      await t.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [m.version, m.name]);
    });
  }
}
