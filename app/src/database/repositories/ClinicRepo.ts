// src/database/repositories/ClinicRepo.ts
import type { Clinic, IClinicRepository } from './types';

export class ClinicRepo implements IClinicRepository {
  constructor(private db: any) {}

  async create(data: Omit<Clinic, 'id' | 'createdAt'>): Promise<Clinic> {
    const result = await this.db.runAsync(
      'INSERT INTO clinics (name, cnpj, address, phone) VALUES (?, ?, ?, ?)',
      data.name,
      data.cnpj,
      data.address,
      data.phone
    );
    const created = await this.findById(result.lastInsertRowId);
    return created!;
  }

  async findById(id: number): Promise<Clinic | null> {
    const row = await this.db.getFirstAsync('SELECT * FROM clinics WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async update(id: number, data: Partial<Omit<Clinic, 'id' | 'createdAt'>>): Promise<void> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.cnpj !== undefined) {
      fields.push('cnpj = ?');
      params.push(data.cnpj);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      params.push(data.address);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      params.push(data.phone);
    }

    if (fields.length === 0) return;
    params.push(id);

    await this.db.runAsync(`UPDATE clinics SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async listAll(): Promise<Clinic[]> {
    const rows = await this.db.getAllAsync('SELECT * FROM clinics ORDER BY id DESC');
    return (rows || []).map((r: any) => this.mapRow(r));
  }

  private mapRow(row: any): Clinic {
    return {
      id: row.id,
      name: row.name,
      cnpj: row.cnpj,
      address: row.address,
      phone: row.phone,
      createdAt: row.created_at,
    };
  }
}
