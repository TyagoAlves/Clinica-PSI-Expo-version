// src/database/repositories/SyncStateRepo.ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ISyncStateRepository } from './types';

export class SyncStateRepo implements ISyncStateRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      'INSERT INTO sync_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  }

  async clearAll(): Promise<void> {
    await this.db.runAsync('DELETE FROM sync_state');
  }
}
