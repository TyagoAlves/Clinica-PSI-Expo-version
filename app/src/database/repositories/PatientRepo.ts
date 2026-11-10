// src/database/repositories/PatientRepo.ts
import type { Patient, IPatientRepository } from './types';

export class PatientRepo implements IPatientRepository {
  constructor(private db: any) {}

  async create(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient> {
    const result = await this.db.runAsync(
      'INSERT INTO patients (clinic_id, name, birth_date, notes) VALUES (?, ?, ?, ?)',
      data.clinicId,
      data.name,
      data.birthDate,
      data.notes
    );
    const created = await this.findById(result.lastInsertRowId);
    return created!;
  }

  async findAllByClinic(clinicId: number): Promise<Patient[]> {
    const rows = await this.db.getAllAsync(
      'SELECT * FROM patients WHERE clinic_id = ? ORDER BY name',
      [clinicId]
    );
    return (rows || []).map((r: any) => this.mapRow(r));
  }

  async findById(id: number): Promise<Patient | null> {
    const row = await this.db.getFirstAsync('SELECT * FROM patients WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async update(id: number, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.birthDate !== undefined) {
      fields.push('birth_date = ?');
      params.push(data.birthDate);
    }
    if (data.notes !== undefined) {
      fields.push('notes = ?');
      params.push(data.notes);
    }

    if (fields.length === 0) return;
    params.push(id);

    await this.db.runAsync(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async delete(id: number): Promise<void> {
    await this.db.runAsync('DELETE FROM patients WHERE id = ?', [id]);
  }

  async listAll(): Promise<Patient[]> {
    const rows = await this.db.getAllAsync('SELECT * FROM patients ORDER BY id DESC');
    return (rows || []).map((r: any) => this.mapRow(r));
  }

  private mapRow(row: any): Patient {
    return {
      id: row.id,
      clinicId: row.clinic_id,
      name: row.name,
      birthDate: row.birth_date,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
