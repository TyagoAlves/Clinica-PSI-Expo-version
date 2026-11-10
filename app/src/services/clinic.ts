// src/services/clinic.ts
import type { IClinicRepository, Clinic, IUserRepository } from '../database/repositories/types';

export class ClinicService {
  constructor(
    private clinicRepo: IClinicRepository,
    private userRepo: IUserRepository
  ) {}

  async createClinic(
    data: {
      name: string;
      cnpj?: string;
      address?: string;
      phone?: string;
    },
    userId?: number
  ): Promise<{ success: boolean; clinic?: Clinic; error?: string }> {
    try {
      const clinic = await this.clinicRepo.create({
        name: data.name,
        cnpj: data.cnpj || null,
        address: data.address || null,
        phone: data.phone || null,
      });

      if (userId) {
        await this.userRepo.updateClinicId(userId, clinic.id);
      }

      return { success: true, clinic };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao registrar clínica.' };
    }
  }

  async getClinic(id: number): Promise<Clinic | null> {
    return this.clinicRepo.findById(id);
  }
}
