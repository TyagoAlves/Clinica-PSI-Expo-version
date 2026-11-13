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
import {
  buscarDadosSupabase,
  criarNoSupabase,
  atualizarNoSupabase,
  apagarNoSupabase,
} from './src/banco/bancoDados';

export default function App() {
  const [telaAtual, setTelaAtual] = useState('TelaLogin');

  // Estados alimentados exclusivamente pelo banco Supabase
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

  const [secoes, setSecoes] = useState([]);
  const [secaoSelecionada, setSecaoSelecionada] = useState(null);

  // Carrega os pacientes e seções direto do Supabase ao iniciar o app
  useEffect(() => {
    async function carregarDoSupabase() {
      const listaPacientes = await buscarDadosSupabase('pacientes');
      setPacientes(listaPacientes);

      const listaSecoes = await buscarDadosSupabase('secoes');
      setSecoes(listaSecoes);
    }
    carregarDoSupabase();
  }, []);

  // --- Funções do Banco Supabase: Pacientes (Criar, Editar, Apagar) ---
  async function adicionarPaciente(novoPaciente) {
    const criadoNoSupabase = await criarNoSupabase('pacientes', novoPaciente);
    if (criadoNoSupabase) {
      setPacientes([...pacientes, criadoNoSupabase]);
      setTelaAtual('TelaPacientes');
    }
  }

  async function salvarEdicaoPaciente(pacienteEditado) {
    const atualizadoNoSupabase = await atualizarNoSupabase(
      'pacientes',
      pacienteEditado.id,
      pacienteEditado
    );
    if (atualizadoNoSupabase) {
      const novaLista = pacientes.map((p) =>
        p.id === atualizadoNoSupabase.id ? atualizadoNoSupabase : p
      );
      setPacientes(novaLista);
      setPacienteSelecionado(atualizadoNoSupabase);
      setTelaAtual('TelaPaciente');
    }
  }

  async function apagarPaciente(id) {
    const apagou = await apagarNoSupabase('pacientes', id);
    if (apagou) {
      setPacientes(pacientes.filter((p) => p.id !== id));
      setPacienteSelecionado(null);
      setTelaAtual('TelaPacientes');
    }
  }

  // --- Funções do Banco Supabase: Seções da Agenda (Criar, Editar, Apagar) ---
  async function adicionarSecao(novaSecao) {
    const criadaNoSupabase = await criarNoSupabase('secoes', novaSecao);
    if (criadaNoSupabase) {
      setSecoes([...secoes, criadaNoSupabase]);
      setTelaAtual('TelaAgenda');
    }
  }

  async function salvarEdicaoSecao(secaoEditada) {
    const atualizadaNoSupabase = await atualizarNoSupabase(
      'secoes',
      secaoEditada.id,
      secaoEditada
    );
    if (atualizadaNoSupabase) {
      const novaLista = secoes.map((s) =>
        s.id === atualizadaNoSupabase.id ? atualizadaNoSupabase : s
      );
      setSecoes(novaLista);
      setSecaoSelecionada(atualizadaNoSupabase);
      setTelaAtual('TelaAgenda');
    }
  }

  async function apagarSecao(id) {
    const apagou = await apagarNoSupabase('secoes', id);
    if (apagou) {
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
