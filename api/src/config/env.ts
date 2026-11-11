import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3333),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:8081')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  DATABASE_PATH: z.string().default('clinica.db'),
  DATA_ENCRYPTION_KEY: z
    .string({ required_error: 'Defina DATA_ENCRYPTION_KEY no .env (gere com: npm run gen:key).' })
    .min(1, 'Defina DATA_ENCRYPTION_KEY no .env (gere com: npm run gen:key).'),
  DATA_ENCRYPTION_KEY_ID: z.string().default('v1'),
  DATA_ENCRYPTION_OLD_KEYS: z.string().default(''),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Variáveis de ambiente inválidas: ${issues}`);
  }
  return parsed.data;
}   