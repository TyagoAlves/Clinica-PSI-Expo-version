// src/database/repositories/types.ts

// ===== Tipos de domínio =====

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  crp: string | null;
  role: 'psychologist' | 'admin';
  clinicId: number | null;
  createdAt: string;
}

export interface Clinic {
  id: number;
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

export interface Patient {
  id: number;
  clinicId: number;
  name: string;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
}

// ===== Interfaces dos repositórios (Padrão Conector) =====

export interface IUserRepository {
  create(data: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  updateClinicId(id: number, clinicId: number): Promise<void>;
  listAll(): Promise<User[]>;
}

export interface IClinicRepository {
  create(data: Omit<Clinic, 'id' | 'createdAt'>): Promise<Clinic>;
  findById(id: number): Promise<Clinic | null>;
  update(id: number, data: Partial<Omit<Clinic, 'id' | 'createdAt'>>): Promise<void>;
  listAll(): Promise<Clinic[]>;
}

export interface IPatientRepository {
  create(data: Omit<Patient, 'id' | 'createdAt'>): Promise<Patient>;
  findAllByClinic(clinicId: number): Promise<Patient[]>;
  findById(id: number): Promise<Patient | null>;
  update(id: number, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<void>;
  delete(id: number): Promise<void>;
  listAll(): Promise<Patient[]>;
}
