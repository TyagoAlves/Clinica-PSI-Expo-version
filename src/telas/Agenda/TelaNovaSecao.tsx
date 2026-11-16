//import React from 'react'; importa o React automaticamente no React Native, então não é necessário importar explicitamente
//import { useState } from 'react'; importa o hook useState do React para gerenciar o estado dos campos do formulário
import { useState } from 'react';
{/*import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native'; importa os componentes necessários do React Native para construir a interface da tela de edição de seção*/}
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';

export default function TelaNovaSecao({ aoSalvar, aoVoltar }) {  //Função que representa a tela de criação de uma nova seção, recebe as funções aoSalvar e aoVoltar como props
  const [paciente, setPaciente] = useState('');  //Declaração do estado paciente e da função setPaciente para atualizar o estado, inicializado como uma string vazia
  const [servico, setServico] = useState('');  //Declaração do estado servico e da função setServico para atualizar o estado, inicializado como uma string vazia
  const [data, setData] = useState('');  //Declaração do estado data e da função setData para atualizar o estado, inicializado como uma string vazia
  const [horario, setHorario] = useState('');  //Declaração do estado horario e da função setHorario para atualizar o estado, inicializado como uma string vazia
  const [duracao, setDuracao] = useState('');  //Declaração do estado duracao e da função setDuracao para atualizar o estado, inicializado como uma string vazia
  const [observacoes, setObservacoes] = useState('');  //Declaração do estado observacoes e da função setObservacoes para atualizar o estado, inicializado como uma string vazia

  function salvar() {  //Função que será chamada ao pressionar o botão "Salvar Seção"
    if (!paciente.trim()) return;  //Se o campo paciente estiver vazio, não faz nada
    aoSalvar({  //Chama a função aoSalvar passando um objeto com os dados da nova seção
      paciente: paciente.trim(),  //Atribui o valor do estado paciente, removendo espaços em branco no início e no fim
      servico: servico.trim() || 'Psicoterapia',  //Atribui o valor do estado servico, removendo espaços em branco no início e no fim, ou 'Psicoterapia' se estiver vazio
      data: data.trim() || new Date().toLocaleDateString('pt-BR'),  //Atribui o valor do estado data, removendo espaços em branco no início e no fim, ou a data atual formatada como 'dd/mm/aaaa' se estiver vazio
      horario: horario.trim() || '14:00',  //Atribui o valor do estado horario, removendo espaços em branco no início e no fim, ou '14:00' se estiver vazio
      duracao: duracao.trim() || '00:50',  //Atribui o valor do estado duracao, removendo espaços em branco no início e no fim, ou '00:50' se estiver vazio
      observacoes: observacoes.trim(),  //Atribui o valor do estado observacoes, removendo espaços em branco no início e no fim
    });
  } 
  return (
    <>
    {/*Define um ScrollView para permitir rolagem da tela, com estilo definido em styles.tela*/}
    <ScrollView contentContainerStyle={styles.tela}>  
      {/*Define a View do cartão com estilo definido em styles.cartao*/}
      <View style={styles.cartao}>
        {/*Define o Text do título com estilo definido em styles.titulo*/}
        <Text style={styles.titulo}>Nova Seção</Text>
        {/*Define o Text do rótulo para o paciente com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Paciente</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo paciente
          style={styles.input}  //Estilo definido em styles.input
          placeholder="Paciente que será agendado"  //Texto de placeholder exibido quando o campo está vazio
          value={paciente}  //Valor do campo, vinculado ao estado paciente
          onChangeText={setPaciente}  //Função chamada quando o texto do campo muda, atualizando o estado paciente
        />
        {/*Define o Text do rótulo para o serviço com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Serviço</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo serviço
          style={styles.input}  //Estilo definido em styles.input
          placeholder="Psicoterapia / Avaliação"  //Texto de placeholder exibido quando o campo está vazio
          value={servico}  //Valor do campo, vinculado ao estado servico
          onChangeText={setServico}  //Função chamada quando o texto do campo muda, atualizando o estado servico
        />
        {/*Define o Text do rótulo para a data com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Data</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo data
          style={styles.input}  //Estilo definido em styles.input
          placeholder="00/00/0000"  //Texto de placeholder exibido quando o campo está vazio
          value={data}  //Valor do campo, vinculado ao estado data
          onChangeText={setData}  //Função chamada quando o texto do campo muda, atualizando o estado data
        />
        {/*Define o Text do rótulo para o horário com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Horário</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo horário
          style={styles.input}  //Estilo definido em styles.input
          placeholder="00:00"  //Texto de placeholder exibido quando o campo está vazio
          value={horario}  //Valor do campo, vinculado ao estado horario
          onChangeText={setHorario}  //Função chamada quando o texto do campo muda, atualizando o estado horario
        />
        {/*Define o Text do rótulo para a duração com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Duração</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo duração
          style={styles.input}  //Estilo definido em styles.input
          placeholder="00:00"  //Texto de placeholder exibido quando o campo está vazio
          value={duracao}  //Valor do campo, vinculado ao estado duracao
          onChangeText={setDuracao}  //Função chamada quando o texto do campo muda, atualizando o estado duracao
        />
        {/*Define o Text do rótulo para as observações com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Observações</Text>
        <TextInput  //Componente TextInput que permite a entrada de texto para o campo observações
          style={styles.input}  //Estilo definido em styles.input
          placeholder="Ex: Primeira consulta, trazer exames"  //Texto de placeholder exibido quando o campo está vazio
          value={observacoes}  //Valor do campo, vinculado ao estado observacoes
          onChangeText={setObservacoes}  //Função chamada quando o texto do campo muda, atualizando o estado observacoes
        />
        {/*
        <Pressable style={styles.botaoPrimario} onPress={salvar}>  //Define o botão "Salvar Seção" com estilo definido em styles.botaoPrimario
          <Text style={styles.textoBotaoPrimario}>Salvar Seção</Text>  //Chama a função salvar ao ser pressionado
        </Pressable>
        */}
        <Pressable style={styles.botaoPrimario} onPress={salvar}>
          <Text style={styles.textoBotaoPrimario}>Salvar Seção</Text>
        </Pressable>
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>  //Define o botão "Cancelar / Voltar com estilo definido em styles.botaoVoltar e chama a função aoVoltar ao ser pressionado
          <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text>  //Define o texto do botão "Cancelar / Voltar" com estilo definido em styles.textoBotaoVoltar
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
    color: '#FFFFFF',  //Cor do texto do botão "Salvar Seção", branco
    fontSize: 15,  //Tamanho do texto do botão "Salvar Seção", 15 pixels
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',  //Cor de fundo do botão "Cancelar / Voltar", azul acinzentado claro
    padding: 12,  //Espaçamento interno do botão "Cancelar / Voltar", 12 pixels
    borderRadius: 8,  //Arredondamento dos cantos do botão "Cancelar / Voltar", 8 pixels
    alignItems: 'center',  //Alinhamento do conteúdo do botão "Cancelar / Voltar" no eixo cruzado, centralizado
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Cancelar / Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Cancelar / Voltar", 15 pixels
    fontWeight: 'bold',  //Negrito
  },
});
