import { Router, type Request } from 'express';
import { currentUser, requireAuth } from '../middleware/auth.js';
import { parseBody, uuidParam } from '../middleware/http.js';
import type { Repositories } from '../repositories/types.js';
import { LoginRateLimiter } from '../security/loginRateLimiter.js';
import { AuthService, toPublicUser } from '../services/auth.js';
import { ClinicService } from '../services/clinic.js';
import { HttpError } from '../services/errors.js';
import { type Actor, AppointmentService, EvolutionService, PatientService, ServiceCatalog } from '../services/records.js';
import {
  AppointmentFieldsSchema,
  AppointmentRangeSchema,
  ChangePasswordSchema,
  ProfileSchema,
  UpdateAppointmentSchema,
  UpdateServiceSchema,
  CreateClinicSchema,
  CreatePatientSchema,
  EvolutionCreateSchema,
  EvolutionUpdateSchema,
  LoginSchema,
  PageQuerySchema,
  RegisterSchema,
  ServiceSchema,
  UpdateClinicSchema,
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
  const auth = new AuthService(repos.users, repos.sessions, sessionTtlDays);
  const clinics = new ClinicService(repos.clinics, repos.users, repos.services);
  const patients = new PatientService(repos.patients);
  const catalog = new ServiceCatalog(repos.services);
  const evolutions = new EvolutionService(repos.evolutions, repos.patients);
  const appointments = new AppointmentService(repos.appointments, repos.patients);
  const authed = requireAuth(auth);
  const r = Router();

  r.get('/ping', (_req, res) => {
    res.json({ pong: true, time: new Date().toISOString() });
  });

  // ---- Auth (público) ----
  r.post('/auth/register', async (req, res) => {
    res.status(201).json(await auth.register(parseBody(RegisterSchema, req)));
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

  // ---- A partir daqui, tudo exige sessão ----
  r.post('/auth/logout', authed, async (req, res) => {
    await auth.logout(req.authToken!);
    res.status(204).end();
  });

  r.get('/me', authed, async (req, res) => {
    const user = currentUser(req);
    const clinic = user.clinicId ? await repos.clinics.findById(user.clinicId) : null;
    res.json({ user: toPublicUser(user), clinic });
  });

  r.patch('/me', authed, async (req, res) => {
    res.json(await auth.updateProfile(currentUser(req), parseBody(ProfileSchema, req)));
  });

  r.post('/auth/change-password', authed, async (req, res) => {
    const { currentPassword, newPassword } = parseBody(ChangePasswordSchema, req);
    await auth.changePassword(currentUser(req), req.authToken!, currentPassword, newPassword);
    res.status(204).end();
  });

  // ---- Clínicas ----
  r.post('/clinics', authed, async (req, res) => {
    res.status(201).json(await clinics.createForUser(currentUser(req), parseBody(CreateClinicSchema, req)));
  });
  r.get('/clinics/:id', authed, async (req, res) => {
    res.json(await clinics.get(currentUser(req), uuidParam(req)));
  });
  r.patch('/clinics/:id', authed, async (req, res) => {
    res.json(await clinics.update(currentUser(req), uuidParam(req), parseBody(UpdateClinicSchema, req)));
  });
  r.get('/clinics/:id/members', authed, async (req, res) => {
    res.json(await clinics.members(currentUser(req), uuidParam(req)));
  });

  // ---- Pacientes ----
  r.get('/clinics/:clinicId/patients', authed, async (req, res) => {
    res.json(await patients.list(actorOf(req), uuidParam(req, 'clinicId'), pageOf(req)));
  });
  r.post('/clinics/:clinicId/patients', authed, async (req, res) => {
    const fields = parseBody(CreatePatientSchema, req);
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

  // ---- Evoluções (prontuário) ----
  r.get('/patients/:id/evolutions', authed, async (req, res) => {
    const { limit, offset } = pageOf(req);
    res.json(await evolutions.listByPatient(actorOf(req), uuidParam(req), limit, offset));
  });
  r.get('/clinics/:clinicId/evolutions', authed, async (req, res) => {
    const { limit, offset } = pageOf(req);
    res.json(await evolutions.listRecent(actorOf(req), uuidParam(req, 'clinicId'), limit, offset));
  });
  r.post('/patients/:id/evolutions', authed, async (req, res) => {
    res.status(201).json(await evolutions.create(actorOf(req), uuidParam(req), parseBody(EvolutionCreateSchema, req)));
  });
  r.get('/evolutions/:id', authed, async (req, res) => {
    res.json(await evolutions.get(actorOf(req), uuidParam(req)));
  });
  r.patch('/evolutions/:id', authed, async (req, res) => {
    res.json(await evolutions.update(actorOf(req), uuidParam(req), parseBody(EvolutionUpdateSchema, req)));
  });
  r.delete('/evolutions/:id', authed, async (req, res) => {
    await evolutions.remove(actorOf(req), uuidParam(req));
    res.status(204).end();
  });

  // ---- Serviços (catálogo da clínica) ----
  r.get('/clinics/:clinicId/services', authed, async (req, res) => {
    res.json(await catalog.list(actorOf(req), uuidParam(req, 'clinicId'), pageOf(req)));
  });
  r.post('/clinics/:clinicId/services', authed, async (req, res) => {
    res.status(201).json(await catalog.create(actorOf(req), uuidParam(req, 'clinicId'), parseBody(ServiceSchema, req)));
  });
  r.patch('/services/:id', authed, async (req, res) => {
    res.json(await catalog.update(actorOf(req), uuidParam(req), parseBody(UpdateServiceSchema, req)));
  });
  r.delete('/services/:id', authed, async (req, res) => {
    await catalog.remove(actorOf(req), uuidParam(req));
    res.status(204).end();
  });

  // ---- Agenda (sessões) ----
  r.get('/clinics/:clinicId/appointments', authed, async (req, res) => {
    const { from, to, limit, offset, patientId } = AppointmentRangeSchema.parse(req.query);
    res.json(await appointments.listRange(actorOf(req), uuidParam(req, 'clinicId'), from, to, limit, offset, patientId));
  });
  r.post('/clinics/:clinicId/appointments', authed, async (req, res) => {
    const fields = parseBody(AppointmentFieldsSchema, req);
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
