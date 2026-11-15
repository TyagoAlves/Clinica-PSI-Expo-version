import cors from 'cors';
import express, { type Express } from 'express';
import { errorHandler, notFoundHandler, requestLogger, securityHeaders } from './middleware/http.js';
import type { Repositories } from './repositories/types.js';
import { createApiRouter } from './routes/index.js';
import type { LoginRateLimiter } from './security/loginRateLimiter.js';

export interface AppOptions {
  repos: Repositories;
  sessionTtlDays?: number;
  corsOrigins?: string[];
  logRequests?: boolean;
  loginLimiter?: LoginRateLimiter;
  /** Atrás de proxy reverso (nginx etc.), para req.ip vir do X-Forwarded-For. */
  trustProxy?: boolean;
}

export function createApp(options: AppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  if (options.trustProxy) app.set('trust proxy', 1);
  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));
  // App nativo (Expo Go/emulador) não envia Origin, então CORS só afeta o Expo web.
  app.use(cors({ origin: options.corsOrigins ?? ['http://localhost:8081'] }));
  if (options.logRequests !== false) app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'clinica-api', uptime: Math.round(process.uptime()) });
  });

  app.use(
    '/api/v1',
    createApiRouter({
      repos: options.repos,
      sessionTtlDays: options.sessionTtlDays ?? 30,
      loginLimiter: options.loginLimiter,
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
