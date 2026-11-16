// ============================================================================
// ARQUIVO: src/banco/servidor.js
// FUNÇÃO: Servidor Back-end em Node.js usando BANCO DE DADOS LOCAL SQLITE.
//         Atende as requisições HTTP do aplicativo (GET, POST, PUT, DELETE)
//         e persiste os dados no arquivo local clinica.db (pasta data/).
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

// Carrega as variáveis do arquivo .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Importa o driver oficial e de alta performance do SQLite para Node.js
const Database = require('better-sqlite3');

// Define endereço, porta e caminho do arquivo do banco SQLite
// '0.0.0.0' permite conexões locais (localhost / 127.0.0.1) e de dispositivos na mesma rede (Wi-Fi)
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3333;
const DB_PATH = process.env.DB_PATH || './data/clinica.db';

// Garante que a pasta do banco (ex.: ./data) exista no computador
const dbDir = path.dirname(path.resolve(__dirname, '../../', DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Abre/Cria o arquivo local do banco SQLite (clinica.db)
const db = new Database(path.resolve(__dirname, '../../', DB_PATH));

// Ativa o modo WAL (Write-Ahead Logging) do SQLite para maior rapidez e segurança de concorrência
db.pragma('journal_mode = WAL');

// ============================================================================
// FUNÇÃO: inicializarBanco()
// Cria as tabelas necessárias no SQLite caso ainda não existam e,
// se o banco estiver vazio, insere registros iniciais de exemplo.
// ============================================================================
function inicializarBanco() {
  // 1. Criação da tabela 'pacientes' no SQLite
  // - id INTEGER PRIMARY KEY AUTOINCREMENT: ID auto-incrementado pelo SQLite (1, 2, 3...)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      servico TEXT NOT NULL,
      inicio TEXT NOT NULL,
      descricao TEXT NOT NULL
    );
  `);

  // 2. Criação da tabela 'secoes' (Agenda) no SQLite
  db.exec(`
    CREATE TABLE IF NOT EXISTS secoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente TEXT NOT NULL,
      servico TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      duracao TEXT NOT NULL,
      observacoes TEXT DEFAULT ''
    );
  `);

  // 3. Verifica se a tabela 'pacientes' está vazia
  const totalPacientes = db
    .prepare('SELECT COUNT(*) AS total FROM pacientes')
    .get().total;

  if (totalPacientes === 0) {
    const insertPaciente = db.prepare(`
      INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES (?, ?, ?, ?)
    `);

    insertPaciente.run('Maria Silva', 'Psicoterapia', '10/03/2026', 'Ansiedade e rotina de trabalho intensa');
    insertPaciente.run('João Santos', 'Avaliação', '05/08/2026', 'Avaliação psicológica inicial');
    insertPaciente.run('Ana Oliveira', 'Psicoterapia', '01/11/2026', 'Acompanhamento quinzenal');
  }

  // 4. Verifica se a tabela 'secoes' está vazia
  const totalSecoes = db
    .prepare('SELECT COUNT(*) AS total FROM secoes')
    .get().total;

  if (totalSecoes === 0) {
    const insertSecao = db.prepare(`
      INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertSecao.run('Maria Silva', 'Psicoterapia', '12/11/2026', '14:00', '00:50', 'Sessão de acompanhamento semanal');
    insertSecao.run('João Santos', 'Avaliação', '12/11/2026', '15:00', '00:50', 'Primeira consulta, trazer exames');
  }

  console.log(`Banco de Dados SQLite inicializado com sucesso em: ${DB_PATH}`);
}

// ============================================================================
// FUNÇÃO AUXILIAR: lerCorpoJson(req) - Versão Simplificada Moderna
// Usa 'for await' para acumular os pedaços recebidos pela rede e converte em JSON.
// ============================================================================
async function lerCorpoJson(req) {
  let corpo = '';
  for await (const pedaco of req) {
    corpo += pedaco;
  }
  return corpo ? JSON.parse(corpo) : {};
}

// ============================================================================
// FUNÇÃO AUXILIAR: responderJson(res, status, dados)
// Padroniza as respostas HTTP do servidor em formato JSON e libera o CORS.
// ============================================================================
function responderJson(res, status, dados) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*', // Libera para o Expo Web (localhost:8081)
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(dados));
}

