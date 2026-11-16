// ============================================================================
// ARQUIVO: src/banco/bancoDados.js
// FUNÇÃO: Cliente HTTP do Front-end (Mensageiro).
//         Contém as 4 funções do CRUD que o App.js chama para conversar com o
//         servidor Node.js (src/banco/servidor.js), que por sua vez grava no Supabase.
// ============================================================================

// Endereço fixo onde o servidor Node.js (servidor.js) está escutando localmente
const API_URL = 'http://127.0.0.1:3333';

// ============================================================================
// 1. LISTAR (READ) - Busca os registros direto do Supabase via método GET
// Parâmetro 'tabela': pode ser 'pacientes' ou 'secoes'
// ============================================================================
export async function buscarDadosSupabase(tabela) {
  try {
    // Faz uma requisição HTTP GET para http://127.0.0.1:3333/pacientes (ou /secoes)
    const resposta = await fetch(`${API_URL}/${tabela}`);

    // Verifica se o servidor respondeu com sucesso (status HTTP entre 200 e 299)
    if (resposta.ok) {
      // Converte o texto JSON recebido do servidor em uma lista (Array) do JavaScript e retorna
      return await resposta.json();
    }
  } catch (erro) {
    // Caso o servidor esteja desligado ou ocorra falha de rede, exibe o erro no console
    console.error(`Erro ao buscar dados de ${tabela} no Supabase:`, erro);
  }
  // Se algo der errado, retorna uma lista vazia [] para a tela não travar
  return [];
}

// ============================================================================
// 2. CRIAR (CREATE) - Insere um novo registro no Supabase via método POST
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'item': objeto com os dados preenchidos no formulário (ex.: { nome, servico... })
// ============================================================================
export async function criarNoSupabase(tabela, item) {
  try {
    // Envia uma requisição HTTP POST para http://127.0.0.1:3333/pacientes (ou /secoes)
    const resposta = await fetch(`${API_URL}/${tabela}`, {
      method: 'POST', // Define que estamos CRIANDO um novo registro
      headers: { 'Content-Type': 'application/json' }, // Avisa ao servidor que o corpo está em formato JSON
      body: JSON.stringify(item), // Transforma o objeto JavaScript em texto JSON para viajar pela rede
    });

    // Se o servidor salvou no Supabase (status 201 Created), devolve o registro criado (já com o 'id' do banco)
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.error(`Erro ao criar registro em ${tabela} no Supabase:`, erro);
  }
  // Se falhar, retorna null para o App.js saber que não foi possível salvar
  return null;
}

// ============================================================================
// 3. EDITAR (UPDATE) - Atualiza um registro existente no Supabase pelo ID via método PUT
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'id': número identificador do registro no banco (ex.: 4)
// Parâmetro 'item': objeto com os novos dados editados pelo usuário
// ============================================================================
export async function atualizarNoSupabase(tabela, id, item) {
  try {
    // Envia uma requisição HTTP PUT para http://127.0.0.1:3333/pacientes/4 (ou /secoes/3)
    const resposta = await fetch(`${API_URL}/${tabela}/${id}`, {
      method: 'PUT', // Define que estamos ATUALIZANDO um registro existente
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item), // Envia os dados atualizados em formato texto JSON
    });

    // Se o Supabase atualizou com sucesso (status 200 OK), retorna o objeto atualizado
    if (resposta.ok) {
      return await resposta.json();
    }
  } catch (erro) {
    console.error(`Erro ao atualizar registro em ${tabela} no Supabase:`, erro);
  }
  return null;
}

// ============================================================================
// 4. APAGAR (DELETE) - Remove um registro do Supabase pelo ID via método DELETE
// Parâmetro 'tabela': 'pacientes' ou 'secoes'
// Parâmetro 'id': número identificador do registro que será excluído no banco
// ============================================================================
export async function apagarNoSupabase(tabela, id) {
  try {
    // Envia uma requisição HTTP DELETE para http://127.0.0.1:3333/pacientes/4 (ou /secoes/3)
    const resposta = await fetch(`${API_URL}/${tabela}/${id}`, {
      method: 'DELETE', // Define que estamos APAGANDO o registro daquele ID
    });

    // Retorna true se o banco apagou com sucesso (status 200) ou false se houve erro
    return resposta.ok;
  } catch (erro) {
    console.error(`Erro ao apagar registro em ${tabela} no Supabase:`, erro);
    return false;
  }
}
