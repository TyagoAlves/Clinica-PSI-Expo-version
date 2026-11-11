// Migrações do banco (PostgreSQL / Supabase). Nunca edite uma migração já aplicada: crie outra com version + 1.
//
// Segurança no Supabase: TODAS as tabelas ficam com Row Level Security ATIVA e SEM políticas.
// Assim a API REST automática do Supabase (PostgREST), acessível com a chave "publishable",
// não lê nem grava nada. Só a nossa API, que conecta como dono do banco, acessa os dados.
//
// Datas de auditoria/edição ficam como TEXT ISO-8601 (comparáveis como texto, iguais às do app).
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'schema_inicial_postgres',
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
        owner_user_id TEXT,
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
      ALTER TABLE clinics ADD CONSTRAINT clinics_owner_fk FOREIGN KEY (owner_user_id) REFERENCES users(id);

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

      CREATE TABLE services (
        id TEXT PRIMARY KEY,
        clinic_id TEXT NOT NULL REFERENCES clinics(id),
        name TEXT NOT NULL,
        description TEXT,
        duration_min INTEGER,
        price_cents INTEGER,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        rev INTEGER NOT NULL
      );
      CREATE INDEX idx_services_clinic_rev ON services(clinic_id, rev);

      -- Evoluções (prontuário). Conteúdo cifrado.
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

      -- Agenda: sessões. Observações cifradas.
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
        id BIGSERIAL PRIMARY KEY,
        at TEXT NOT NULL,
        user_id TEXT NOT NULL,
        clinic_id TEXT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT,
        ip TEXT
      );
      CREATE INDEX idx_audit_clinic_at ON audit_log(clinic_id, at);

      -- Contador global de revisões (cursor da sincronização). A linha é travada em cada escrita,
      -- então as revisões saem em ordem de commit.
      CREATE TABLE meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
      INSERT INTO meta (key, value) VALUES ('rev', 0);

      -- Bloqueia a API REST automática do Supabase (sem políticas = ninguém acessa por lá).
      ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE services ENABLE ROW LEVEL SECURITY;
      ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
      ALTER TABLE meta ENABLE ROW LEVEL SECURITY;
      ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
    `,
  },
];
