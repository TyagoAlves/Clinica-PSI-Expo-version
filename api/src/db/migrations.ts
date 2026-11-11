// Migrações do banco. Nunca edite uma migração já aplicada: crie uma nova com version + 1.
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'schema_inicial',
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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        crp TEXT,
        role TEXT NOT NULL DEFAULT 'psychologist' CHECK (role IN ('psychologist', 'admin')),
        clinic_id TEXT REFERENCES clinics(id),
        created_at TEXT NOT NULL
      );

      -- Tokens de sessão: guardamos só o SHA-256 do token (vazamento do banco não vaza sessões).
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
      CREATE INDEX idx_patients_clinic_name ON patients(clinic_id, name);

      -- Contador global de revisões (cursor da sincronização).
      CREATE TABLE meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      INSERT INTO meta (key, value) VALUES ('rev', 0);
    `,
  },
  {
    version: 2,
    name: 'servicos_evolucoes_auditoria',
    sql: `
      ALTER TABLE clinics ADD COLUMN owner_user_id TEXT REFERENCES users(id);
      UPDATE clinics SET owner_user_id = (SELECT id FROM users WHERE users.clinic_id = clinics.id ORDER BY created_at LIMIT 1);

      CREATE TABLE services (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_services_clinic_rev ON services(clinic_id, rev);

      -- Evoluções (prontuário). Conteúdo cifrado (AES-256-GCM).
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
      CREATE INDEX idx_evolutions_patient ON evolutions(patient_id, created_at);

      -- Trilha de auditoria (LGPD): quem acessou/alterou dado clínico, quando e de onde. Só INSERT.
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
    `,
  },
  {
    version: 3,
    name: 'servicos_completos_agenda',
    sql: `
      -- Serviços (Tela 9): descrição, duração, preço e ativo/inativo.
      ALTER TABLE services ADD COLUMN description TEXT;
      ALTER TABLE services ADD COLUMN duration_min INTEGER;
      ALTER TABLE services ADD COLUMN price_cents INTEGER;
      ALTER TABLE services ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
      UPDATE services SET description = 'Sessões semanais de atendimento psicológico.', duration_min = 50, price_cents = 15000 WHERE name = 'Psicoterapia';
      UPDATE services SET description = 'Avaliação psicológica e devolução inicial.', duration_min = 60, price_cents = 20000 WHERE name = 'Avaliação';
      UPDATE services SET description = 'Acompanhamento breve e monitoramento.', duration_min = 50, price_cents = 12000 WHERE name = 'Acompanhamento';

      -- Agenda (Tela 8): sessões. Observações cifradas.
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
    `,
  },
];
