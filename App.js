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
// Importa as 4 funções de comunicação HTTP (CRUD) que conversam com o servidor local SQLite
import {
  buscarDados,
  criarRegistro,
  atualizarRegistro,
  apagarRegistro,
} from './src/banco/bancoDados';

export default function App() {
  // Estado que controla qual tela está visível no momento (começa na TelaLogin)
  const [telaAtual, setTelaAtual] = useState('TelaLogin');

  // ==========================================================================
  // ESTADOS DO BANCO DE DADOS NA MEMÓRIA DO REACT
  // Começam vazios ([]) porque todos os dados vêm exclusivamente do SQLite!
  // ==========================================================================
  const [pacientes, setPacientes] = useState([]); // Lista de pacientes carregada do SQLite
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null); // Paciente clicado para ver ou editar

  const [secoes, setSecoes] = useState([]); // Lista de sessões da agenda carregada do SQLite
  const [secaoSelecionada, setSecaoSelecionada] = useState(null); // Sessão clicada para ver ou editar

  // ==========================================================================
  // 1. LEITURA INICIAL (READ) - Carrega os dados do SQLite assim que o App abre
  // O array vazio [] no final garante que o useEffect rode apenas 1 vez ao iniciar
  // ==========================================================================
  useEffect(() => {
    async function carregarDoBanco() {
      // Faz GET /pacientes no servidor, aguarda (await) a lista do SQLite e salva no estado 'pacientes'
      const listaPacientes = await buscarDados('pacientes');
      setPacientes(listaPacientes);

      // Faz GET /secoes no servidor, aguarda (await) a lista do SQLite e salva no estado 'secoes'
      const listaSecoes = await buscarDados('secoes');
      setSecoes(listaSecoes);
    }
    carregarDoBanco();
  }, []);

  // ==========================================================================
  // 2. FUNÇÕES CRUD DE PACIENTES (CRIAR, EDITAR E APAGAR NO SQLITE)
  // ==========================================================================

  // CRIAR PACIENTE (POST /pacientes)
  async function adicionarPaciente(novoPaciente) {
    // Envia os dados preenchidos para o SQLite e aguarda o registro criado (já com o ID gerado pelo banco)
    const criadoNoBanco = await criarRegistro('pacientes', novoPaciente);
    if (criadoNoBanco) {
      // Atualiza a lista na tela copiando os pacientes atuais (...pacientes) e adicionando o novo no final
      setPacientes([...pacientes, criadoNoBanco]);
      // Exibe um alerta simples confirmando o cadastro
      alert('Paciente registrado com sucesso!');
      // Navega automaticamente de volta para a lista de pacientes
      setTelaAtual('TelaPacientes');
    }
  }

  // EDITAR PACIENTE (PUT /pacientes/:id)
  async function salvarEdicaoPaciente(pacienteEditado) {
    // Envia o ID e os novos dados para o SQLite atualizar a linha correspondente
    const atualizadoNoBanco = await atualizarRegistro(
      'pacientes',
      pacienteEditado.id,
      pacienteEditado
    );
    if (atualizadoNoBanco) {
      // Percorre a lista com .map(): onde o ID for igual ao editado, substitui pelo novo vindo do SQLite
      const novaLista = pacientes.map((p) =>
        p.id === atualizadoNoBanco.id ? atualizadoNoBanco : p
      );
      setPacientes(novaLista);
      // Atualiza também a ficha do paciente selecionado e volta para a tela de detalhes dele
      setPacienteSelecionado(atualizadoNoBanco);
      setTelaAtual('TelaPaciente');
    }
  }

  // APAGAR PACIENTE (DELETE /pacientes/:id)
  async function apagarPaciente(id) {
    // Pede ao servidor para executar DELETE FROM pacientes WHERE id = ? lá no SQLite
    const apagou = await apagarRegistro('pacientes', id);
    if (apagou) {
      // Usa .filter() para manter na tela apenas os pacientes cujo ID seja diferente (!==) do que foi apagado
      setPacientes(pacientes.filter((p) => p.id !== id));
      setPacienteSelecionado(null);
      setTelaAtual('TelaPacientes');
    }
  }

  // ==========================================================================
  // 3. FUNÇÕES CRUD DE SEÇÕES DA AGENDA (CRIAR, EDITAR E APAGAR NO SQLITE)
  // ==========================================================================

  // CRIAR SEÇÃO (POST /secoes)
  async function adicionarSecao(novaSecao) {
    // Envia a nova sessão para a tabela 'secoes' do SQLite
    const criadaNoBanco = await criarRegistro('secoes', novaSecao);
    if (criadaNoBanco) {
      // Adiciona a sessão recém-criada (com seu novo ID) ao final da lista da agenda
      setSecoes([...secoes, criadaNoBanco]);
      setTelaAtual('TelaAgenda');
    }
  }

  // EDITAR SEÇÃO (PUT /secoes/:id)
  async function salvarEdicaoSecao(secaoEditada) {
    // Atualiza os dados da sessão no SQLite pelo ID
    const atualizadaNoBanco = await atualizarRegistro(
      'secoes',
      secaoEditada.id,
      secaoEditada
    );
    if (atualizadaNoBanco) {
      // Substitui a sessão antiga pela versão atualizada na lista usando .map()
      const novaLista = secoes.map((s) =>
        s.id === atualizadaNoBanco.id ? atualizadaNoBanco : s
      );
      setSecoes(novaLista);
      setSecaoSelecionada(atualizadaNoBanco);
      setTelaAtual('TelaAgenda');
    }
  }

  // APAGAR SEÇÃO (DELETE /secoes/:id)
  async function apagarSecao(id) {
    // Remove a sessão da tabela 'secoes' no SQLite pelo ID
    const apagou = await apagarRegistro('secoes', id);
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
