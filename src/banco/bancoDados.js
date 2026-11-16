// ============================================================================
// ARQUIVO: src/banco/bancoDados.js
// FUNÇÃO: Cliente HTTP do Front-end (Mensageiro).
//         Contém as 4 funções do CRUD que o App.js chama para conversar com o
//         servidor Node.js local (src/banco/servidor.js), persistindo em SQLite.
// ============================================================================

// Endereço do servidor local SQLite
const API_URL = 'http://127.0.0.1:3333';

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
    console.error(`Erro ao buscar dados de ${tabela} no SQLite:`, erro);
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
    console.error(`Erro ao criar registro em ${tabela} no SQLite:`, erro);
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
    console.error(`Erro ao atualizar registro em ${tabela} no SQLite:`, erro);
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
    console.error(`Erro ao apagar registro em ${tabela} no SQLite:`, erro);
    return false;
  }
}

// Aliases mantidos para compatibilidade total com os imports existentes
export const buscarDadosSupabase = buscarDados;
export const criarNoSupabase = criarRegistro;
export const atualizarNoSupabase = atualizarRegistro;
export const apagarNoSupabase = apagarRegistro;
