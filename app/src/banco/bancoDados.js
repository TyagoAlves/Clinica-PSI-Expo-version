// ============================================================================
// ARQUIVO: src/banco/bancoDados.js
// FUNÇÃO: Cliente HTTP do Front-end (Mensageiro).
//         Contém as 4 funções do CRUD que o App.js chama para conversar com o
//         servidor Node.js local (src/banco/servidor.js), persistindo em SQLite.
// ============================================================================

// Resolve dinamicamente a URL da API:
// Se estiver no navegador, usa o mesmo hostname do browser (localhost ou IP da rede local)
// No celular (React Native), usa o IP fixo da rede local
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:3333`;
  }
  return 'http://192.168.0.121:3333';
};

const API_URL = getApiUrl();

// ============================================================================
// LOGIN: o token recebido do servidor fica guardado aqui (na memória do app)
// e vai junto em toda requisição no cabeçalho "Authorization: Bearer <token>"
// ============================================================================
let tokenSessao = null;

function cabecalhos(extra = {}) {
  return tokenSessao ? { ...extra, Authorization: `Bearer ${tokenSessao}` } : extra;
}

// ENTRAR (POST /login) - devolve { token } se deu certo, ou { erro } com a mensagem
export async function fazerLogin(email, senha) {
  try {
    const resposta = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: cabecalhos({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, senha }),
    });
    const dados = await resposta.json();
    if (resposta.ok) {
      tokenSessao = dados.token;
      return dados;
    }
    return { erro: dados.erro || 'Não foi possível entrar.' };
  } catch (erro) {
    return { erro: `O servidor SQLite (porta 3333) não respondeu.\nAbra um terminal e rode: npm run servidor` };
  }
}

// SAIR (POST /logout) - avisa o servidor para invalidar o token e esquece ele aqui no app
export async function fazerLogout() {
  try {
    await fetch(`${API_URL}/logout`, { method: 'POST', headers: cabecalhos() });
  } catch (erro) {
    // Mesmo sem servidor, o app esquece o token e volta para o login
  }
  tokenSessao = null;
}

// ============================================================================
// VERIFICAÇÃO DE SAÚDE DA API (HEALTH CHECK)
// ============================================================================
export async function verificarServidor() {
  try {
    const resposta = await fetch(`${API_URL}/health`);
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch {
    return null;
  }
  return null;
}

// ============================================================================
// 1. LISTAR (READ) - Busca os registros direto do SQLite via método GET
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// ============================================================================
export async function buscarDados(tabela) {
  try {
    const resposta = await fetch(`${API_URL}/${tabela}`, { headers: cabecalhos() });
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
      headers: cabecalhos({ 'Content-Type': 'application/json' }),
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
      headers: cabecalhos({ 'Content-Type': 'application/json' }),
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
      headers: cabecalhos(),
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