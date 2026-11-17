// ============================================================================
// ARQUIVO: src/banco/bancoDados.js
// FUNÇÃO: Cliente HTTP do Front-end (Mensageiro).
//         Contém as 4 funções do CRUD que o App.js chama para conversar com o
//         servidor Node.js local (src/banco/servidor.js), persistindo em SQLite.
// ============================================================================

// Resolve dinamicamente a URL da API:
// Se estiver no navegador, usa o mesmo hostname do browser (localhost ou IP da rede local)
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:3333`;
  }
  return 'http://127.0.0.1:3333';
};

const API_URL = getApiUrl();

// ============================================================================
// 1. LISTAR (READ) - Busca os registros direto do SQLite via método GET
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// ============================================================================
export async function buscarDados(tabela) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}`);
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.warn(`[Aviso SQLite] Servidor em ${API_URL} indisponível para listar ${tabela}.`);
  }
  return [];
}

// ============================================================================
// 2. CRIAR (CREATE) - Insere um novo registro no SQLite via método POST
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'item': objeto com os dados preenchidos
// ============================================================================
export async function criarRegistro(tabela, item) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.error(`[Erro SQLite] Falha ao conectar em ${API_URL}/${tabela} para criar registro.`);
  }
  return null;
}

// ============================================================================
// 3. EDITAR (UPDATE) - Atualiza registro existente no SQLite via método PUT
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'id': ID do registro
// Parâmetro 'item': dados atualizados
// ============================================================================
export async function atualizarRegistro(tabela, id, item) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });

    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.error(`[Erro SQLite] Falha ao conectar em ${API_URL}/${tabela}/${id} para atualizar registro.`);
  }
  return null;
}

// ============================================================================
// 4. APAGAR (DELETE) - Remove um registro do SQLite via método DELETE
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'id': ID do registro a ser apagado
// ============================================================================
export async function apagarRegistro(tabela, id) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}/${id}`, {
      method: 'DELETE',
    });
    return resposta.ok;
  } catch (erro) {
    console.error(`[Erro SQLite] Falha ao conectar em ${API_URL}/${tabela}/${id} para apagar registro.`);
    return false;
  }
}

// Aliases mantidos para compatibilidade total
export const buscarDadosSupabase = buscarDados;
export const criarNoSupabase = criarRegistro;
export const atualizarNoSupabase = atualizarRegistro;
export const apagarNoSupabase = apagarRegistro;
