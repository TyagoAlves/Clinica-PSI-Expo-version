// Teste de carga/integridade: sobe a API em memória numa porta livre, cria usuário + clínica
// e dispara requisições concorrentes de /sync (push) e de listagem. No fim confere se
// todos os pacientes enviados foram gravados (integridade).
// Uso: npm run load-test  [-- --connections 20 --duration 10]
import { randomBytes, randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import autocannon from 'autocannon';
import { createApp } from '../src/app.js';
import { createSqliteRepositories } from '../src/repositories/sqlite.js';
import { createTestDb } from '../test/db.js';
import { createFieldCipher } from '../src/security/fieldCipher.js';

const arg = (name: string, def: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const connections = arg('connections', 20);
const duration = arg('duration', 10);

// SQLite em memória: não toca no banco clinica.db.
const db = await createTestDb();
const app = createApp({ repos: createSqliteRepositories(db, createFieldCipher(randomBytes(32))), logRequests: false });
const server = app.listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const post = async (path: string, body: unknown, token?: string) => {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<any>;
};

const reg = await post('/api/v1/auth/register', { name: 'Carga', email: 'carga@clinica.dev', password: 'segredo1' });
const token: string = reg.token;
const clinic = await post('/api/v1/clinics', { name: 'Clínica Carga' }, token);

let sent = 0;
let syncOk = 0;
const result = await autocannon({
  url: base,
  connections,
  duration,
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  requests: [
    {
      method: 'POST',
      path: '/api/v1/sync',
      onResponse: (status: number) => {
        if (status === 200) syncOk++;
      },
      setupRequest: (req) => {
        const now = new Date().toISOString();
        sent++;
        return {
          ...req,
          body: JSON.stringify({
            lastPulledRev: 1_000_000_000, // só push; o pull completo é medido pelo GET de listagem
            changes: {
              patients: [
                {
                  id: randomUUID(),
                  name: `Paciente ${String.fromCharCode(65 + (sent % 26))}`,
                  phone: '11999990000',
                  service: 'Psicoterapia',
                  status: 'Em tratamento',
                  complaint: 'Teste de carga',
                  createdAt: now,
                  updatedAt: now,
                  deletedAt: null,
                },
              ],
            },
          }),
        };
      },
    },
    { method: 'GET', path: `/api/v1/clinics/${clinic.id}/patients` },
  ],
});

const stored = (await db.query<{ n: number }>('SELECT COUNT(*)::int AS n FROM patients'))[0]!.n;
const okSync = result['2xx'];
console.log(autocannon.printResult(result));
console.log(`Requisições 2xx: ${okSync} · não-2xx: ${result.non2xx} · erros: ${result.errors} · timeouts: ${result.timeouts}`);
console.log(`Syncs respondidos com 200: ${syncOk} · pacientes gravados no banco: ${stored}`);
server.close();
await db.close();
if (result.errors > 0 || result.non2xx > 0 || stored < syncOk) {
  console.error('FALHOU: erros, respostas não-2xx ou pacientes confirmados que não estão no banco.');
  process.exit(1);
}
