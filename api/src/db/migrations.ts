// Migrações do banco SQLite (arquivo local, ex.: clinica.db). Nunca edite uma
// migração já aplicada: crie outra com version + 1.
//
// Datas ficam como TEXT ISO-8601 ("2026-11-11", "2026-11-11T01:23:34.041Z"):
// texto ISO compara e ordena igual a data real, e a API continua expondo os
// mesmos formatos do app (DD/MM/AAAA, AAAA-MM-DD, HH:MM, ISO-8601): ver
// repositories/sqlite.ts.
import type { Db } from './types.js';

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'schema_inicial_sqlite',
    // clinics.owner_user_id → users e users.clinic_id → clinics são referências
    // circulares: o SQLite valida FKs só ao gravar dados, não na criação.
    sql: `
      CREATE TABLE clinics (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT,
        technical_responsible TEXT,
        cnpj TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        acronym TEXT,
        owner_user_id TEXT REFERENCES users(id),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        crp TEXT,
        role TEXT NOT NULL DEFAULT 'psychologist' CHECK (role IN ('psychologist', 'admin')),
        clinic_id TEXT REFERENCES clinics(id),
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX users_email_lower ON users (lower(email));

      -- Tokens de sessão: só o SHA-256 do token (vazamento do banco não vaza sessões).
      CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );
      CREATE INDEX idx_sessions_user ON sessions(user_id);

      -- Campos *_enc guardam texto cifrado (AES-256-GCM, ver src/security/fieldCipher.ts).
      CREATE TABLE patients (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        birth_date TEXT,
        document_enc TEXT,
        service TEXT,
        treatment_start TEXT,
        status TEXT NOT NULL DEFAULT 'Em tratamento' CHECK (status IN ('Em tratamento', 'Pausado', 'Alta')),
        professional TEXT,
        address_enc TEXT,
        guardian_enc TEXT,
        complaint_enc TEXT,
        notes_enc TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_patients_clinic_rev ON patients(clinic_id, rev);
      CREATE INDEX idx_patients_clinic_name ON patients(clinic_id, lower(name));
      CREATE INDEX idx_patients_birth ON patients(clinic_id, birth_date);

      CREATE TABLE services (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        name TEXT NOT NULL,
        description TEXT,
        duration_min INTEGER,
        price_cents INTEGER,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_services_clinic_rev ON services(clinic_id, rev);

      -- Evoluções (prontuário). Conteúdo cifrado. Mais recente primeiro pela data da sessão.
      CREATE TABLE evolutions (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        patient_id TEXT NOT NULL REFERENCES patients(id),
        session_date TEXT NOT NULL,
        content_enc TEXT NOT NULL,
        author_id TEXT,
        author_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_evolutions_clinic_rev ON evolutions(clinic_id, rev);
      CREATE INDEX idx_evolutions_patient ON evolutions(patient_id, session_date DESC);

      -- Agenda: consultas. Observações cifradas.
      CREATE TABLE appointments (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        patient_id TEXT NOT NULL REFERENCES patients(id),
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        duration_min INTEGER NOT NULL,
        service TEXT,
        professional TEXT,
        status TEXT NOT NULL DEFAULT 'Agendada' CHECK (status IN ('Agendada', 'Realizada', 'Cancelada', 'Faltou')),
        notes_enc TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_appointments_clinic_rev ON appointments(clinic_id, rev);
      CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, date, time);

      -- Trilha de auditoria (LGPD): quem acessou/alterou dado clínico. Só INSERT.
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        at TEXT NOT NULL,
        user_id TEXT NOT NULL,
        clinic_id TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        ip TEXT
      );
      CREATE INDEX idx_audit_clinic_at ON audit_log(clinic_id, at);

      -- Contador global de revisões (cursor da sincronização).
      CREATE TABLE meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      INSERT INTO meta (key, value) VALUES ('rev', 0);
    `,
  },
];

/** Cria o histórico de migrações e aplica as pendentes. */
export async function migrate(db: Db): Promise<void> {
  await db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  const [row] = await db.query<{ v: number }>('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations');
  for (const m of MIGRATIONS) {
    if (m.version <= (row?.v ?? 0)) continue;
    await db.tx(async (t) => {
      await t.exec(m.sql);
      await t.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [m.version, m.name]);
    });
  }
}
