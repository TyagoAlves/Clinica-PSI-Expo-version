// src/database/migrate.ts

const DATABASE_VERSION = 1;

export async function migrateIfNeeded(db: any): Promise<void> {
  let current = 0;
  try {
    const row = await db.getFirstAsync('PRAGMA user_version');
    current = row?.user_version ?? 0;
  } catch (err) {
    current = 0;
  }

  if (current >= DATABASE_VERSION) return;

  // WAL mode + foreign keys
  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync('PRAGMA foreign_keys = ON;');
  } catch (e) {
    // Ignora se a plataforma não suportar pragmas específicos
  }

  if (current === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        crp TEXT,
        role TEXT NOT NULL DEFAULT 'psychologist',
        clinic_id INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS clinics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        cnpj TEXT,
        address TEXT,
        phone TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clinic_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        birth_date TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (clinic_id) REFERENCES clinics(id)
      );
    `);
  }

  try {
    await db.runAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  } catch (e) {}
}
