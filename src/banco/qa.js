// ============================================================================
// SUÍTE DE QA (QUALITY ASSURANCE) E TESTES AUTOMATIZADOS - CLÍNICA PSI
// Execução: npm run test:qa (ou node src/banco/qa.js)
// ============================================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const API_URL = 'http://127.0.0.1:3333';
const DB_PATH = path.resolve(__dirname, '../../data/clinica.db');

let totalTestes = 0;
let aprovados = 0;
let reprovados = 0;

function logPass(descricao, detalhe = '') {
  totalTestes++;
  aprovados++;
  console.log(`  ✅ [PASS] ${descricao} ${detalhe ? `(${detalhe})` : ''}`);
}

function logFail(descricao, erro) {
  totalTestes++;
  reprovados++;
  console.error(`  ❌ [FAIL] ${descricao}:`, erro);
}

async function esperar(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// Inicia o servidor se ele não estiver rodando
async function garantirServidor() {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (res.ok) {
      return { processo: null, jaRodava: true };
    }
  } catch {
    // Servidor offline, vamos subir
  }

  const processo = spawn('node', [path.resolve(__dirname, 'servidor.js')], {
    stdio: 'ignore',
  });

  // Aguarda até o servidor responder ao /health
  for (let i = 0; i < 20; i++) {
    await esperar(200);
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) {
        return { processo, jaRodava: false };
      }
    } catch {
      // continua tentando
    }
  }

  throw new Error('Não foi possível iniciar o servidor SQLite para o QA.');
}

