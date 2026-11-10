// src/database/DatabaseProvider.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { UserRepo } from './repositories/UserRepo';
import { ClinicRepo } from './repositories/ClinicRepo';
import { PatientRepo } from './repositories/PatientRepo';
import type { IUserRepository, IClinicRepository, IPatientRepository } from './repositories/types';
import { migrateIfNeeded } from './migrate';

interface DatabaseContextValue {
  isReady: boolean;
  userRepo: IUserRepository;
  clinicRepo: IClinicRepository;
  patientRepo: IPatientRepository;
  rawDb?: any;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase deve ser usado dentro de um DatabaseProvider');
  }
  return ctx;
};

// Implementação SQLite em memória/web storage para fallback web caso WASM/OPFS não esteja disponível
class WebStorageDatabaseAdapter {
  private users: any[] = [];
  private clinics: any[] = [];
  private patients: any[] = [];
  private userVersion = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const u = localStorage.getItem('@clinica_psi_users');
        const c = localStorage.getItem('@clinica_psi_clinics');
        const p = localStorage.getItem('@clinica_psi_patients');
        const v = localStorage.getItem('@clinica_psi_user_version');
        if (u) this.users = JSON.parse(u);
        if (c) this.clinics = JSON.parse(c);
        if (p) this.patients = JSON.parse(p);
        if (v) this.userVersion = Number(v);
      }
    } catch (e) {}
  }

  private persist() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('@clinica_psi_users', JSON.stringify(this.users));
        localStorage.setItem('@clinica_psi_clinics', JSON.stringify(this.clinics));
        localStorage.setItem('@clinica_psi_patients', JSON.stringify(this.patients));
        localStorage.setItem('@clinica_psi_user_version', String(this.userVersion));
      }
    } catch (e) {}
  }

  async execAsync(sql: string) {
    if (sql.includes('PRAGMA user_version')) {
      const match = sql.match(/user_version\s*=\s*(\d+)/i);
      if (match) {
        this.userVersion = parseInt(match[1], 10);
        this.persist();
      }
    }
    return Promise.resolve();
  }

  async runAsync(sql: string, ...params: any[]) {
    const flatParams = Array.isArray(params[0]) ? params[0] : params;
    const lower = sql.trim().toLowerCase();

    if (lower.startsWith('pragma user_version')) {
      this.userVersion = Number(flatParams[0] || 1);
      this.persist();
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (lower.startsWith('insert into users')) {
      const id = this.users.length ? Math.max(...this.users.map((x) => x.id)) + 1 : 1;
      const newUser = {
        id,
        name: flatParams[0],
        email: flatParams[1],
        password_hash: flatParams[2],
        salt: flatParams[3],
        crp: flatParams[4] || null,
        role: flatParams[5] || 'psychologist',
        clinic_id: flatParams[6] || null,
        created_at: new Date().toISOString(),
      };
      this.users.push(newUser);
      this.persist();
      return { lastInsertRowId: id, changes: 1 };
    }

    if (lower.startsWith('insert into clinics')) {
      const id = this.clinics.length ? Math.max(...this.clinics.map((x) => x.id)) + 1 : 1;
      const newClinic = {
        id,
        name: flatParams[0],
        cnpj: flatParams[1] || null,
        address: flatParams[2] || null,
        phone: flatParams[3] || null,
        created_at: new Date().toISOString(),
      };
      this.clinics.push(newClinic);
      this.persist();
      return { lastInsertRowId: id, changes: 1 };
    }

    if (lower.startsWith('insert into patients')) {
      const id = this.patients.length ? Math.max(...this.patients.map((x) => x.id)) + 1 : 1;
      const newPatient = {
        id,
        clinic_id: flatParams[0],
        name: flatParams[1],
        birth_date: flatParams[2] || null,
        notes: flatParams[3] || null,
        created_at: new Date().toISOString(),
      };
      this.patients.push(newPatient);
      this.persist();
      return { lastInsertRowId: id, changes: 1 };
    }

    if (lower.startsWith('update users')) {
      // 'UPDATE users SET clinic_id = ? WHERE id = ?'
      const clinicId = flatParams[0];
      const id = flatParams[1];
      const user = this.users.find((u) => u.id === Number(id));
      if (user) user.clinic_id = clinicId;
      this.persist();
      return { lastInsertRowId: id, changes: 1 };
    }

    if (lower.startsWith('delete from patients')) {
      const id = flatParams[0];
      this.patients = this.patients.filter((p) => p.id !== Number(id));
      this.persist();
      return { lastInsertRowId: 0, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync(sql: string, params: any[] = []): Promise<any> {
    const flatParams = Array.isArray(params[0]) ? params[0] : params;
    const lower = sql.trim().toLowerCase();

    if (lower.includes('pragma user_version')) {
      return { user_version: this.userVersion };
    }

    if (lower.includes('from users where email =')) {
      const email = flatParams[0];
      return this.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase()) || null;
    }

    if (lower.includes('from users where id =')) {
      const id = flatParams[0];
      return this.users.find((u) => u.id === Number(id)) || null;
    }

    if (lower.includes('from clinics where id =')) {
      const id = flatParams[0];
      return this.clinics.find((c) => c.id === Number(id)) || null;
    }

    if (lower.includes('from patients where id =')) {
      const id = flatParams[0];
      return this.patients.find((p) => p.id === Number(id)) || null;
    }

    return null;
  }

  async getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
    const flatParams = Array.isArray(params[0]) ? params[0] : params;
    const lower = sql.trim().toLowerCase();

    if (lower.includes('from users')) {
      return [...this.users];
    }
    if (lower.includes('from clinics')) {
      return [...this.clinics];
    }
    if (lower.includes('from patients where clinic_id =')) {
      const clinicId = flatParams[0];
      return this.patients.filter((p) => p.clinic_id === Number(clinicId));
    }
    if (lower.includes('from patients')) {
      return [...this.patients];
    }

    return [];
  }
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [dbInstance, setDbInstance] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function initDB() {
      try {
        let db: any;

        // Se for ambiente nativo (Android/iOS) ou Expo SQLite completo
        if (Platform.OS !== 'web') {
          const SQLite = require('expo-sqlite');
          db = await SQLite.openDatabaseAsync('clinicapsi.db');
          await migrateIfNeeded(db);
        } else {
          // No ambiente web, tenta abrir expo-sqlite se o backend WASM estiver ativo,
          // caso contrário ativa o WebStorageDatabaseAdapter transparente com persistência
          try {
            const SQLite = require('expo-sqlite');
            if (SQLite.openDatabaseAsync) {
              db = await SQLite.openDatabaseAsync('clinicapsi.db');
              await migrateIfNeeded(db);
            } else {
              db = new WebStorageDatabaseAdapter();
              await migrateIfNeeded(db);
            }
          } catch (webErr) {
            db = new WebStorageDatabaseAdapter();
            await migrateIfNeeded(db);
          }
        }

        if (active) {
          setDbInstance(db);
          setIsReady(true);
        }
      } catch (err) {
        console.warn('Erro ao inicializar SQLite nativo, ativando fallback resiliente:', err);
        const fallbackDb = new WebStorageDatabaseAdapter();
        await migrateIfNeeded(fallbackDb);
        if (active) {
          setDbInstance(fallbackDb);
          setIsReady(true);
        }
      }
    }

    initDB();

    return () => {
      active = false;
    };
  }, []);

  const repos = useMemo(() => {
    const db = dbInstance || new WebStorageDatabaseAdapter();
    return {
      userRepo: new UserRepo(db),
      clinicRepo: new ClinicRepo(db),
      patientRepo: new PatientRepo(db),
    };
  }, [dbInstance]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Conectando ao banco de dados...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider
      value={{
        isReady,
        ...repos,
        rawDb: dbInstance,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F3F8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});
