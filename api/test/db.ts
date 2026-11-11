// Banco SQLite em memória para testes e teste de carga: mesmo adaptador e as
// mesmas migrações do servidor — o que roda nos testes é exatamente o que roda
// em produção (sem PGlite/PostgreSQL).
import { migrate } from '../src/db/migrations.js';
import { createSqliteDb } from '../src/db/sqlite.js';
import type { Db } from '../src/db/types.js';

/** Banco novo em memória, já migrado. */
export async function createTestDb(): Promise<Db> {
  const db = createSqliteDb(':memory:');
  await migrate(db);
  return db;
}

// Ordem respeita as FKs: sessions/audit_log → users; evolutions/appointments →
// patients; patients/services → clinics; users → clinics (owner_user_id é
// anulada antes).
const TABLES = ['sessions', 'audit_log', 'evolutions', 'appointments', 'services', 'patients', 'users', 'clinics'];

/** Zera os dados (mantém o schema): permite reaproveitar o mesmo banco entre testes. */
export async function resetDb(db: Db): Promise<void> {
  await db.exec(`
    UPDATE clinics SET owner_user_id = NULL;
    ${TABLES.map((t) => `DELETE FROM ${t};`).join('\n')}
    DELETE FROM sqlite_sequence WHERE name = 'audit_log';
    UPDATE meta SET value = 0 WHERE key = 'rev';
  `);
}
