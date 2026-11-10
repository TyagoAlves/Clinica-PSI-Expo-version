// src/services/patient.ts
import type { IPatientRepository, Patient } from '../database/repositories/types';

export class PatientService {
  constructor(private patientRepo: IPatientRepository) {}

  async createPatient(data: {
    clinicId: number;
    name: string;
    birthDate?: string;
    notes?: string;
  }): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const patient = await this.patientRepo.create({
        clinicId: data.clinicId,
        name: data.name,
        birthDate: data.birthDate || null,
        notes: data.notes || null,
      });
      return { success: true, patient };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao cadastrar paciente.' };
    }
  }

  async listPatients(clinicId: number): Promise<Patient[]> {
    return this.patientRepo.findAllByClinic(clinicId);
  }

  async listAll(): Promise<Patient[]> {
    return this.patientRepo.listAll();
  }

  async removePatient(id: number): Promise<void> {
    return this.patientRepo.delete(id);
  }
}
