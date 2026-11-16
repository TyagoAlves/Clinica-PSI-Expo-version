// ============================================================================
// ARQUIVO: src/banco/servidor.js
// FUNÇÃO: Servidor Back-end em Node.js que faz a ponte entre o Aplicativo (HTTP)
//         e o Banco de Dados PostgreSQL na nuvem do Supabase (protocolo TCP).
// ============================================================================

// Importa o módulo nativo 'path' do Node.js para localizar caminhos de pastas no computador
const path = require('path');

// Importa o 'dotenv' e carrega o arquivo '.env' que está duas pastas acima (../../.env, na raiz do projeto)
// Isso injeta as variáveis secretas (como DATABASE_URL, HOST e PORT) dentro de 'process.env'
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Importa o módulo nativo 'http' do Node.js para criar o servidor web local sem precisar de Express
const http = require('http');

// Importa a classe 'Pool' da biblioteca 'pg' (node-postgres), que é o driver oficial do PostgreSQL para Node.js
const { Pool } = require('pg');

// Define o endereço onde o servidor vai rodar: usa o HOST do .env ou '127.0.0.1' (localhost) como padrão
const HOST = process.env.HOST || '127.0.0.1';

// Define a porta onde o servidor vai escutar: usa a PORT do .env convertida para número ou 3333 como padrão
const PORT = Number(process.env.PORT) || 3333;

// Cria o Pool (conjunto) de conexões com o PostgreSQL do Supabase
// Em vez de abrir e fechar uma conexão nova a cada clique (o que seria lento), o Pool mantém conexões prontas
const pool = new Pool({
  // Pega a URL completa com usuário, senha, host e porta do Supabase que está protegida no arquivo .env
  connectionString: process.env.DATABASE_URL,
  // Exige conexão criptografada (SSL/TLS) com a nuvem da AWS/Supabase, aceitando o certificado do pooler
  ssl: { rejectUnauthorized: false },
});