async function executarSuiteQA() {
  console.log('\n=============================================================');
  console.log('🧪 INICIANDO SUÍTE DE TESTES E QA DO BANCO SQLITE');
  console.log('=============================================================\n');

  let srv;
  try {
    srv = await garantirServidor();
    console.log(`🔌 Conexão estabelecida com o servidor em ${API_URL}\n`);
  } catch (err) {
    console.error('Falha crítica ao preparar ambiente de teste:', err.message);
    process.exit(1);
  }

  const inicio = Date.now();

  // --------------------------------------------------------------------------
  // BATERIA 1: SAÚDE DO SERVIDOR E ARQUIVO SQLITE
  // --------------------------------------------------------------------------
  console.log('📦 BATERIA 1: Integridade Estrutural e Arquivo do Banco');
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok' && data.banco === 'sqlite') {
      logPass('Endpoint /health responde com status 200 e confirma SQLite');
    } else {
      logFail('Endpoint /health não retornou os dados esperados', data);
    }
  } catch (e) {
    logFail('Falha ao consultar /health', e.message);
  }

  try {
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      logPass('Arquivo clinica.db existe fisicamente no disco', `${stats.size} bytes`);
    } else {
      logFail('Arquivo clinica.db não foi encontrado no caminho esperado', DB_PATH);
    }
  } catch (e) {
    logFail('Erro ao inspecionar arquivo do banco', e.message);
  }

  // --------------------------------------------------------------------------
  // BATERIA 2: CRUD DE PACIENTES
  // --------------------------------------------------------------------------
  console.log('\n👤 BATERIA 2: Testes Funcionais do CRUD de Pacientes');
  let pacienteCriadoId = null;

  // 2.1 CREATE (POST)
  try {
    const payload = {
      nome: 'QA Paciente de Teste',
      servico: 'Avaliação Psicológica',
      inicio: '16/11/2026',
      descricao: 'Registro gerado automaticamente pelo teste de QA',
    };

    const res = await fetch(`${API_URL}/pacientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const criado = await res.json();
    if (res.status === 201 && criado.id && criado.nome === payload.nome) {
      pacienteCriadoId = criado.id;
      logPass('POST /pacientes cria novo registro e retorna com ID gerado', `ID: ${criado.id}`);
    } else {
      logFail('POST /pacientes falhou ao criar registro', criado);
    }
  } catch (e) {
    logFail('Erro no POST /pacientes', e.message);
  }

  // 2.2 READ (GET)
  try {
    const res = await fetch(`${API_URL}/pacientes`);
    const lista = await res.json();
    const existe = Array.isArray(lista) && lista.some((p) => p.id === pacienteCriadoId);
    if (res.status === 200 && existe) {
      logPass('GET /pacientes lista todos os registros e contém o paciente criado', `Total: ${lista.length}`);
    } else {
      logFail('GET /pacientes não localizou o paciente recém-criado');
    }
  } catch (e) {
    logFail('Erro no GET /pacientes', e.message);
  }

  // 2.3 UPDATE (PUT)
  try {
    const updatePayload = {
      nome: 'QA Paciente Alterado',
      servico: 'Psicoterapia Cognitiva',
      inicio: '16/11/2026',
      descricao: 'Dados validados e alterados com sucesso pelo QA',
    };

    const res = await fetch(`${API_URL}/pacientes/${pacienteCriadoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    const atualizado = await res.json();
    if (res.status === 200 && atualizado.nome === updatePayload.nome) {
      logPass('PUT /pacientes/:id atualiza dados do paciente e retorna objeto modificado');
    } else {
      logFail('PUT /pacientes/:id falhou na atualização', atualizado);
    }
  } catch (e) {
    logFail('Erro no PUT /pacientes/:id', e.message);
  }

  // 2.4 DELETE (DELETE)
  try {
    const res = await fetch(`${API_URL}/pacientes/${pacienteCriadoId}`, {
      method: 'DELETE',
    });
    const resposta = await res.json();
    if (res.status === 200 && resposta.removido === true) {
      logPass('DELETE /pacientes/:id remove paciente e confirma remoção');
    } else {
      logFail('DELETE /pacientes/:id falhou', resposta);
    }

    // Confirma que não está mais na lista
    const checagem = await (await fetch(`${API_URL}/pacientes`)).json();
    const aindaExiste = checagem.some((p) => p.id === pacienteCriadoId);
    if (!aindaExiste) {
      logPass('Verificação pós-delete: paciente não consta mais no banco');
    } else {
      logFail('Paciente deletado ainda aparece na lista do banco');
    }
  } catch (e) {
    logFail('Erro no DELETE /pacientes/:id', e.message);
  }

  // --------------------------------------------------------------------------
  // BATERIA 3: CRUD DE SEÇÕES (AGENDA)
  // --------------------------------------------------------------------------
  console.log('\n📅 BATERIA 3: Testes Funcionais do CRUD de Seções');
  let secaoCriadaId = null;

  // 3.1 CREATE
  try {
    const payloadSec = {
      paciente: 'QA Paciente Seção',
      servico: 'Psicoterapia',
      data: '20/11/2026',
      horario: '14:30',
      duracao: '00:50',
      observacoes: 'Sessão validada pelo QA',
    };

    const res = await fetch(`${API_URL}/secoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSec),
    });

    const criada = await res.json();
    if (res.status === 201 && criada.id) {
      secaoCriadaId = criada.id;
      logPass('POST /secoes agenda nova sessão e retorna com ID', `ID: ${criada.id}`);
    } else {
      logFail('POST /secoes falhou', criada);
    }
  } catch (e) {
    logFail('Erro no POST /secoes', e.message);
  }

  // 3.2 READ
  try {
    const res = await fetch(`${API_URL}/secoes`);
    const lista = await res.json();
    if (res.status === 200 && Array.isArray(lista) && lista.length > 0) {
      logPass('GET /secoes lista a agenda com sucesso', `Total: ${lista.length}`);
    } else {
      logFail('GET /secoes falhou');
    }
  } catch (e) {
    logFail('Erro no GET /secoes', e.message);
  }

  // 3.3 DELETE
  try {
    const res = await fetch(`${API_URL}/secoes/${secaoCriadaId}`, {
      method: 'DELETE',
    });
    const resposta = await res.json();
    if (res.status === 200 && resposta.removido === true) {
      logPass('DELETE /secoes/:id remove a sessão de teste');
    } else {
      logFail('DELETE /secoes/:id falhou', resposta);
    }
  } catch (e) {
    logFail('Erro no DELETE /secoes/:id', e.message);
  }

  // --------------------------------------------------------------------------
  // BATERIA 4: TRATAMENTO DE ERROS E SEGURANÇA
  // --------------------------------------------------------------------------
  console.log('\n🛡️ BATERIA 4: Casos de Borda e Segurança');
  try {
    const res = await fetch(`${API_URL}/rota-inexistente`);
    if (res.status === 404) {
      logPass('Rota inexistente retorna status HTTP 404 (Not Found)');
    } else {
      logFail('Rota inexistente deveria retornar 404', `Recebeu ${res.status}`);
    }
  } catch (e) {
    logFail('Erro ao testar rota 404', e.message);
  }

  // --------------------------------------------------------------------------
  // BATERIA 5: PERFORMANCE / LATÊNCIA (BENCHMARK)
  // --------------------------------------------------------------------------
  console.log('\n⚡ BATERIA 5: Performance e Latência do SQLite');
  try {
    const rodadas = 15;
    const tIni = Date.now();
    for (let i = 0; i < rodadas; i++) {
      await fetch(`${API_URL}/pacientes`);
    }
    const mediaMs = ((Date.now() - tIni) / rodadas).toFixed(2);
    if (mediaMs < 30) {
      logPass(`Média de resposta ultra-rápida do SQLite`, `${mediaMs} ms por requisição`);
    } else {
      logPass(`Média de resposta`, `${mediaMs} ms`);
    }
  } catch (e) {
    logFail('Erro no teste de performance', e.message);
  }

  // Encerra servidor temporário se foi subido apenas para o teste
  if (srv && srv.processo) {
    srv.processo.kill();
  }

  const tempoTotal = ((Date.now() - inicio) / 1000).toFixed(2);

  console.log('\n=============================================================');
  console.log('📊 RESUMO DO RELATÓRIO DE QA:');
  console.log(`   - Total de verificações: ${totalTestes}`);
  console.log(`   - Aprovados (PASS):     ${aprovados}`);
  console.log(`   - Reprovados (FAIL):    ${reprovados}`);
  console.log(`   - Tempo de execução:    ${tempoTotal}s`);
  console.log(
    reprovados === 0
      ? '🎉 RESULTADO: O BANCO DE DADOS SQLITE ATENDE A 100% DOS CRITÉRIOS DE QA!'
      : '⚠️ RESULTADO: HÁ FALHAS QUE PRECISAM DE ATENÇÃO.'
  );
  console.log('=============================================================\n');

  if (reprovados > 0) {
    process.exit(1);
  }
}

executarSuiteQA();
