import { createHash, randomBytes } from 'node:crypto';
import type { PublicUser, User } from '../domain/types.js';
import type { IClinicRepository, ISessionRepository, IUserRepository } from '../repositories/types.js';
import { deriveAcronym } from './clinic.js';
import { HttpError } from './errors.js';
import { hashPassword, verifyPassword } from './password.js';

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _hash, salt: _salt, ...rest } = user;
  return rest;
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface AuthResult {
  user: PublicUser;
  token: string;
  expiresAt: string;
}

/**
 * Sessões opacas: o token (32 bytes aleatórios) vai para o app, o banco guarda só o SHA-256.
 * Vantagem sobre JWT aqui: logout/revogação imediatos. Validade definida em SESSION_TTL_DAYS.
 */
export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly clinics: IClinicRepository,
    private readonly sessions: ISessionRepository,
    private readonly sessionTtlDays: number
  ) {}

  private async issueSession(user: User): Promise<AuthResult> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.sessionTtlDays * 86_400_000).toISOString();
    await this.sessions.create(hashToken(token), user.id, expiresAt);
    return { user: toPublicUser(user), token, expiresAt };
  }

  /** Cria a conta e, junto, a clínica dela (o app não tem tela de cadastro). */
  async register(input: { name: string; email: string; password: string; clinicName?: string }): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new HttpError(409, 'E-mail já cadastrado no sistema.', 'email_taken');
    }
    const { hash, salt } = await hashPassword(input.password);
    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash: hash,
      salt,
      crp: null,
      role: 'psychologist',
      clinicId: null,
    });
    const clinicName = input.clinicName?.trim() || 'Clínica Psi';
    const clinic = await this.clinics.create({ name: clinicName, acronym: deriveAcronym(clinicName) }, user.id);
    await this.users.updateClinicId(user.id, clinic.id);
    return this.issueSession({ ...user, clinicId: clinic.id });
  }

  async login(emailRaw: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(emailRaw.trim().toLowerCase());
    // Mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem).
    const invalid = new HttpError(401, 'E-mail ou senha inválidos.', 'invalid_credentials');
    if (!user) {
      await hashPassword(password); // custo parecido com o caminho real (dificulta descobrir e-mails pelo tempo)
      throw invalid;
    }
    if (!(await verifyPassword(password, user.salt, user.passwordHash))) throw invalid;
    return this.issueSession(user);
  }

  /** Resolve o usuário dono do token, ou null se o token não existe / expirou. */
  async authenticate(token: string): Promise<User | null> {
    const tokenHash = hashToken(token);
    const session = await this.sessions.find(tokenHash);
    if (!session) return null;
    if (session.expiresAt <= new Date().toISOString()) {
      await this.sessions.delete(tokenHash);
      return null;
    }
    return this.users.findById(session.userId);
  }

  async logout(token: string): Promise<void> {
    await this.sessions.delete(hashToken(token));
  }
}