// ============================================================================
// FUNÇÃO: inicializarBanco()
// Roda automaticamente ao ligar o servidor para garantir que as tabelas existam
// no Supabase e, se estiverem vazias, insere os registros iniciais de exemplo.
// ============================================================================
async function inicializarBanco() {
  // 1. Executa comando SQL (DDL) para criar a tabela 'pacientes' caso ela ainda não exista no Supabase
  // - id SERIAL PRIMARY KEY: o próprio PostgreSQL gera o ID único auto-incrementado (1, 2, 3...)
  // - TEXT NOT NULL: campos de texto obrigatórios (não aceitam valor nulo)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pacientes (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      servico TEXT NOT NULL,
      inicio TEXT NOT NULL,
      descricao TEXT NOT NULL
    );
  `);

  // 2. Executa comando SQL (DDL) para criar a tabela 'secoes' (Agenda) caso ela ainda não exista
  // - observacoes TEXT DEFAULT '': campo opcional que, se não for enviado, salva texto vazio ''
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

  // 3. Conta quantos registros já existem na tabela 'pacientes' lá no Supabase
  const { rows: pacientesExistentes } = await pool.query(
    'SELECT COUNT(*) AS total FROM pacientes'
  );

  // Se o total for 0 (tabela recém-criada ou vazia), insere 3 pacientes iniciais (Seed)
  if (Number(pacientesExistentes[0].total) === 0) {
    await pool.query(`
      INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES
      ('Maria Silva', 'Psicoterapia', '10/03/2026', 'Ansiedade e rotina de trabalho intensa'),
      ('João Santos', 'Avaliação', '05/08/2026', 'Avaliação psicológica inicial'),
      ('Ana Oliveira', 'Psicoterapia', '01/11/2026', 'Acompanhamento quinzenal');
    `);
  }

  // 4. Conta quantos registros já existem na tabela 'secoes' lá no Supabase
  const { rows: secoesExistentes } = await pool.query(
    'SELECT COUNT(*) AS total FROM secoes'
  );

  // Se o total for 0 (tabela vazia), insere 2 sessões iniciais na agenda (Seed)
  if (Number(secoesExistentes[0].total) === 0) {
    await pool.query(`
      INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes) VALUES
      ('Maria Silva', 'Psicoterapia', '12/11/2026', '14:00', '00:50', 'Sessão de acompanhamento semanal'),
      ('João Santos', 'Avaliação', '12/11/2026', '15:00', '00:50', 'Primeira consulta, trazer exames');
    `);
  }

  // Exibe confirmação no terminal informando que o banco está pronto
  console.log('Banco Supabase inicializado e sincronizado com sucesso!');
}

// ============================================================================
// FUNÇÃO AUXILIAR: lerCorpoJson(req)
// Lê os dados enviados pelo aplicativo no corpo (body) de requisições POST e PUT.
// Como o Node.js puro recebe os dados da rede em pedaços (stream), juntamos tudo
// e depois convertemos de texto JSON para objeto JavaScript com JSON.parse().
// ============================================================================
function lerCorpoJson(req) {
  return new Promise((resolve, reject) => {
    let corpo = ''; // Variável que vai acumular o texto JSON que chega pela rede
    req.on('data', (pedaco) => (corpo += pedaco)); // A cada pedaço recebido, concatena na variável 'corpo'
    req.on('end', () => {
      // Quando todos os pedaços terminam de chegar:
      try {
        // Transforma a string JSON em um objeto JavaScript (ou retorna {} se vier vazio)
        resolve(corpo ? JSON.parse(corpo) : {});
      } catch (e) {
        // Se o JSON estiver malformado, rejeita a Promise e cai no bloco catch do servidor
        reject(e);
      }
    });
  });
}

// ============================================================================
// FUNÇÃO AUXILIAR: responderJson(res, status, dados)
// Padroniza todas as respostas do servidor para o aplicativo em formato JSON
// e configura os cabeçalhos de CORS (Cross-Origin Resource Sharing).
// ============================================================================
function responderJson(res, status, dados) {
  res.writeHead(status, {
    // Avisa ao navegador/app que a resposta é um JSON codificado em UTF-8 (aceita acentos)
    'Content-Type': 'application/json; charset=utf-8',
    // CORS: Libera que o Expo Web (porta 8081) converse com este servidor (porta 3333) sem bloqueio do navegador
    'Access-Control-Allow-Origin': '*',
    // CORS: Libera os 4 métodos do CRUD (GET, POST, PUT, DELETE) + OPTIONS
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    // CORS: Autoriza o envio do cabeçalho Content-Type nas requisições
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  // Converte o objeto/array JavaScript em texto JSON e finaliza o envio da resposta
  res.end(JSON.stringify(dados));
}

// ============================================================================
// CRIAÇÃO DO SERVIDOR HTTP E ROTAS DO CRUD (PACIENTES E SEÇÕES)
// Toda requisição que chega em http://127.0.0.1:3333 entra nesta função async.
// ============================================================================
const servidor = http.createServer(async (req, res) => {
  // Tratamento de Preflight (OPTIONS): antes de um POST, PUT ou DELETE, o navegador
  // pergunta ao servidor via método OPTIONS se a operação é permitida pelo CORS. Respondemos 200 OK.
  if (req.method === 'OPTIONS') {
    return responderJson(res, 200, { ok: true });
  }

  // Pega o caminho da rota chamada pelo aplicativo (ex.: '/pacientes' ou '/pacientes/4')
  const url = req.url || '/';

  try {
    // ========================================================================
    // ROTAS DA TABELA: PACIENTES
    // ========================================================================

    // 1. READ (Listar Pacientes) -> Método GET em '/pacientes'
    if (url === '/pacientes' && req.method === 'GET') {
      // Busca todas as colunas (*) da tabela pacientes ordenadas pelo ID crescente (ASC)
      const { rows } = await pool.query(
        'SELECT * FROM pacientes ORDER BY id ASC'
      );
      // Retorna status 200 (OK) com a lista de pacientes vinda do Supabase
      return responderJson(res, 200, rows);
    }

    // 2. CREATE (Cadastrar Paciente) -> Método POST em '/pacientes'
    if (url === '/pacientes' && req.method === 'POST') {
      // Lê os 4 campos enviados pelo formulário da TelaNovoPaciente
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);
      // Insere no Supabase usando parâmetros ($1, $2, $3, $4) para evitar SQL Injection
      // O comando 'RETURNING *' faz o PostgreSQL devolver o registro criado já com o 'id' gerado
      const { rows } = await pool.query(
        'INSERT INTO pacientes (nome, servico, inicio, descricao) VALUES ($1, $2, $3, $4) RETURNING *',
        [nome, servico, inicio, descricao]
      );
      // Retorna status 201 (Created) com o paciente recém-criado (rows[0])
      return responderJson(res, 201, rows[0]);
    }

    // 3. UPDATE (Editar Paciente) -> Método PUT em '/pacientes/:id' (ex.: '/pacientes/4')
    if (url.startsWith('/pacientes/') && req.method === 'PUT') {
      // Quebra a URL nas barras ('/pacientes/4' -> ['', 'pacientes', '4']) e pega o ID na posição [2]
      const id = Number(url.split('/')[2]);
      // Lê os novos dados digitados na TelaEditarPaciente
      const { nome, servico, inicio, descricao } = await lerCorpoJson(req);
      // Atualiza no Supabase apenas a linha cujo id seja igual a $5, devolvendo a linha atualizada com RETURNING *
      const { rows } = await pool.query(
        'UPDATE pacientes SET nome = $1, servico = $2, inicio = $3, descricao = $4 WHERE id = $5 RETURNING *',
        [nome, servico, inicio, descricao, id]
      );
      // Retorna status 200 (OK) com o paciente atualizado
      return responderJson(res, 200, rows[0]);
    }

    // 4. DELETE (Apagar Paciente) -> Método DELETE em '/pacientes/:id' (ex.: '/pacientes/4')
    if (url.startsWith('/pacientes/') && req.method === 'DELETE') {
      // Extrai o ID da URL e converte para número
      const id = Number(url.split('/')[2]);
      // Executa o DELETE no Supabase removendo apenas o paciente daquele ID ($1)
      await pool.query('DELETE FROM pacientes WHERE id = $1', [id]);
      // Retorna status 200 (OK) confirmando a remoção
      return responderJson(res, 200, { removido: true });
    }

    // ========================================================================
    // ROTAS DA TABELA: SEÇÕES (AGENDA)
    // ========================================================================

    // 1. READ (Listar Seções da Agenda) -> Método GET em '/secoes'
    if (url === '/secoes' && req.method === 'GET') {
      // Busca todas as seções agendadas ordenadas pelo ID crescente
      const { rows } = await pool.query('SELECT * FROM secoes ORDER BY id ASC');
      return responderJson(res, 200, rows);
    }

    // 2. CREATE (Agendar Nova Seção) -> Método POST em '/secoes'
    if (url === '/secoes' && req.method === 'POST') {
      // Lê os 6 campos enviados pelo formulário da TelaNovaSecao
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);
      // Insere na tabela 'secoes' com parâmetros protegidos ($1 a $6) e devolve o registro criado (RETURNING *)
      const { rows } = await pool.query(
        'INSERT INTO secoes (paciente, servico, data, horario, duracao, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [paciente, servico, data, horario, duracao, observacoes || '']
      );
      return responderJson(res, 201, rows[0]);
    }

    // 3. UPDATE (Editar Seção da Agenda) -> Método PUT em '/secoes/:id'
    if (url.startsWith('/secoes/') && req.method === 'PUT') {
      // Extrai o ID da seção a partir da URL (ex.: '/secoes/3' -> 3)
      const id = Number(url.split('/')[2]);
      // Lê os dados alterados enviados pela TelaEditarSecao
      const { paciente, servico, data, horario, duracao, observacoes } =
        await lerCorpoJson(req);
      // Atualiza a seção correspondente ao ID ($7) no Supabase e devolve o registro atualizado
      const { rows } = await pool.query(
        'UPDATE secoes SET paciente = $1, servico = $2, data = $3, horario = $4, duracao = $5, observacoes = $6 WHERE id = $7 RETURNING *',
        [paciente, servico, data, horario, duracao, observacoes || '', id]
      );
      return responderJson(res, 200, rows[0]);
    }

    // 4. DELETE (Apagar Seção da Agenda) -> Método DELETE em '/secoes/:id'
    if (url.startsWith('/secoes/') && req.method === 'DELETE') {
      // Extrai o ID da seção a partir da URL
      const id = Number(url.split('/')[2]);
      // Remove a seção do banco Supabase pelo ID ($1)
      await pool.query('DELETE FROM secoes WHERE id = $1', [id]);
      return responderJson(res, 200, { removido: true });
    }

    // Se o aplicativo chamar qualquer URL que não exista acima, retorna erro 404 (Não Encontrado)
    return responderJson(res, 404, { erro: 'Rota não encontrada' });
  } catch (erro) {
    // Se ocorrer qualquer falha de banco ou rede, mostra no terminal e retorna erro 500 ao app sem derrubar o servidor
    console.error('Erro no servidor:', erro.message);
    return responderJson(res, 500, { erro: erro.message });
  }
});

// ============================================================================
// PARTIDA DO SERVIDOR
// ============================================================================
// Se o arquivo for rodado com a flag '--init' (node src/banco/servidor.js --init),
// ele apenas cria/sincroniza as tabelas no Supabase e encerra a conexão.
if (process.argv.includes('--init')) {
  inicializarBanco()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Falha ao conectar no Supabase:', err.message);
      process.exit(1);
    });
} else {
  // Modo normal (npm run servidor): sincroniza as tabelas no Supabase e deixa o servidor
  // escutando continuamente em http://127.0.0.1:3333 aguardando os cliques do aplicativo.
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
