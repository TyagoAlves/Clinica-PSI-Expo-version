// Servidor simples integrado ao Supabase (PostgreSQL) usando o arquivo .env
require('dotenv').config();
const http = require('http');
const { Pool } = require('pg');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 3333;

// Conexão com o banco PostgreSQL do Supabase definido em DATABASE_URL no .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Cria as tabelas no Supabase caso ainda não existam e insere dados iniciais
async function inicializarBanco() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      servico TEXT NOT NULL,
      inicio TEXT NOT NULL,
      descricao TEXT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS secoes (
      id SERIAL PRIMARY KEY,
      paciente TEXT NOT NULL,
      servico TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      duracao TEXT NOT NULL,
      observacoes TEXT DEFAULT ''
    );
  `);

  // Se a tabela pacientes estiver vazia, insere os pacientes padrão
  const { rows: pacientesExistentes } = await pool.query(
    'SELECT COUNT(*) AS total FROM pacientes'
  );
  if (Number(pacientesExistentes[0].total) === 0) {
    await pool.query(`
      INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES
      ('Maria Silva', 'Psicoterapia', '10/03/2026', 'Ansiedade e rotina de trabalho intensa'),
      ('João Santos', 'Avaliação', '05/08/2026', 'Avaliação psicológica inicial'),
      ('Ana Oliveira', 'Psicoterapia', '01/11/2026', 'Acompanhamento quinzenal');
    `);
  }

  // Se a tabela secoes estiver vazia, insere as seções padrão
  const { rows: secoesExistentes } = await pool.query(
    'SELECT COUNT(*) AS total FROM secoes'
  );
  if (Number(secoesExistentes[0].total) === 0) {
    await pool.query(`
      INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes) VALUES
      ('Maria Silva', 'Psicoterapia', '12/11/2026', '14:00', '00:50', 'Sessão de acompanhamento semanal'),
      ('João Santos', 'Avaliação', '12/11/2026', '15:00', '00:50', 'Primeira consulta, trazer exames');
    `);
  }

  console.log('Banco Supabase inicializado e sincronizado com sucesso!');
}

function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let corpo = '';
    req.on('data', (pedaco) => (corpo += pedaco));
    req.on('end', () => {
      try {
        resolve(corpo ? JSON.parse(corpo) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function responderJson(res, status, dados) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(dados));
}

const servidor = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return responderJson(res, 200, { ok: true });
  }

  const url = req.url || '/';

  try {
    // --- ROTAS DE PACIENTES ---
    if (url === '/pacientes' && req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT * FROM pacientes ORDER BY id ASC'
      );
      return responderJson(res, 200, rows);
    }

    if (url === '/pacientes' && req.method === 'POST') {
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);
      const { rows } = await pool.query(
        'INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome, servico, inicio, descricao]
      );
      return responderJson(res, 201, rows[0]);
    }

    if (url.startsWith('/pacientes/') && req.method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);
      const { rows } = await pool.query(
        'UPDATE pacientes SET nome = $1, servico = $2, inicio = $3, descricao = $4 WHERE id = $5 RETURNING *',
        [nome, servico, inicio, descricao, id]
      );
      return responderJson(res, 200, rows[0]);
    }

    if (url.startsWith('/pacientes/') && req.method === 'DELETE') {
      const id = Number(url.split('/')[2]);
      await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
      return responderJson(res, 200, { removido: true });
    }

    // --- ROTAS DE SEÇÕES (AGENDA) ---
    if (url === '/secoes' && req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM secoes ORDER BY id ASC');
      return responderJson(res, 200, rows);
    }

    if (url === '/secoes' && req.method === 'POST') {
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);
      const { rows } = await pool.query(
        'INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [paciente, servico, data, horario, duracao, observacoes || '']
      );
      return responderJson(res, 201, rows[0]);
    }

    if (url.startsWith('/secoes/') && req.method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);
      const { rows } = await pool.query(
        'UPDATE secoes SET paciente = $1, servico = $2, data = $3, horario = $4, duracao = $5, observacoes = $6 WHERE id = $7 RETURNING *',
        [paciente, servico, data, horario, duracao, observacoes || '', id]
      );
      return responderJson(res, 200, rows[0]);
    }

    if (url.startsWith('/secoes/') && req.method === 'DELETE') {
      const id = Number(url.split('/')[2]);
      await pool.query('DELETE FROM secoes WHERE id = $1', [id]);
      return responderJson(res, 200, { removido: true });
    }

    return responderJson(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    console.error('Erro no servidor:', erro.message);
    return responderJson(res, 500, { erro: erro.message });
  }
});

// Se for executado com --init, apenas cria/verifica as tabelas no Supabase e encerra
if (process.argv.includes('--init')) {
  inicializarBanco()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Falha ao conectar no Supabase:', err.message);
      process.exit(1);
    });
} else {
  inicializarBanco()
    .then(() => {
      servidor.listen(PORT, HOST, () => {
        console.log(
          `Servidor conectado ao Supabase rodando em http://${HOST}:${PORT}`
        );
      });
    })
    .catch((err) => {
      console.error('Erro ao iniciar banco Supabase:', err.message);
    });
}
