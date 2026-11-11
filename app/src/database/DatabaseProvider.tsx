// src/database/DatabaseProvider.tsx
// Abre o SQLite local do aparelho e expõe os repositórios.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { SyncTableRepo, PATIENTS_TABLE, SERVICES_TABLE, EVOLUTIONS_TABLE, APPOINTMENTS_TABLE } from './repositories/SyncTableRepo';
import { SyncStateRepo } from './repositories/SyncStateRepo';
import type {
  IAppointmentRepository,
  IEvolutionRepository,
  IPatientRepository,
  IServiceRepository,
  ISyncStateRepository,
} from './repositories/types';
import { migrateIfNeeded } from './migrate';
import { colors } from '../theme';

interface DatabaseContextValue {
  patientRepo: IPatientRepository;
  serviceRepo: IServiceRepository;
  evolutionRepo: IEvolutionRepository;
  appointmentRepo: IAppointmentRepository;
  syncStateRepo: ISyncStateRepository;
  /** Apaga todos os dados locais (logout). */
  wipe(): Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export const useDatabase = () => {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase deve ser usado dentro de um DatabaseProvider');
  }
  return ctx;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [value, setValue] = useState<DatabaseContextValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('clinicapsi.db');
        await migrateIfNeeded(db);
        const patientRepo: IPatientRepository = new SyncTableRepo(db, PATIENTS_TABLE);
        const serviceRepo: IServiceRepository = new SyncTableRepo(db, SERVICES_TABLE);
        const evolutionRepo: IEvolutionRepository = new SyncTableRepo(db, EVOLUTIONS_TABLE);
        const appointmentRepo: IAppointmentRepository = new SyncTableRepo(db, APPOINTMENTS_TABLE);
        const syncStateRepo = new SyncStateRepo(db);
        if (active) {
          setValue({
            patientRepo,
            serviceRepo,
            evolutionRepo,
            appointmentRepo,
            syncStateRepo,
            wipe: async () => {
              await patientRepo.clearAll();
              await serviceRepo.clearAll();
              await evolutionRepo.clearAll();
              await appointmentRepo.clearAll();
              await syncStateRepo.clearAll();
            },
          });
        }
      } catch (err: any) {
        console.warn('[db] falha ao abrir o banco local:', err);
        // Obs.: no navegador o expo-sqlite precisa de configuração extra (WASM); o alvo do app é Android/iOS.
        if (active) setError(err?.message || 'Não foi possível abrir o banco local.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Erro no armazenamento do aparelho</Text>
        <Text style={styles.text}>{error}</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Preparando dados do aparelho...</Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.error, marginBottom: 8 },
  text: { marginTop: 12, fontSize: 14, color: colors.textMuted, fontWeight: '500', textAlign: 'center' },
});
