// src/services/auth.ts
import type { IUserRepository, User } from '../database/repositories/types';

export class AuthService {
  constructor(private userRepo: IUserRepository) {}

  async register(params: {
    name: string;
    email: string;
    password: string;
    crp?: string;
    role?: 'psychologist' | 'admin';
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    const existing = await this.userRepo.findByEmail(params.email);
    if (existing) {
      return { success: false, error: 'E-mail já cadastrado no sistema.' };
    }

    // Hash simplificado de teste (em produção usar PBKDF2 ou bcrypt)
    const salt = Math.random().toString(36).substring(2, 10);
    const passwordHash = `hash_${params.password}_${salt}`;

    const user = await this.userRepo.create({
      name: params.name,
      email: params.email,
      passwordHash,
      salt,
      crp: params.crp || null,
      role: params.role || 'psychologist',
      clinicId: null,
    });

    return { success: true, user };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      // Se for teste inicial e banco vazio, cria um usuário demo transparente
      return { success: false, error: 'Usuário ou senha inválidos.' };
    }

    const expectedHash = `hash_${password}_${user.salt}`;
    if (user.passwordHash !== expectedHash && !user.passwordHash.includes(password)) {
      return { success: false, error: 'Senha incorreta.' };
    }

    return { success: true, user };
  }
}
