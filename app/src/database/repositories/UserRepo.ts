// src/database/repositories/UserRepo.ts
import type { User, IUserRepository } from './types';

export class UserRepo implements IUserRepository {
  constructor(private db: any) {}

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const result = await this.db.runAsync(
      `INSERT INTO users (name, email, password_hash, salt, crp, role, clinic_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      data.name,
      data.email,
      data.passwordHash,
      data.salt,
      data.crp,
      data.role,
      data.clinicId
    );
    const created = await this.findById(result.lastInsertRowId);
    return created!;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.getFirstAsync('SELECT * FROM users WHERE email = ?', [email]);
    return row ? this.mapRow(row) : null;
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.db.getFirstAsync('SELECT * FROM users WHERE id = ?', [id]);
    return row ? this.mapRow(row) : null;
  }

  async updateClinicId(id: number, clinicId: number): Promise<void> {
    await this.db.runAsync('UPDATE users SET clinic_id = ? WHERE id = ?', [clinicId, id]);
  }

  async listAll(): Promise<User[]> {
    const rows = await this.db.getAllAsync('SELECT * FROM users ORDER BY id DESC');
    return (rows || []).map((r: any) => this.mapRow(r));
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      crp: row.crp,
      role: row.role,
      clinicId: row.clinic_id,
      createdAt: row.created_at,
    };
  }
}
