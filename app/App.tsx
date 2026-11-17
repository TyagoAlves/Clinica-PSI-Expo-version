// ponto de partida do app, foi registrado como raiz em index.js.
// a função desse código é decidir qual tela mostrar ao usuário (sem login aceito pelo servidor, só aparece a TelaLogin),
// e guardar na memória os dados que vêm do banco SQLite (pacientes e seções) pra entregar pras telas.

// Quem faz o quê aqui dentro:
//   telas (src/telas)            -> parte do Tyago: só mostram os dados e avisam quando o usuário clica
//   banco (src/banco)            -> parte do Yago: bancoDados.js manda o pedido pro servidor.js, que grava no SQLite
//   App.tsx (este arquivo)       -> liga as duas coisas: escolhe a tela e chama o banco
import { useState, useEffect } from 'react'; // useState guarda um valor que muda a tela, useEffect roda algo quando o app abre
import { StatusBar } from 'expo-status-bar'; // a barra de cima do celular (relógio, bateria)
// cada import abaixo traz uma tela da pasta src/telas. o App não desenha nada sozinho, ele só escolhe qual dessas mostrar.
import TelaLogin from './src/telas/TelaLogin'; // tela de e-mail e senha, a primeira que aparece
import TelaHome from './src/telas/TelaHome'; // painel inicial depois do login (totais e botões pra navegar)
import TelaAgenda from './src/telas/Agenda/TelaAgenda'; // lista das seções agendadas
import TelaNovoPaciente from './src/telas/Paciente/TelaNovoPaciente'; // formulário pra cadastrar paciente
import TelaPacientes from './src/telas/Paciente/TelaPacientes'; // lista de todos os pacientes
import TelaPaciente from './src/telas/Paciente/TelaPaciente'; // ficha de um paciente só (o que foi clicado)
import TelaEditarPaciente from './src/telas/Paciente/TelaEditarPaciente'; // formulário pra editar ou apagar paciente
import TelaNovaSecao from './src/telas/Agenda/TelaNovaSecao'; // formulário pra agendar uma seção
import TelaEditarSecao from './src/telas/Agenda/TelaEditarSecao'; // formulário pra editar ou apagar uma seção
import TelaVerSecao from './src/telas/Agenda/TelaVerSecao'; // detalhes de uma seção só
// Importa as 4 funções de comunicação HTTP (CRUD) que conversam com o servidor local SQLite
import {
  buscarDados, // lê uma tabela inteira (GET) -> usada pra carregar pacientes e seções
  criarRegistro, // cria um registro novo (POST)
  atualizarRegistro, // salva uma edição (PUT)
  apagarRegistro, // apaga um registro (DELETE)
  fazerLogin, // confere e-mail e senha no servidor (POST /login) e guarda o token
  fazerLogout, // invalida o token no servidor (POST /logout)
} from './src/banco/bancoDados'; // todas vêm do "mensageiro" bancoDados.js, o App nunca fala direto com o banco

