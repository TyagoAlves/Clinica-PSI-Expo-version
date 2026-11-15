// Todas as rotas da API (prefixo /api/v1, definido em app.ts).
//   Login:      POST /auth/register · POST /auth/login · POST /auth/logout · GET /me
//   Pacientes:  GET/POST /clinics/:clinicId/patients · GET/PATCH/DELETE /patients/:id
//   Agenda:     GET/POST /clinics/:clinicId/appointments · GET/PATCH/DELETE /appointments/:id
import { Router, type Request } from 'express';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { parseBody, uuidParam } from '../middleware/http.js';
import type { Repositories } from '../repositories/types.js';
import { LoginRateLimiter } from '../security/loginRateLimiter.js';
import { AuthService, toPublicUser } from '../services/auth.js';
import { HttpError } from '../services/errors.js';
import { type Actor, AppointmentService, PatientService } from '../services/records.js';
import {
  AppointmentRangeSchema,
  AppointmentSchema,
  LoginSchema,
  PageQuerySchema,
  PatientSchema,
  RegisterSchema,
  UpdateAppointmentSchema,
  UpdatePatientSchema,
} from './schemas.js';

export interface RouterDeps {
  repos: Repositories;
  sessionTtlDays: number;
  loginLimiter?: LoginRateLimiter;
}

const actorOf = (req: Request): Actor => ({ user: currentUser(req) });
const pageOf = (req: Request) => PageQuerySchema.parse(req.query);

export function createApiRouter({
  repos,
  sessionTtlDays,
  loginLimiter = new LoginRateLimiter(),
}: RouterDeps): Router {
  const auth = new AuthService(repos.users, repos.clinics, repos.sessions, sessionTtlDays);
  const patients = new PatientService(repos.patients);
  const appointments = new AppointmentService(repos.appointments, repos.patients);
  const authed = requireAuth(auth);
  const r = Router();

  r.get('/ping', (_req, res) => {
    res.json({ pong: true, time: new Date().toISOString() });
  });

  // ---- Login (público) ----
  // Cria usuário + clínica. O app não tem tela de cadastro: use "npm run criar-conta".
  r.post('/auth/register', async (req, res) => {
    const result = await auth.register(parseBody(RegisterSchema, req));
    const clinic = await repos.clinics.findById(result.user.clinicId!);
    res.status(201).json({ ...result, clinic });
  });

  r.post('/auth/login', async (req, res) => {
    const { email, password } = parseBody(LoginSchema, req);
    const ip = req.ip ?? 'unknown';
    const wait = loginLimiter.retryAfter(ip, email);
    if (wait > 0) {
      res.setHeader('Retry-After', String(wait));
      throw new HttpError(429, `Muitas tentativas. Tente de novo em ${Math.ceil(wait / 60)} min.`, 'too_many_attempts');
    }
    try {
      const result = await auth.login(email, password);
      loginLimiter.reset(ip, email);
      const clinic = result.user.clinicId ? await repos.clinics.findById(result.user.clinicId) : null;
      res.json({ ...result, clinic });
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) loginLimiter.fail(ip, email);
      throw e;
    }
  });

  // ---- A partir daqui, tudo exige estar logado ----
  r.post('/auth/logout', authed, async (req, res) => {
    await auth.logout(req.authToken!);
    res.status(204).end();
  });

  r.get('/me', authed, async (req, res) => {
    const user = currentUser(req);
    const clinic = user.clinicId ? await repos.clinics.findById(user.clinicId) : null;
    res.json({ user: toPublicUser(user), clinic });
  });

  // ---- Pacientes ----
  r.get('/clinics/:clinicId/patients', authed, async (req, res) => {
    res.json(await patients.list(actorOf(req), uuidParam(req, 'clinicId'), pageOf(req)));
  });
  r.post('/clinics/:clinicId/patients', authed, async (req, res) => {
    const fields = parseBody(PatientSchema, req);
    res.status(201).json(await patients.create(actorOf(req), uuidParam(req, 'clinicId'), fields));
  });
  r.get('/patients/:id', authed, async (req, res) => {
    res.json(await patients.get(actorOf(req), uuidParam(req)));
  });
  r.patch('/patients/:id', authed, async (req, res) => {
    res.json(await patients.update(actorOf(req), uuidParam(req), parseBody(UpdatePatientSchema, req)));
  });
  r.delete('/patients/:id', authed, async (req, res) => {
    await patients.remove(actorOf(req), uuidParam(req));
    res.status(204).end();
  });

  // ---- Agenda (sessões) ----
  r.get('/clinics/:clinicId/appointments', authed, async (req, res) => {
    const { from, to, limit, offset } = AppointmentRangeSchema.parse(req.query);
    res.json(await appointments.listRange(actorOf(req), uuidParam(req, 'clinicId'), from, to, limit, offset));
  });
  r.post('/clinics/:clinicId/appointments', authed, async (req, res) => {
    const fields = parseBody(AppointmentSchema, req);
    res.status(201).json(await appointments.create(actorOf(req), uuidParam(req, 'clinicId'), fields));
  });
  r.get('/appointments/:id', authed, async (req, res) => {
    res.json(await appointments.get(actorOf(req), uuidParam(req)));
  });
  r.patch('/appointments/:id', authed, async (req, res) => {
    res.json(await appointments.update(actorOf(req), uuidParam(req), parseBody(UpdateAppointmentSchema, req)));
  });
  r.delete('/appointments/:id', authed, async (req, res) => {
    await appointments.remove(actorOf(req), uuidParam(req));
    res.status(204).end();
  });

  return r;
}
