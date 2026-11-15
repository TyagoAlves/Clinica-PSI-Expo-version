import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { HttpError } from '../services/errors.js';

/** Valida e converte `req.body` com um schema zod. */
export function parseBody<S extends ZodTypeAny>(schema: S, req: Request): z.infer<S> {
  return schema.parse(req.body);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lê `:param` que precisa ser UUID; 400 se inválido. */
export function uuidParam(req: Request, name = 'id'): string {
  const value = String(req.params[name] ?? '');
  if (!UUID_RE.test(value)) {
    throw new HttpError(400, `Parâmetro "${name}" inválido.`, 'invalid_param');
  }
  return value.toLowerCase();
}

/** Cabeçalhos básicos de segurança (a API só serve JSON). */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store'); // dados clínicos não devem ficar em cache
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
};

/** Log de cada requisição: método, rota, status e tempo — nunca o corpo (dados clínicos). */
export const requestLogger: RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const ua = req.get('user-agent') ?? '-';
    console.log(`[api] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms) ip=${req.ip} ua="${ua}"`);
  });
  next();
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { code: 'route_not_found', message: `Rota ${req.method} ${req.path} não existe.` } });
};

export const errorHandler: ErrorRequestHandler = (err, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: err.issues[0]?.message ?? 'Dados inválidos.',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'invalid_json', message: 'JSON inválido no corpo da requisição.' } });
    return;
  }
  console.error('[api] erro inesperado:', err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Erro interno no servidor.' } });
};
