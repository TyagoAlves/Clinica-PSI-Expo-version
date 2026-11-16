import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import TelaLogin from './src/telas/TelaLogin';
import TelaHome from './src/telas/TelaHome';
import TelaAgenda from './src/telas/Agenda/TelaAgenda';
import TelaNovoPaciente from './src/telas/Paciente/TelaNovoPaciente';
import TelaPacientes from './src/telas/Paciente/TelaPacientes';
import TelaPaciente from './src/telas/Paciente/TelaPaciente';
import TelaEditarPaciente from './src/telas/Paciente/TelaEditarPaciente';
import TelaNovaSecao from './src/telas/Agenda/TelaNovaSecao';
import TelaEditarSecao from './src/telas/Agenda/TelaEditarSecao';
import TelaVerSecao from './src/telas/Agenda/TelaVerSecao';
// Importa as 4 funções de comunicação HTTP (CRUD) que conversam com o servidor do Supabase
import {
  buscarDadosSupabase,
  criarNoSupabase,
  atualizarNoSupabase,
  apagarNoSupabase,
} from './src/banco/bancoDados';

export default function App() {
  // Estado que controla qual tela está visível no momento (começa na TelaLogin)
  const [telaAtual, setTelaAtual] = useState('TelaLogin');

  // ==========================================================================
  // ESTADOS DO BANCO DE DADOS NA MEMÓRIA DO REACT
  // Começam vazios ([]) porque todos os dados vêm exclusivamente do Supabase!
  // ==========================================================================
  const [pacientes, setPacientes] = useState([]); // Lista de pacientes carregada do Supabase
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null); // Paciente clicado para ver ou editar

  const [secoes, setSecoes] = useState([]); // Lista de sessões da agenda carregada do Supabase
  const [secaoSelecionada, setSecaoSelecionada] = useState(null); // Sessão clicada para ver ou editar

  // ==========================================================================
  // 1. LEITURA INICIAL (READ) - Carrega os dados do Supabase assim que o App abre
  // O array vazio [] no final garante que o useEffect rode apenas 1 vez ao iniciar
  // ==========================================================================
  useEffect(() => {
    async function carregarDoSupabase() {
      // Faz GET /pacientes no servidor, aguarda (await) a lista do Supabase e salva no estado 'pacientes'
      const listaPacientes = await buscarDadosSupabase('pacientes');
      setPacientes(listaPacientes);

      // Faz GET /secoes no servidor, aguarda (await) a lista do Supabase e salva no estado 'secoes'
      const listaSecoes = await buscarDadosSupabase('secoes');
      setSecoes(listaSecoes);
    }
    carregarDoSupabase();
  }, []);

  // ==========================================================================
  // 2. FUNÇÕES CRUD DE PACIENTES (CRIAR, EDITAR E APAGAR NO SUPABASE)
  // ==========================================================================

  // CRIAR PACIENTE (POST /pacientes)
  async function adicionarPaciente(novoPaciente) {
    // Envia os dados preenchidos para o Supabase e aguarda o registro criado (já com o ID gerado pelo banco)
    const criadoNoSupabase = await criarNoSupabase('pacientes', novoPaciente);
    if (criadoNoSupabase) {
      // Atualiza a lista na tela copiando os pacientes atuais (...pacientes) e adicionando o novo no final
      setPacientes([...pacientes, criadoNoSupabase]);
      // Exibe um alerta simples confirmando o cadastro
      alert('Paciente registrado com sucesso!');
      // Navega automaticamente de volta para a lista de pacientes
      setTelaAtual('TelaPacientes');
    }
  }

  // EDITAR PACIENTE (PUT /pacientes/:id)
  async function salvarEdicaoPaciente(pacienteEditado) {
    // Envia o ID e os novos dados para o Supabase atualizar a linha correspondente
    const atualizadoNoSupabase = await atualizarNoSupabase(
      'pacientes',
      pacienteEditado.id,
      pacienteEditado
    );
    if (atualizadoNoSupabase) {
      // Percorre a lista com .map(): onde o ID for igual ao editado, substitui pelo novo vindo do Supabase
      const novaLista = pacientes.map((p) =>
        p.id === atualizadoNoSupabase.id ? atualizadoNoSupabase : p
      );
      setPacientes(novaLista);
      // Atualiza também a ficha do paciente selecionado e volta para a tela de detalhes dele
      setPacienteSelecionado(atualizadoNoSupabase);
      setTelaAtual('TelaPaciente');
    }
  }

  // APAGAR PACIENTE (DELETE /pacientes/:id)
  async function apagarPaciente(id) {
    // Pede ao servidor para executar DELETE FROM pacientes WHERE id = $1 lá no Supabase
    const apagou = await apagarNoSupabase('pacientes', id);
    if (apagou) {
      // Usa .filter() para manter na tela apenas os pacientes cujo ID seja diferente (!==) do que foi apagado
      setPacientes(pacientes.filter((p) => p.id !== id));
      setPacienteSelecionado(null);
      setTelaAtual('TelaPacientes');
    }
  }

  // ==========================================================================
  // 3. FUNÇÕES CRUD DE SEÇÕES DA AGENDA (CRIAR, EDITAR E APAGAR NO SUPABASE)
  // ==========================================================================

  // CRIAR SEÇÃO (POST /secoes)
  async function adicionarSecao(novaSecao) {
    // Envia a nova sessão para a tabela 'secoes' do Supabase
    const criadaNoSupabase = await criarNoSupabase('secoes', novaSecao);
    if (criadaNoSupabase) {
      // Adiciona a sessão recém-criada (com seu novo ID) ao final da lista da agenda
      setSecoes([...secoes, criadaNoSupabase]);
      setTelaAtual('TelaAgenda');
    }
  }

  // EDITAR SEÇÃO (PUT /secoes/:id)
  async function salvarEdicaoSecao(secaoEditada) {
    // Atualiza os dados da sessão no Supabase pelo ID
    const atualizadaNoSupabase = await atualizarNoSupabase(
      'secoes',
      secaoEditada.id,
      secaoEditada
    );
    if (atualizadaNoSupabase) {
      // Substitui a sessão antiga pela versão atualizada na lista usando .map()
      const novaLista = secoes.map((s) =>
        s.id === atualizadaNoSupabase.id ? atualizadaNoSupabase : s
      );
      setSecoes(novaLista);
      setSecaoSelecionada(atualizadaNoSupabase);
      setTelaAtual('TelaAgenda');
    }
  }

  // APAGAR SEÇÃO (DELETE /secoes/:id)
  async function apagarSecao(id) {
    // Remove a sessão da tabela 'secoes' no Supabase pelo ID
    const apagou = await apagarNoSupabase('secoes', id);
    if (apagou) {
      // Filtra a lista mantendo apenas as sessões que não foram apagadas
      setSecoes(secoes.filter((s) => s.id !== id));
      setSecaoSelecionada(null);
      setTelaAtual('TelaAgenda');
    }
  }

  /* ## O ternário encadeado, linha por linha
   * Pense nele como uma cascata de perguntas: "é isso? senão, é aquilo? senão, é o resto."
   * condição ? valorSeVerdadeiro : valorSeFalso
   */
  return (
    <>
      <StatusBar style="auto" />
      {telaAtual === 'TelaLogin' ? (
        <TelaLogin aoEntrar={() => setTelaAtual('TelaHome')} />
      ) : telaAtual === 'TelaNovoPaciente' ? (
        <TelaNovoPaciente
          aoSalvar={adicionarPaciente}
          aoVoltar={() => setTelaAtual('TelaPacientes')}
        />
      ) : telaAtual === 'TelaPacientes' ? (
        <TelaPacientes
          pacientes={pacientes}
          aoVoltar={() => setTelaAtual('TelaHome')}
          aoNovo={() => setTelaAtual('TelaNovoPaciente')}
          verPaciente={(paciente) => {
            setPacienteSelecionado(paciente);
            setTelaAtual('TelaPaciente');
          }}
        />
      ) : telaAtual === 'TelaPaciente' ? (
        <TelaPaciente
          paciente={pacienteSelecionado}
          aoVoltar={() => setTelaAtual('TelaPacientes')}
          aoEditar={() => setTelaAtual('TelaEditarPaciente')}
        />
      ) : telaAtual === 'TelaEditarPaciente' ? (
        <TelaEditarPaciente
          paciente={pacienteSelecionado}
          aoSalvar={salvarEdicaoPaciente}
          aoApagar={apagarPaciente}
          aoVoltar={() => setTelaAtual('TelaPaciente')}
        />
      ) : telaAtual === 'TelaNovaSecao' ? (
        <TelaNovaSecao
          aoSalvar={adicionarSecao}
          aoVoltar={() => setTelaAtual('TelaAgenda')}
        />
      ) : telaAtual === 'TelaVerSecao' ? (
        <TelaVerSecao
          secao={secaoSelecionada}
          aoVoltar={() => setTelaAtual('TelaAgenda')}
          aoEditar={() => setTelaAtual('TelaEditarSecao')}
        />
      ) : telaAtual === 'TelaEditarSecao' ? (
        <TelaEditarSecao
          secao={secaoSelecionada}
          aoSalvar={salvarEdicaoSecao}
          aoApagar={apagarSecao}
          aoVoltar={() => setTelaAtual('TelaAgenda')}
        />
      ) : telaAtual === 'TelaAgenda' ? (
        <TelaAgenda
          secoes={secoes}
          aoVoltar={() => setTelaAtual('TelaHome')}
          novaSecao={() => setTelaAtual('TelaNovaSecao')}
          verSecao={(secao) => {
            setSecaoSelecionada(secao);
            setTelaAtual('TelaVerSecao');
          }}
          editarSecao={(secao) => {
            setSecaoSelecionada(secao);
            setTelaAtual('TelaEditarSecao');
          }}
        />
      ) : (
        <TelaHome
          totalPacientes={pacientes.length}
          totalSecoes={secoes.length}
          aoSair={() => setTelaAtual('TelaLogin')}
          aoNovo={() => setTelaAtual('TelaNovoPaciente')}
          aoAgenda={() => setTelaAtual('TelaAgenda')}
          verPacientes={() => setTelaAtual('TelaPacientes')}
        />
      )}
    </>
  );
}
