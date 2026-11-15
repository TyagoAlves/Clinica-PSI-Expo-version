// Cria uma conta (usuário + clínica) direto no banco do .env.
// O app não tem tela de cadastro: as contas são criadas por aqui.
//
// Uso (dentro da pasta api):
//   npm run criar-conta -- "Ana Souza" ana@clinica.com.br minhasenha "Clínica Psi"
//                           nome        e-mail             senha      nome da clínica (opcional)
import { loadEnv } from '../src/config/env.js';
import { createPostgresDb, openDatabase } from '../src/db/connection.js';
import { createPostgresRepositories } from '../src/repositories/postgres.js';
import { RegisterSchema } from '../src/routes/schemas.js';
import { createFieldCipher, parseKey } from '../src/security/fieldCipher.js';
import { AuthService } from '../src/services/auth.js';

const [name, email, password, clinicName] = process.argv.slice(2);
if (!name || !email || !password) {
  console.log('Uso: npm run criar-conta -- "Nome Completo" email@exemplo.com senha "Nome da Clínica"');
  process.exit(1);
}

const dados = RegisterSchema.safeParse({ name, email, password, clinicName });
if (!dados.success) {
  console.error('Dados inválidos:', dados.error.issues.map((i) => i.message).join(' '));
  process.exit(1);
}

const env = loadEnv();
const db = await openDatabase(createPostgresDb(env.DATABASE_URL));
try {
  const repos = createPostgresRepositories(db, createFieldCipher(parseKey(env.DATA_ENCRYPTION_KEY)));
  const auth = new AuthService(repos.users, repos.clinics, repos.sessions, env.SESSION_TTL_DAYS);
  const { user, token } = await auth.register(dados.data);
  await auth.logout(token); // o script não precisa ficar logado
  const clinic = await repos.clinics.findById(user.clinicId!);
  console.log(`Conta criada: ${user.name} <${user.email}> na clínica "${clinic?.name}".`);
  console.log('Agora é só entrar no app com esse e-mail e senha.');
} catch (e) {
  console.error('Não foi possível criar a conta:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await db.close();
}
