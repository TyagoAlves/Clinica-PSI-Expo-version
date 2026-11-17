import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
//nao entendi ainda
export default function TelaNovoPaciente({ aoSalvar, aoVoltar }) {
  const [nome, setNome] = useState('');
  const [servico, setServico] = useState('');
  const [inicio, setInicio] = useState('');
  const [descricao, setDescricao] = useState('');

  function salvar() {
    if (!nome.trim()) return;
    aoSalvar({
      nome: nome.trim(),
      servico: servico.trim() || 'Psicoterapia',
      inicio: inicio.trim() || '12/11/2026',
      descricao: descricao.trim() || 'Sem observações iniciais',
    });
  }

  return (
    <>
    {/*Define um ScrollView para permitir rolagem da tela, com estilo definido em styles.tela*/}
    <ScrollView contentContainerStyle={styles.tela}>
      {/*<View style={styles.cartao} O componente View chama o estilo .cartao que esta no final da pagina*/}
      <View style={styles.cartao}>
        {/*<Text style={styles.titulo} O componente Text chama o estilo .titulo que esta no final da pagina*/}
        <Text style={styles.titulo}>Novo Paciente</Text>
        {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
        <Text style={styles.rotulo}>Nome completo</Text>
        {/*
          <TextInput  Campo de digitação
          style={styles.input}  O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="Como o paciente deve aparecer no sistema"  O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          value={nome}  valor atual do campo (estado)
          onChangeText={setNome}  a cada tecla, o novo texto atualiza o estado
        />
        */}
        <TextInput
          style={styles.input}
          placeholder="Como o paciente deve aparecer no sistema"
          value={nome}
          onChangeText={setNome}
        />
        {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
        <Text style={styles.rotulo}>Serviço</Text>
        {/*
          <TextInput  Campo de digitação
          style={styles.input}  O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="Psicoterapia / Avaliação"  O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          value={servico}  valor atual do campo (estado)
          onChangeText={setServico}  a cada tecla, o novo texto atualiza o estado
        />
        */}
        <TextInput
          style={styles.input}
          placeholder="Psicoterapia / Avaliação"
          value={servico}
          onChangeText={setServico}
        />
        {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
        <Text style={styles.rotulo}>Início do tratamento</Text>
        {/*
          <TextInput  Campo de digitação
          style={styles.input}  O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="00/00/0000"  O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          value={inicio}  valor atual do campo (estado)
          onChangeText={setInicio}  a cada tecla, o novo texto atualiza o estado
        />
        */}
        <TextInput
          style={styles.input}
          placeholder="00/00/0000"
          value={inicio}
          onChangeText={setInicio}
        />
        {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
        <Text style={styles.rotulo}>Descrição / queixa principal</Text>
        {/*
          <TextInput  Campo de digitação
          style={styles.input}  O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="O que trouxe o paciente até o atendimento?"  O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          value={descricao}  valor atual do campo (estado)
          onChangeText={setDescricao}  a cada tecla, o novo texto atualiza o estado
        />
        */}
        <TextInput
          style={styles.input}
          placeholder="O que trouxe o paciente até o atendimento?"
          value={descricao}
          onChangeText={setDescricao}
        />
        {/*
        <Pressable style={styles.botaoPrimario} onPress={salvar}>   O componente Pressable chama o estilo .botaoPrimario que esta no final da pagina ao pressionar chama a função salvar
        <Text style={styles.textoBotaoPrimario}>Salvar Paciente</Text>  O componente Text chama o estilo .textoBotaoPrimario que esta no final da pagina
        </Pressable>
        */}
        <Pressable style={styles.botaoPrimario} onPress={salvar}>
          <Text style={styles.textoBotaoPrimario}>Salvar Paciente</Text>
        </Pressable>
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}> O componente Pressable chama o estilo .botaoVoltar que esta no final da pagina chamando conteudo da tela anterior da lista
        <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text> O componente Text chama o estilo .textoBotaoVoltar que esta no final da pagina
        </Pressable> Fechamento do Pressable
        */}
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text>
        </Pressable>
      </View>
      {/*Fechamento da ScrollView tela*/}
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flexGrow: 1,  //o conteúdo cresce pra preencher
    backgroundColor: '#f8f1f1', //Cor de fundo da tela, cor rosa pálido
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal), 
    justifyContent: 'center',  //Alinhamento eixo principal
    padding: 20,  //espaçamento interno
  },
  cartao: {
    width: '100%',  //é 100% da largura do container pai.
    maxWidth: 420,  //Largura maxima
    backgroundColor: '#FFFFFF',  //Cor de fundo branca
    padding: 22,  //espaçamento interno
    borderRadius: 12,  //Arredondamento de borda
    borderWidth: 1,  //Espessura da borda
    borderColor: '#DCE1EB',  //azul claro acinzentado
  },
   titulo: {
    fontSize: 22,  //Tamanho do texto
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //ardósia noturna
    marginBottom: 16,  //Espaçamento entre o texto e o item abaixo
  },
  rotulo: {
    fontSize: 14,  //Tamanho do texto
    fontWeight: 'bold',  //Negrito
    color: '#334155',  //Carvão azulado
    marginBottom: 6,  //Espaçamento entre o texto e o item abaixo
  },
  input: {
    backgroundColor: '#F8FAFC',  //Cor de fundo do campo de digitação cinza azulado claro
    borderWidth: 1,  //Espessura da borda
    borderColor: '#CBD5E1',  //Link Water
    borderRadius: 8,  //Arredondamento de borda
    padding: 10,  //espaçamento interno
    fontSize: 15,  //Tamanho do texto
    marginBottom: 14,  //Espaçamento entre o campo e o item abaixo
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',  //Azul Majorelle
    padding: 12,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal), 
    marginTop: 6,  //Espaçamento entre o botão e o item acima
    marginBottom: 10,  //Espaçamento entre o botão e o item abaixo
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor do texto do botão , cor branca
    fontSize: 15,  //Tamanho do texto
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',  //azul acinzentado claro
    padding: 12,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto
    fontWeight: 'bold',  //Negrito
  },
});
