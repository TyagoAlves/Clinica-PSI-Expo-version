import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

export default function TelaPacientes({
  pacientes = [], //lista de pacientes (array de objetos)
  aoNovo, //ao clicar no botão "Novo Paciente" troca para a telaNovoPaciente
  aoVoltar,  //ao clicar no botão "Sair" troca para a anterior
  verPaciente,  //ao clicar no botão "Ver Pacientes" troca para a tela verPaciente
}) {
  return (
    <>
    {/* agrupa elementos sem criar um nó extra no DOM.*/} 
    {/*Define um ScrollView para permitir rolagem da tela, com estilo definido em styles.tela*/}
    <ScrollView contentContainerStyle={styles.tela}>
      {/*<View style={styles.container} O componente View chama o estilo .container que esta no final da pagina*/}
      <View style={styles.container}>
        {/*<Text style={styles.titulo} O componente Text chama o estilo .titulo que esta no final da pagina*/}
        <Text style={styles.titulo}>Pacientes</Text>
        {/*<Text style={styles.subtitulo} O componente Text chama o estilo .subtitulo que esta no final da pagina*/}
        <Text style={styles.subtitulo}>Cadastro e acompanhamento</Text>
        {/*
        <Pressable style={styles.botaoPrimario} onPress={aoNovo}> O componente Pressable chama o estilo .botaoPrimario que esta no final da pagina
        <Text style={styles.textoBotaoPrimario}>+ Novo Paciente</Text> O componente Text chama o estilo .textoBotaoPrimario que esta no final da pagina
        </Pressable> Fechamento do Pressable
        */}
        <Pressable style={styles.botaoPrimario} onPress={aoNovo}>
          <Text style={styles.textoBotaoPrimario}>+ Novo Paciente</Text>
        </Pressable>
        {/*
        pacientes.length === 0 pergunta: "a lista está vazia?"
        Se sim → mostra um cartão com a mensagem "Nenhum paciente cadastrado."
        Se não → itera a lista com .map() e renderiza um cartão por paciente.
        <View style={styles.cartao} O componente View chama o estilo .cartao que esta no final da pagina
        <Text style={styles.textoVazio} O componente Text chama o estilo .textoVazio que esta no final da pagina
        Ele pega cada item de uma lista e devolve uma replicação em um componente JSX
        key = "o React usa isso pra saber qual cartão é qual entre uma renderização e outra"
        */}
        {pacientes.length === 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.textoVazio}>Nenhum paciente cadastrado.</Text>
          </View>
        ) : (
          pacientes.map((paciente) => (
            <View key={paciente.id} style={styles.cartao}>

              {/*<Text style={styles.nomePaciente} O componente Text chama o estilo .nomePaciente que esta no final da pagina retornando o nome do paciente pelo atributo "paciente.nome" ao lado*/}
              <Text style={styles.nomePaciente}>{paciente.nome}</Text>
              {/*<Text style={styles.detalhe} O componente Text chama o estilo .detalhe que esta no final da pagina retornando o nome do paciente pelo atributo "paciente.servico" ao lado*/}
              <Text style={styles.detalhe}>Serviço: {paciente.servico}</Text>
              {/*<Text style={styles.detalhe} O componente Text chama o estilo .detalhe que esta no final da pagina retornando o nome do paciente pelo atributo "paciente.inicio" ao lado*/}
              <Text style={styles.detalhe}>Início: {paciente.inicio}</Text>
              {/*
              <Pressable style={styles.botaoSecundario} onPress={verPaciente(paciente)}> O componente Pressable chama o estilo .botaoSecundario que esta no final da pagina chamando conteudo do paciente da lista
              <Text style={styles.textoBotaoSecundario}>Ver Paciente</Text> O componente Text chama o estilo .textoBotaoSecundario que esta no final da pagina 
              </Pressable> Fechamento do Pressable
              */}
              <Pressable
                style={styles.botaoSecundario}
                onPress={() => verPaciente(paciente)}
              >
                <Text style={styles.textoBotaoSecundario}>Ver Paciente</Text>
              </Pressable>
              {/*Fechamento da View cartao*/}
            </View>
          ))
        )}
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}> O componente Pressable chama o estilo .botaoVoltar que esta no final da pagina chamando conteudo da tela anterior da lista
        <Text style={styles.textoBotaoVoltar}>Voltar ao Painel</Text> O componente Text chama o estilo .textoBotaoVoltar que esta no final da pagina
        </Pressable> Fechamento do Pressable
        */}
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar ao Painel</Text>
        </Pressable>
        {/*Fechamento da View container*/}
      </View>
      {/*Fechamento da ScrollView tela*/}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flexGrow: 1, //o conteúdo cresce pra preencher
    backgroundColor: '#f8f1f1', //Cor de fundo da tela, cor rosa pálido
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal), 
    padding: 20,  //espaçamento interno
  },
  container: {
    width: '100%',  //é 100% da largura do container pai.
    maxWidth: 420,  //Largura maxima
  },
  titulo: {
    fontSize: 26,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //ardósia noturna
  },
  subtitulo: {
    fontSize: 15,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
    marginBottom: 16,  //espaçamento entre o texto e o item abaixo
  },
  cartao: {
    backgroundColor: '#FFFFFF',  //Cor de fundo branca
    padding: 16,  //espaçamento interno
    borderRadius: 12,  //Arredondamento de borda
    borderWidth: 1,  //Espessura da borda
    borderColor: '#DCE1EB',  //azul claro acinzentado
    marginBottom: 12,  //espaçamento entre o texto e o item abaixo
  },
  nomePaciente: {
    fontSize: 18,  //Tamanho do texto do nome de paciente
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //ardósia noturna
    marginBottom: 4,  //espaçamento entre o texto e o item abaixo
  },
  detalhe: {
    fontSize: 14,  //Tamanho do texto dos detalhes
    color: '#475569',  //East Bay
    marginBottom: 4,  //espaçamento entre o texto e o item abaixo
  },
  textoVazio: {
    fontSize: 15,  //Tamanho do texto vazio
    color: '#64748B',  //azul ardósia
    textAlign: 'center',  //Alinhamento do texto
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5', //Cor de fundo do botão "+ Novo Paciente"
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginBottom: 16, //espaçamento entre o botão e o item abaixo
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor do texto do botões, cor branca
    fontSize: 15,  //Tamanho do texto do botão "+ Novo Paciente" e "Abrir Agenda"
    fontWeight: 'bold',  //Negrito
  },
  botaoSecundario: {
    backgroundColor: '#E0E7FF',  //Azul muito claro
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginTop: 8,
  },
  textoBotaoSecundario: {
    color: '#4F46E5',  //Cor do texto do botão "Ver Paciente", cor Majorelle Blue
    fontSize: 15,  //Tamanho do texto do botão 
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',  //azul acinzentado claro
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginTop: 8,  //espaçamento entre o botão e o item acima
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Voltar"
    fontWeight: 'bold',  //Negrito
  },
});
