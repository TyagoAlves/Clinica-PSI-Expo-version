// ponto de partida do app, foi registrado como raiz em index.js.
// a função desse código é decidir qual tela mostrar ao usuário (sem login aceito pelo servidor, só aparece a TelaLogin),
// e guardar na memória os dados que vêm do banco SQLite (pacientes e seções) pra entregar pras telas.

// Quem faz o quê aqui dentro:
//   telas (src/telas)            -> parte do Tyago: só mostram os dados e avisam quando o usuário clica
//   banco (src/banco)            -> parte do Yago: bancoDados.js manda o pedido pro servidor.js, que grava no SQLite
//   App.tsx (este arquivo)       -> liga as duas coisas: escolhe a tela e chama o banco
import { useState, useEffect } from 'react'; // useState guarda um valor que muda a tela, useEffect roda algo quando o app abre
import { StatusBar } from 'expo-status-bar'; // a barra de cima do celular (relógio, bateria)
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
  fazerLogin, // confere e-mail e senha no servidor (POST /login) e guarda o token
  fazerLogout, // invalida o token no servidor (POST /logout)
} from './src/banco/bancoDados';

//"export default" faz esta função ser a "principal" do arquivo, a que o "index,js" importa.
export default function App() {
  // Estado que controla qual tela está visível no momento (começa na TelaLogin)
  const [telaAtual, setTelaAtual] = useState('TelaLogin');
  // true só depois que o servidor aceitou o e-mail e a senha. enquanto for false, só a TelaLogin aparece.
  const [logado, setLogado] = useState(false);

  // ==========================================================================
  // ESTADOS DO BANCO DE DADOS NA MEMÓRIA DO REACT
  // Começam vazios ([]) porque todos os dados vêm exclusivamente do SQLite!
  // ==========================================================================
  const [pacientes, setPacientes] = useState([]); // Lista de pacientes carregada do SQLite
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null); // Paciente clicado para ver ou editar

  const [secoes, setSecoes] = useState([]); // Lista de sessões da agenda carregada do SQLite
  const [secaoSelecionada, setSecaoSelecionada] = useState(null); // Sessão clicada para ver ou editar

  // ==========================================================================
  // 1. LEITURA INICIAL (READ) - Carrega os dados do SQLite assim que o login é aceito
  // O [logado] no final faz o useEffect rodar de novo sempre que 'logado' mudar
  // (antes do login o servidor recusa os dados, então só carrega quando logado for true)
  // ==========================================================================
  useEffect(() => {
    if (!logado) return;
    async function carregarDoBanco() {
      // Faz GET /pacientes no servidor, aguarda (await) a lista do SQLite e salva no estado 'pacientes'
      const listaPacientes = await buscarDados('pacientes');
      setPacientes(listaPacientes);

      // Faz GET /secoes no servidor, aguarda (await) a lista do SQLite e salva no estado 'secoes'
      const listaSecoes = await buscarDados('secoes');
      setSecoes(listaSecoes);
    }
    carregarDoBanco();
  }, [logado]);

  // ==========================================================================
  // LOGIN E LOGOUT
  // ==========================================================================

  // ENTRAR: a TelaLogin manda o que foi digitado, o servidor confere e devolve um token ou um erro
  async function entrarNoApp(email, senha) {
    const resultado = await fazerLogin(email, senha);
    if (resultado.token) {
      setLogado(true);
      setTelaAtual('TelaHome');
    } else {
      alert(`Aviso: ${resultado.erro}`);
    }
  }

  // SAIR: invalida o token no servidor, limpa os dados da memória e volta pro login
  async function sairDoApp() {
    await fazerLogout();
    setLogado(false);
    setPacientes([]);
    setSecoes([]);
    setPacienteSelecionado(null);
    setSecaoSelecionada(null);
    setTelaAtual('TelaLogin');
  }

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
    } else {
      alert(
        'Aviso: Não foi possível salvar o paciente!\n\nO servidor SQLite (porta 3333) não respondeu.\nAbra um terminal e rode: npm run servidor'
      );
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
    } else {
      alert('Aviso: Falha ao salvar alterações. O servidor SQLite (porta 3333) está desligado.');
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
    } else {
      alert('Aviso: Falha ao apagar paciente. O servidor SQLite (porta 3333) está desligado.');
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
    } else {
      alert('Aviso: Falha ao agendar seção. O servidor SQLite (porta 3333) está desligado.');
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
    } else {
      alert('Aviso: Falha ao atualizar seção. O servidor SQLite (porta 3333) está desligado.');
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
    } else {
      alert('Aviso: Falha ao apagar seção. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  /* ## O ternário encadeado, linha por linha
   * Pense nele como uma cascata de perguntas: "é isso? senão, é aquilo? senão, é o resto."
   * condição ? valorSeVerdadeiro : valorSeFalso
   */
  //cada pergunta compara o nome guardado em telaAtual e devolve a tela certa.
  //se nenhuma condição for atendida, cai no último item e joga de volta pro painel (TelaHome), que funciona como tela padrão.
  return (
    <>
      <StatusBar style="auto" />
      {!logado || telaAtual === 'TelaLogin' ? (
        <TelaLogin aoEntrar={entrarNoApp} />
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
          aoSair={sairDoApp}
          aoNovo={() => setTelaAtual('TelaNovoPaciente')}
          aoAgenda={() => setTelaAtual('TelaAgenda')}
          verPacientes={() => setTelaAtual('TelaPacientes')}
        />
      )}
    </>
  );
}
//-----------------------------------------------------------------------------------------
// Como o código acima se comunica com o resto do projeto?
// quando o usuario clicka em "Ver Pacientes" no painel (TelaHome), a tela chama "verPacientes",
// que faz setTelaAtual('TelaPacientes'). o React percebe a mudança, roda o App de novo e devolve a TelaPacientes.
// quando o usuário salva um paciente, a tela chama "aoSalvar" -> adicionarPaciente -> criarRegistro (bancoDados.js)
// -> POST /pacientes no servidor.js -> INSERT no SQLite. o registro volta com o id e entra na lista da tela.
//-----------------------------------------------------------------------------------------
// dps daqui, dá uma olhada em "src/banco/bancoDados.js"
