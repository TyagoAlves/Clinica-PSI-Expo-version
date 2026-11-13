// Cliente de comunicação exclusiva com o Banco de Dados Supabase (via servidor.js)

const API_URL = 'http://127.0.0.1:3333';

// 1. LISTAR (READ) - Busca os registros direto do Supabase (GET)
export async function buscarDadosSupabase(tabela) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}`);
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.error(`Erro ao buscar dados de ${tabela} no Supabase:`, erro);
  }
  return [];
}

// 2. CRIAR (CREATE) - Insere um novo registro no Supabase (POST)
export async function criarNoSupabase(tabela, item) {
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
    console.error(`Erro ao criar registro em ${tabela} no Supabase:`, erro);
  }
  return null;
}

// 3. EDITAR (UPDATE) - Atualiza um registro existente no Supabase pelo ID (PUT)
export async function atualizarNoSupabase(tabela, id, item) {
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
    console.error(`Erro ao atualizar registro em ${tabela} no Supabase:`, erro);
  }
  return null;
}

// 4. APAGAR (DELETE) - Remove um registro do Supabase pelo ID (DELETE)
export async function apagarNoSupabase(tabela, id) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}/${id}`, {
      method: 'DELETE',
    });
    return resposta.ok;
  } catch (erro) {
    console.error(`Erro ao apagar registro em ${tabela} no Supabase:`, erro);
    return false;
  }
}