// ============================================================================
// SERVIDOR HTTP: ROTAS DO CRUD EM SQLITE (PACIENTES E SEÇÕES)
// ============================================================================
const servidor = http.createServer(async (req, res) => {
  // Resposta para requisição de preflight do CORS
  if (req.method === 'OPTIONS') {
    return responderJson(res, 200, { ok: true });
  }

  const url = req.url || '/';

  try {
    // ========================================================================
    // ROTA DE SAÚDE (HEALTH CHECK / QA)
    // ========================================================================
    if (url === '/health' && req.method === 'GET') {
      return responderJson(res, 200, {
        status: 'ok',
        banco: 'sqlite',
        arquivo: DB_PATH,
        tabelas: ['pacientes', 'secoes'],
        timestamp: new Date().toISOString(),
      });
    }

    // ========================================================================
    // ROTAS: PACIENTES (CRUD EM SQLITE)
    // ========================================================================

    // 1. READ: Listar todos os pacientes (GET /pacientes)
    if (url === '/pacientes' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM pacientes ORDER BY id ASC').all();
      return responderJson(res, 200, rows);
    }

    // 2. CREATE: Cadastrar novo paciente (POST /pacientes)
    if (url === '/pacientes' && req.method === 'POST') {
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);
      const novoPaciente = db
        .prepare(`
          INSERT INTO pacientes (nome, servico, inicio, descricao)
          VALUES (?, ?, ?, ?)
          RETURNING *
        `)
        .get(nome, servico, inicio, descricao);

      return responderJson(res, 201, novoPaciente);
    }

    // 3. UPDATE: Editar paciente existente (PUT /pacientes/:id)
    if (url.startsWith('/pacientes/') && req.method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);

      const pacienteAtualizado = db
        .prepare(`
          UPDATE pacientes
          SET nome = ?, servico = ?, inicio = ?, descricao = ?
          WHERE id = ?
          RETURNING *
        `)
        .get(nome, servico, inicio, descricao, id);

      return responderJson(res, 200, pacienteAtualizado);
    }

    // 4. DELETE: Remover paciente (DELETE /pacientes/:id)
    if (url.startsWith('/pacientes/') && req.method === 'DELETE') {
      const id = Number(url.split('/')[2]);
      db.prepare('DELETE FROM pacientes WHERE id = ?').run(id);
      return responderJson(res, 200, { removido: true });
    }

    // ========================================================================
    // ROTAS: SEÇÕES DA AGENDA (CRUD EM SQLITE)
    // ========================================================================

    // 1. READ: Listar todas as seções (GET /secoes)
    if (url === '/secoes' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM secoes ORDER BY id ASC').all();
      return responderJson(res, 200, rows);
    }

    // 2. CREATE: Agendar nova seção (POST /secoes)
    if (url === '/secoes' && req.method === 'POST') {
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);

      const novaSecao = db
        .prepare(`
          INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `)
        .get(paciente, servico, data, horario, duracao, observacoes || '');

      return responderJson(res, 201, novaSecao);
    }

    // 3. UPDATE: Editar seção agendada (PUT /secoes/:id)
    if (url.startsWith('/secoes/') && req.method === 'PUT') {
      const id = Number(url.split('/')[2]);
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);

      const secaoAtualizada = db
        .prepare(`
          UPDATE secoes
          SET paciente = ?, servico = ?, data = ?, horario = ?, duracao = ?, observacoes = ?
          WHERE id = ?
          RETURNING *
        `)
        .get(paciente, servico, data, horario, duracao, observacoes || '', id);

      return responderJson(res, 200, secaoAtualizada);
    }

    // 4. DELETE: Cancelar/Apagar seção (DELETE /secoes/:id)
    if (url.startsWith('/secoes/') && req.method === 'DELETE') {
      const id = Number(url.split('/')[2]);
      db.prepare('DELETE FROM secoes WHERE id = ?').run(id);
      return responderJson(res, 200, { removido: true });
    }

    return responderJson(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    console.error('Erro no servidor SQLite:', erro.message);
    return responderJson(res, 500, { erro: erro.message });
  }
});

// ============================================================================
// PARTIDA DO SERVIDOR SQLITE
// ============================================================================
if (process.argv.includes('--init')) {
  inicializarBanco();
  console.log('Verificação/Inicialização do SQLite finalizada.');
  process.exit(0);
} else {
  inicializarBanco();
  servidor.listen(PORT, HOST, () => {
    console.log(`Servidor SQLite rodando com sucesso em http://${HOST}:${PORT}`);
  });
}
