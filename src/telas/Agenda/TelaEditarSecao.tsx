//import React from 'react'; importa o React automaticamente no React Native, então não é necessário importar explicitamente
//import { useState } from 'react'; importa o hook useState do React para gerenciar o estado dos campos do formulário
import { useState } from 'react';

{/*import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native'; importa os componentes necessários do React Native para construir a interface da tela de edição de seção*/}

import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';

export default function TelaEditarSecao({  // Define o componente funcional TelaEditarSecao que recebe as props
  secao,    // A seção que será editada
  aoSalvar,   // Função que será chamada ao salvar as alterações
  aoApagar,   // Função que será chamada ao apagar a seção 
  aoVoltar,   // Função que será chamada ao voltar para a tela anterior
}) {
  // Inicializa os campos com os dados da seção selecionada
  const [paciente, setPaciente] = useState(secao ? secao.paciente : ''); // Inicializa o estado do campo paciente com o valor da seção selecionada ou uma string vazia
  const [servico, setServico] = useState(secao ? secao.servico : ''); // Inicializa o estado do campo serviço com o valor da seção selecionada ou uma string vazia
  const [data, setData] = useState(secao ? secao.data : ''); // Inicializa o estado do campo data com o valor da seção selecionada ou uma string vazia
  const [horario, setHorario] = useState(secao ? secao.horario : ''); // Inicializa o estado do campo horário com o valor da seção selecionada ou uma string vazia
  const [duracao, setDuracao] = useState(secao ? secao.duracao : ''); // Inicializa o estado do campo duração com o valor da seção selecionada ou uma string vazia 
  const [observacoes, setObservacoes] = useState(  // Inicializa o estado do campo observações com o valor da seção selecionada ou uma string vazia
    secao ? (secao.observacoes || '') : ''  // Se a seção existir, verifica se o campo observações está definido, caso contrário, inicializa com uma string vazia
);
  function salvarAlteracoes() { // Define a função salvarAlteracoes que será chamada ao salvar as alterações  
    if (!secao || !paciente.trim()) return; // Verifica se a seção não está definida ou se o campo paciente está vazio, caso afirmativo retorna sem fazer nada
    aoSalvar({ // Chama a função aoSalvar passando um objeto com os dados atualizados da seção
      ...secao, // Copia os dados da seção original
      paciente: paciente.trim(), // Atualiza o campo paciente com o valor do estado paciente, removendo espaços em branco
      servico: servico.trim(), // Atualiza o campo serviço com o valor do estado serviço, removendo espaços em branco
      data: data.trim(), // Atualiza o campo data com o valor do estado data, removendo espaços em branco
      horario: horario.trim(), // Atualiza o campo horário com o valor do estado horário, removendo espaços em branco
      duracao: duracao.trim(), // Atualiza o campo duração com o valor do estado duração, removendo espaços em branco
      observacoes: observacoes.trim(), // Atualiza o campo observações com o valor do estado observações, removendo espaços em branco
    });
  } 

  return (  // Retorna a tela de edição da seção
    <>
    {/*Define um ScrollView para permitir rolagem da tela, com estilo definido em styles.tela*/}
    <ScrollView contentContainerStyle={styles.tela}>  
      {/*Define a View do cartão com estilo definido em styles.cartao*/}
      <View style={styles.cartao}>
        {/*Define a View do título com estilo definido em styles.titulo*/}
        <Text style={styles.titulo}>Editar Seção</Text>
        {/*Define a View do rótulo para o paciente com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Paciente</Text>
        <TextInput // Define o campo de input para o paciente
          style={styles.input} // Aplica o estilo definido em styles.input
          placeholder="Paciente que será agendado" // Define o placeholder do campo paciente
          value={paciente} // Define o valor do campo paciente com o estado paciente
          onChangeText={setPaciente} // Atualiza o estado paciente ao digitar no campo
        />
        {/*Define a View do rótulo para o serviço com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Serviço</Text>
        <TextInput // Define o campo de input para o serviço
          style={styles.input} // Aplica o estilo definido em styles.input  
          placeholder="Psicoterapia / Avaliação" // Define o placeholder do campo serviço
          value={servico} // Define o valor do campo serviço com o estado serviço
          onChangeText={setServico} // Atualiza o estado serviço ao digitar no campo
        />
        {/*Define a View do rótulo para a data com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Data</Text>
        <TextInput // Define o campo de input para a data 
          style={styles.input} // Aplica o estilo definido em styles.input
          placeholder="00/00/0000" // Define o placeholder do campo data
          value={data} // Define o valor do campo data com o estado data
          onChangeText={setData} // Atualiza o estado data ao digitar no campo
        />
        {/*Define a View do rótulo para o horário com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Horário</Text>
        <TextInput // Define o campo de input para o horário
          style={styles.input} // Aplica o estilo definido em styles.input
          placeholder="00:00" // Define o placeholder do campo horário
          value={horario} // Define o valor do campo horário com o estado horário
          onChangeText={setHorario} // Atualiza o estado horário ao digitar no campo
        />
        {/*Define a View do rótulo para a duração com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Duração</Text>
        <TextInput // Define o campo de input para a duração
          style={styles.input} // Aplica o estilo definido em styles.input
          placeholder="00:00" // Define o placeholder do campo duração
          value={duracao} // Define o valor do campo duração com o estado duração
          onChangeText={setDuracao} // Atualiza o estado duração ao digitar no campo
        />
        {/*Define a View do rótulo para as observações com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Observações</Text>
        <TextInput // Define o campo de input para as observações
          style={styles.input} // Aplica o estilo definido em styles.input
          placeholder="Observações sobre a seção" // Define o placeholder do campo observações
          value={observacoes} // Define o valor do campo observações com o estado observações
          onChangeText={setObservacoes} // Atualiza o estado observações ao digitar no campo
        />
        {/*
        <Pressable style={styles.botaoPrimario} onPress={salvarAlteracoes}>  //Define o botão "Salvar Alterações" com estilo definido em styles.botaoPrimario e chama a função salvarAlteracoes ao ser pressionado
          <Text style={styles.textoBotaoPrimario}>Salvar Alterações</Text>  //Define o texto do botão "Salvar Alterações" com estilo definido em styles.textoBotaoPrimario
        </Pressable>
        */}
        <Pressable style={styles.botaoPrimario} onPress={salvarAlteracoes}>
          <Text style={styles.textoBotaoPrimario}>Salvar Alterações</Text>
        </Pressable>
        {/*
        <Pressable
          style={styles.botaoPerigo}  //Define o botão "Apagar Seção" com estilo definido em styles.botaoPerigo
          onPress={() => secao && aoApagar(secao.id)}  //Chama a função aoApagar passando o id da seção ao ser pressionado
        >
          <Text style={styles.textoBotaoPerigo}>Apagar Seção</Text>  //Define o texto do botão "Apagar Seção" com estilo definido em styles.textoBotaoPerigo
        </Pressable>
        */}
        <Pressable
          style={styles.botaoPerigo}
          onPress={() => secao && aoApagar(secao.id)}
        >
          <Text style={styles.textoBotaoPerigo}>Apagar Seção</Text>
        </Pressable>
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>  //Define o botão "Voltar" com estilo definido em styles.botaoVoltar e chama a função aoVoltar ao ser pressionado
          <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text>  //Define o texto do botão "Voltar" com estilo definido em styles.textoBotaoVoltar
        </Pressable>
        */}
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text>
        </Pressable>
        {/*Fechamento do componente cartão*/}
      </View>
      {/*Fechamento do componente tela*/}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flexGrow: 1,  //o conteúdo cresce pra preencher
    backgroundColor: '#F1F3F8',  //Cor de fundo da tela, cor branca meio azulada
    alignItems: 'center',  //Alinhamento eixo cruzado
    justifyContent: 'center',  //Alinhamento eixo principal
    padding: 20,  //Espaçamento interno da tela
  },
  cartao: {
    width: '100%',  //Largura do cartão, ocupa toda a largura da tela
    maxWidth: 420,  //Largura máxima do cartão, não ultrapassa 420 pixels
    backgroundColor: '#FFFFFF',  //Cor de fundo do cartão, cor branca
    padding: 22,  //Espaçamento interno do cartão, 22 pixels
    borderRadius: 12,  //Arredondamento dos cantos do cartão, 12 pixels
    borderWidth: 1,  //Espessura da borda do cartão, 1 pixel
    borderColor: '#DCE1EB',  //Cor da borda do cartão, azul acinzentado claro
  },
  titulo: {
    fontSize: 22,  //Tamanho do texto do título, 22 pixels
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //Cor do texto do título, ardósia noturna
    marginBottom: 16,  //Espaçamento inferior do título, 16 pixels
  },
  rotulo: {
    fontSize: 14,  //Tamanho do texto do rótulo, 14 pixels
    fontWeight: 'bold',  //Negrito
    color: '#334155',  //Cor do texto do rótulo, ardósia escura
    marginBottom: 6,  //Espaçamento inferior do rótulo, 6 pixels
  },
  input: {
    backgroundColor: '#F8FAFC',  //Cor de fundo do input, azul acinzentado muito claro
    borderWidth: 1,  //Espessura da borda do input, 1 pixel
    borderColor: '#CBD5E1',  //Cor da borda do input, azul acinzentado claro
    borderRadius: 8,  //Arredondamento dos cantos do input, 8 pixels
    padding: 10,  //Espaçamento interno do input, 10 pixels
    fontSize: 15,  //Tamanho do texto do input, 15 pixels
    marginBottom: 12,  //Espaçamento inferior do input, 12 pixels
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',  //Cor de fundo do botão "Salvar Seção", Azul Majorelle
    padding: 12,  //Espaçamento interno do botão "Salvar Seção", 12 pixels
    borderRadius: 8,  //Arredondamento dos cantos do botão "Salvar Seção", 8 pixels
    alignItems: 'center',  //Alinhamento do conteúdo do botão "Salvar Seção" no eixo cruzado, centralizado
    marginTop: 6,  //Espaçamento superior do botão "Salvar Seção", 6 pixels
    marginBottom: 10,  //Espaçamento inferior do botão "Salvar Seção", 10 pixels
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor de fundo branca
    fontSize: 15,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
  },
  botaoPerigo: {
    backgroundColor: '#FEE2E2',  //Cor do botão "Apagar Seção", vermelho claro
    padding: 12,  //Espaçamento interno do botão "Apagar Seção", 12 pixels
    borderRadius: 8,  //Arredondamento dos cantos do botão "Apagar Seção", 8 pixels
    alignItems: 'center',  //Alinhamento do conteúdo do botão "Apagar Seção" no eixo cruzado, centralizado
    marginBottom: 10,  //Espaçamento inferior do botão "Apagar Seção", 10 pixels
  },
  textoBotaoPerigo: {
    color: '#DC2626',  //Cor do texto do botão "Apagar Seção", vermelho escuro
    fontSize: 15,  //Tamanho do texto do botão "Apagar Seção", 15 pixels
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
   backgroundColor: '#E2E8F0',  //Cor de fundo do botão "Cancelar / Voltar", azul acinzentado claro
    padding: 12,  //Espaçamento interno do botão "Cancelar / Voltar", 12 pixels
    borderRadius: 8,  //Arredondamento dos cantos do botão "Cancelar / Voltar", 8 pixels
    alignItems: 'center',  //Alinhamento do conteúdo do botão "Cancelar / Voltar" no eixo cruzado, centralizado
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Voltar", 15 pixels
    fontWeight: 'bold',  //Negrito
  },
});
