import type { NextFunction, Request, Response } from 'express';
import type { User } from '../domain/types.js';
import type { AuthService } from '../services/auth.js';
import { HttpError } from '../services/errors.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    authToken?: string;
  }
}

export function bearerToken(req: Request): string | null {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() || null;
}

/** Exige `Authorization: Bearer <token>` válido; preenche req.user. */
export function requireAuth(auth: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = bearerToken(req);
    if (!token) throw new HttpError(401, 'Faça login para continuar.', 'unauthenticated');
    const user = await auth.authenticate(token);
    if (!user) throw new HttpError(401, 'Sessão expirada. Faça login novamente.', 'session_expired');
    req.user = user;
    req.authToken = token;
    next();
  };
}

/** Usuário autenticado (só usar em rotas atrás de requireAuth). */
export function currentUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Faça login para continuar.', 'unauthenticated');
  return req.user;
}