//"export default" faz esta função ser a "principal" do arquivo, a que o "index,js" importa.
export default function App() {
  // Estado que controla qual tela está visível no momento (começa na TelaLogin)
  // telaAtual é o nome da tela, setTelaAtual('Nome') é como a gente troca de tela. é essa a "navegação" do app.
  const [telaAtual, setTelaAtual] = useState('TelaLogin');
  // true só depois que o servidor aceitou o e-mail e a senha. enquanto for false, só a TelaLogin aparece.
  const [logado, setLogado] = useState(false);

  // ==========================================================================
  // ESTADOS DO BANCO DE DADOS NA MEMÓRIA DO REACT
  // Começam vazios ([]) porque todos os dados vêm exclusivamente do SQLite!
  // ==========================================================================
  const [pacientes, setPacientes] = useState([]); // Lista de pacientes carregada do SQLite
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null); // Paciente clicado para ver ou editar
  // null = nenhum paciente escolhido ainda. quando o usuário clica em um, ele fica guardado aqui pra TelaPaciente saber qual mostrar.

  const [secoes, setSecoes] = useState([]); // Lista de sessões da agenda carregada do SQLite
  const [secaoSelecionada, setSecaoSelecionada] = useState(null); // Sessão clicada para ver ou editar
  // mesma ideia do pacienteSelecionado, só que pra agenda.

  // ==========================================================================
  // 1. LEITURA INICIAL (READ) - Carrega os dados do SQLite assim que o login é aceito
  // O [logado] no final faz o useEffect rodar de novo sempre que 'logado' mudar
  // (antes do login o servidor recusa os dados, então só carrega quando logado for true)
  // ==========================================================================
  useEffect(() => {
    if (!logado) return; // se ainda não logou, para aqui e não pede nada pro servidor
    async function carregarDoBanco() { // "async" = função que pode esperar (await) a resposta do servidor sem travar o app
      // Faz GET /pacientes no servidor, aguarda (await) a lista do SQLite e salva no estado 'pacientes'
      const listaPacientes = await buscarDados('pacientes');
      setPacientes(listaPacientes); // guardar no estado faz o React redesenhar a tela com a lista nova

      // Faz GET /secoes no servidor, aguarda (await) a lista do SQLite e salva no estado 'secoes'
      const listaSecoes = await buscarDados('secoes');
      setSecoes(listaSecoes);
    }
    carregarDoBanco(); // a função foi só criada ali em cima, aqui ela é chamada de verdade
  }, [logado]);

  // ==========================================================================
  // LOGIN E LOGOUT
  // ==========================================================================

  // ENTRAR: a TelaLogin manda o que foi digitado, o servidor confere e devolve um token ou um erro
  async function entrarNoApp(email, senha) { // quem chama é a TelaLogin, pela prop "aoEntrar"
    const resultado = await fazerLogin(email, senha); // vai no bancoDados.js -> POST /login no servidor.js
    if (resultado.token) { // veio token = e-mail e senha certos
      setLogado(true); // libera o app. isso também dispara o useEffect lá de cima, que carrega os dados
      setTelaAtual('TelaHome'); // e já manda pro painel
    } else { // não veio token = senha errada ou servidor desligado
      alert(`Aviso: ${resultado.erro}`); // mostra a mensagem que o servidor (ou o bancoDados.js) devolveu
    }
  }

  // SAIR: invalida o token no servidor, limpa os dados da memória e volta pro login
  async function sairDoApp() { // quem chama é a TelaHome, pela prop "aoSair"
    await fazerLogout(); // avisa o servidor pra apagar a sessão desse token
    setLogado(false); // trava o app de novo
    setPacientes([]); // apaga da memória os dados que estavam na tela
    setSecoes([]); // (assim o próximo que usar o app não vê nada do anterior)
    setPacienteSelecionado(null);
    setSecaoSelecionada(null);
    setTelaAtual('TelaLogin'); // volta pra tela de login
  }

  // ==========================================================================
  // 2. FUNÇÕES CRUD DE PACIENTES (CRIAR, EDITAR E APAGAR NO SQLITE)
  // ==========================================================================

  // CRIAR PACIENTE (POST /pacientes)
  async function adicionarPaciente(novoPaciente) { // quem chama é a TelaNovoPaciente, pela prop "aoSalvar"
    // Envia os dados preenchidos para o SQLite e aguarda o registro criado (já com o ID gerado pelo banco)
    const criadoNoBanco = await criarRegistro('pacientes', novoPaciente);
    if (criadoNoBanco) { // se voltou alguma coisa, o banco salvou. se voltou null, o servidor não respondeu
      // Atualiza a lista na tela copiando os pacientes atuais (...pacientes) e adicionando o novo no final
      // (o React só redesenha se receber uma lista NOVA, por isso copia em vez de só empurrar o item)
      setPacientes([...pacientes, criadoNoBanco]);
      // Exibe um alerta simples confirmando o cadastro
      alert('Paciente registrado com sucesso!');
      // Navega automaticamente de volta para a lista de pacientes
      setTelaAtual('TelaPacientes');
    } else { // criadoNoBanco veio null: o servidor estava desligado ou deu erro
      alert(
        'Aviso: Não foi possível salvar o paciente!\n\nO servidor SQLite (porta 3333) não respondeu.\nAbra um terminal e rode: npm run servidor'
      ); // \n é quebra de linha dentro do alerta
    }
  }

  // EDITAR PACIENTE (PUT /pacientes/:id)
  async function salvarEdicaoPaciente(pacienteEditado) { // quem chama é a TelaEditarPaciente, pela prop "aoSalvar"
    // Envia o ID e os novos dados para o SQLite atualizar a linha correspondente
    const atualizadoNoBanco = await atualizarRegistro(
      'pacientes', // qual tabela
      pacienteEditado.id, // qual linha (o id diz qual paciente é)
      pacienteEditado // os dados novos
    );
    if (atualizadoNoBanco) { // o servidor devolve o paciente já atualizado
      // Percorre a lista com .map(): onde o ID for igual ao editado, substitui pelo novo vindo do SQLite
      // p é cada paciente da lista. "?" = se for o mesmo id, usa o novo. ":" = senão, mantém o antigo
      const novaLista = pacientes.map((p) =>
        p.id === atualizadoNoBanco.id ? atualizadoNoBanco : p
      );
      setPacientes(novaLista); // troca a lista inteira pela nova, e o React redesenha
      // Atualiza também a ficha do paciente selecionado e volta para a tela de detalhes dele
      setPacienteSelecionado(atualizadoNoBanco);
      setTelaAtual('TelaPaciente');
    } else { // veio null: servidor desligado ou deu erro
      alert('Aviso: Falha ao salvar alterações. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  // APAGAR PACIENTE (DELETE /pacientes/:id)
  async function apagarPaciente(id) { // quem chama é a TelaEditarPaciente, pela prop "aoApagar", e manda só o id
    // Pede ao servidor para executar DELETE FROM pacientes WHERE id = ? lá no SQLite
    const apagou = await apagarRegistro('pacientes', id); // volta true se deu certo, false se não
    if (apagou) {
      // Usa .filter() para manter na tela apenas os pacientes cujo ID seja diferente (!==) do que foi apagado
      setPacientes(pacientes.filter((p) => p.id !== id));
      setPacienteSelecionado(null); // o paciente não existe mais, então não tem ninguém selecionado
      setTelaAtual('TelaPacientes'); // volta pra lista
    } else { // false: servidor desligado ou deu erro
      alert('Aviso: Falha ao apagar paciente. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  // ==========================================================================
  // 3. FUNÇÕES CRUD DE SEÇÕES DA AGENDA (CRIAR, EDITAR E APAGAR NO SQLITE)
  // funcionam igualzinho às de pacientes, só muda a tabela ('secoes') e as telas pra onde voltam
  // ==========================================================================

  // CRIAR SEÇÃO (POST /secoes)
  async function adicionarSecao(novaSecao) { // quem chama é a TelaNovaSecao, pela prop "aoSalvar"
    // Envia a nova sessão para a tabela 'secoes' do SQLite
    const criadaNoBanco = await criarRegistro('secoes', novaSecao);
    if (criadaNoBanco) { // voltou a seção com id = salvou
      // Adiciona a sessão recém-criada (com seu novo ID) ao final da lista da agenda
      setSecoes([...secoes, criadaNoBanco]);
      setTelaAtual('TelaAgenda'); // volta pra agenda, já com a seção nova aparecendo
    } else { // veio null: servidor desligado ou deu erro
      alert('Aviso: Falha ao agendar seção. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  // EDITAR SEÇÃO (PUT /secoes/:id)
  async function salvarEdicaoSecao(secaoEditada) { // quem chama é a TelaEditarSecao, pela prop "aoSalvar"
    // Atualiza os dados da sessão no SQLite pelo ID
    const atualizadaNoBanco = await atualizarRegistro(
      'secoes', // qual tabela
      secaoEditada.id, // qual linha
      secaoEditada // os dados novos
    );
    if (atualizadaNoBanco) {
      // Substitui a sessão antiga pela versão atualizada na lista usando .map()
      const novaLista = secoes.map((s) =>
        s.id === atualizadaNoBanco.id ? atualizadaNoBanco : s // mesmo id = troca pela nova, senão mantém
      );
      setSecoes(novaLista);
      setSecaoSelecionada(atualizadaNoBanco); // guarda a versão nova como a selecionada
      setTelaAtual('TelaAgenda'); // volta pra agenda
    } else { // veio null: servidor desligado ou deu erro
      alert('Aviso: Falha ao atualizar seção. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  // APAGAR SEÇÃO (DELETE /secoes/:id)
  async function apagarSecao(id) { // quem chama é a TelaEditarSecao, pela prop "aoApagar"
    // Remove a sessão da tabela 'secoes' no SQLite pelo ID
    const apagou = await apagarRegistro('secoes', id); // true = apagou, false = não conseguiu
    if (apagou) {
      // Filtra a lista mantendo apenas as sessões que não foram apagadas
      setSecoes(secoes.filter((s) => s.id !== id));
      setSecaoSelecionada(null); // a seção não existe mais
      setTelaAtual('TelaAgenda'); // volta pra agenda
    } else { // false: servidor desligado ou deu erro
      alert('Aviso: Falha ao apagar seção. O servidor SQLite (porta 3333) está desligado.');
    }
  }

  /* ## O ternário encadeado, linha por linha
   * Pense nele como uma cascata de perguntas: "é isso? senão, é aquilo? senão, é o resto."
   * condição ? valorSeVerdadeiro : valorSeFalso
   */
  //cada pergunta compara o nome guardado em telaAtual e devolve a tela certa.
  //se nenhuma condição for atendida, cai no último item e joga de volta pro painel (TelaHome), que funciona como tela padrão.
  // as coisas escritas dentro de cada tela (pacientes={...}, aoVoltar={...}) são as props: é assim que o App
  // entrega dados pra tela mostrar e funções pra tela chamar quando o usuário clicar em algo.
  return (
    <>
      {/* <> </> agrupa tudo sem criar uma caixa a mais na tela (o return só pode devolver um elemento) */}
      <StatusBar style="auto" />
      {/* "auto" deixa o relógio/bateria claros ou escuros conforme o fundo */}
      {/* 1ª pergunta: não está logado OU a tela é a de login? então só mostra a TelaLogin.
          o !logado vem primeiro de propósito: sem login, nenhuma outra tela aparece, seja qual for a telaAtual */}
      {!logado || telaAtual === 'TelaLogin' ? (
        <TelaLogin aoEntrar={entrarNoApp} />
        // aoEntrar: quando clicarem em "Entrar", a TelaLogin chama entrarNoApp(email, senha) aqui do App
      ) : telaAtual === 'TelaNovoPaciente' ? (
        <TelaNovoPaciente
          aoSalvar={adicionarPaciente} // botão salvar -> cria o paciente no banco
          aoVoltar={() => setTelaAtual('TelaPacientes')} // botão voltar -> só troca de tela, não salva nada
        />
      ) : telaAtual === 'TelaPacientes' ? (
        <TelaPacientes
          pacientes={pacientes} // entrega a lista que veio do SQLite pra tela desenhar
          aoVoltar={() => setTelaAtual('TelaHome')} // volta pro painel
          aoNovo={() => setTelaAtual('TelaNovoPaciente')} // abre o formulário de cadastro
          verPaciente={(paciente) => { // a tela manda qual paciente foi clicado
            setPacienteSelecionado(paciente); // 1º guarda qual foi
            setTelaAtual('TelaPaciente'); // 2º abre a ficha dele
          }}
        />
      ) : telaAtual === 'TelaPaciente' ? (
        <TelaPaciente
          paciente={pacienteSelecionado} // entrega o paciente que foi clicado na lista
          aoVoltar={() => setTelaAtual('TelaPacientes')} // volta pra lista
          aoEditar={() => setTelaAtual('TelaEditarPaciente')} // abre a edição (o paciente continua selecionado)
        />
      ) : telaAtual === 'TelaEditarPaciente' ? (
        <TelaEditarPaciente
          paciente={pacienteSelecionado} // preenche o formulário com os dados atuais
          aoSalvar={salvarEdicaoPaciente} // botão salvar -> PUT no banco
          aoApagar={apagarPaciente} // botão apagar -> DELETE no banco
          aoVoltar={() => setTelaAtual('TelaPaciente')} // volta pra ficha sem salvar
        />
      ) : telaAtual === 'TelaNovaSecao' ? (
        <TelaNovaSecao
          aoSalvar={adicionarSecao} // botão salvar -> cria a seção no banco
          aoVoltar={() => setTelaAtual('TelaAgenda')} // volta pra agenda
        />
      ) : telaAtual === 'TelaVerSecao' ? (
        <TelaVerSecao
          secao={secaoSelecionada} // entrega a seção que foi clicada na agenda
          aoVoltar={() => setTelaAtual('TelaAgenda')} // volta pra agenda
          aoEditar={() => setTelaAtual('TelaEditarSecao')} // abre a edição dessa seção
        />
      ) : telaAtual === 'TelaEditarSecao' ? (
        <TelaEditarSecao
          secao={secaoSelecionada} // preenche o formulário com os dados atuais
          aoSalvar={salvarEdicaoSecao} // botão salvar -> PUT no banco
          aoApagar={apagarSecao} // botão apagar -> DELETE no banco
          aoVoltar={() => setTelaAtual('TelaAgenda')} // volta sem salvar
        />
      ) : telaAtual === 'TelaAgenda' ? (
        <TelaAgenda
          secoes={secoes} // entrega a lista de seções que veio do SQLite
          aoVoltar={() => setTelaAtual('TelaHome')} // volta pro painel
          novaSecao={() => setTelaAtual('TelaNovaSecao')} // abre o formulário de agendamento
          verSecao={(secao) => { // a tela manda qual seção foi clicada
            setSecaoSelecionada(secao); // guarda qual foi
            setTelaAtual('TelaVerSecao'); // e abre os detalhes
          }}
          editarSecao={(secao) => { // atalho: da agenda direto pra edição
            setSecaoSelecionada(secao);
            setTelaAtual('TelaEditarSecao');
          }}
        />
      ) : (
        // nenhuma pergunta acima deu certo -> cai aqui, no painel (TelaHome), a tela padrão
        <TelaHome
          totalPacientes={pacientes.length} // .length = quantos itens tem na lista, vira o número do painel
          totalSecoes={secoes.length}
          aoSair={sairDoApp} // botão sair -> logout
          aoNovo={() => setTelaAtual('TelaNovoPaciente')} // atalho pra cadastrar paciente
          aoAgenda={() => setTelaAtual('TelaAgenda')} // abre a agenda
          verPacientes={() => setTelaAtual('TelaPacientes')} // abre a lista de pacientes
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
// no login é a mesma coisa: TelaLogin chama "aoEntrar" -> entrarNoApp -> fazerLogin (bancoDados.js) -> POST /login
// no servidor.js. se voltar o token, logado vira true, o useEffect carrega os dados e o painel aparece.
//-----------------------------------------------------------------------------------------
// dps daqui, dá uma olhada em "src/banco/bancoDados.js"
