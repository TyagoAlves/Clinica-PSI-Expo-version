// src/database/migrate.ts
// Banco local (cache offline-first). A fonte da verdade das contas/clínicas é a API;
// aqui ficam os pacientes da clínica logada e o estado da sincronização.
import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 4;

export async function migrateIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  await db.execAsync('PRAGMA journal_mode = WAL;');

  if (current < 2) {
    // v1 guardava usuários com a senha em texto puro e IDs numéricos locais (incompatíveis
    // com a sincronização). Os dados eram só de teste: descartamos e recriamos.
    await db.execAsync(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS clinics;
      DROP TABLE IF EXISTS patients;

      CREATE TABLE patients (
        id TEXT PRIMARY KEY NOT NULL,          -- UUID gerado no aparelho
        clinic_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        birth_date TEXT,
        document TEXT,
        service TEXT,
        treatment_start TEXT,
        status TEXT NOT NULL DEFAULT 'Em tratamento',
        professional TEXT,
        address TEXT,
        guardian TEXT,
        complaint TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1       -- 1 = alteração local ainda não enviada
      );
      CREATE INDEX idx_patients_clinic_name ON patients(clinic_id, name);
      CREATE INDEX idx_patients_dirty ON patients(dirty);

      CREATE TABLE sync_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    current = 2;
  }

  if (current < 3) {
    await db.execAsync(`
      CREATE TABLE services (
        id TEXT PRIMARY KEY NOT NULL,
        clinic_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_services_clinic ON services(clinic_id, name);

      -- Evoluções (prontuário). Ficam no aparelho para uso offline; apagadas no logout.
      CREATE TABLE evolutions (
        id TEXT PRIMARY KEY NOT NULL,
        clinic_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        session_date TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id TEXT,
        author_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_evolutions_patient ON evolutions(patient_id, created_at);
      CREATE INDEX idx_evolutions_dirty ON evolutions(dirty);

      -- Força um pull completo para baixar serviços e evoluções que já existam no servidor.
      DELETE FROM sync_state WHERE key = 'patients.lastPulledRev';
    `);
    current = 3;
  }

  if (current < 4) {
    await db.execAsync(`
      -- Serviços completos (Tela 9 do Tyago).
      ALTER TABLE services ADD COLUMN description TEXT;
      ALTER TABLE services ADD COLUMN duration_min INTEGER;
      ALTER TABLE services ADD COLUMN price_cents INTEGER;
      ALTER TABLE services ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

      -- Agenda (Tela 8 do Tyago): sessões.
      CREATE TABLE appointments (
        id TEXT PRIMARY KEY NOT NULL,
        clinic_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        service TEXT,
        professional TEXT,
        status TEXT NOT NULL DEFAULT 'Agendada',
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        dirty INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX idx_appointments_date ON appointments(clinic_id, date, time);
      CREATE INDEX idx_appointments_dirty ON appointments(dirty);

      -- Pull completo para baixar os campos novos dos serviços e as sessões.
      DELETE FROM sync_state WHERE key = 'sync.lastPulledRev';
    `);
    current = 4;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
