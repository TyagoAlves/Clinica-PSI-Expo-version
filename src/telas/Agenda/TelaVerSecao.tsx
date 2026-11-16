//import React from 'react'; importa o React automaticamente no React Native, então não é necessário importar explicitamente
//import { useState } from 'react'; importa o hook useState do React para gerenciar o estado dos campos do formulário  ?? Ainda não implementado
//import { View, Text, Pressable, StyleSheet } from 'react-native'; importa os componentes necessários do React Native para construir a interface da tela de visualização de seção
import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function TelaVerSecao({ secao, aoVoltar, aoEditar }) {// Define o componente funcional TelaVerSecao que recebe as props secao, aoVoltar e aoEditar
  if (!secao) { // Verifica se a seção não está definida
    return ( // Retorna uma mensagem de erro e um botão de voltar
      <>
      {/*Define a View principal da tela com estilo definido em styles.tela*/}
      <View style={styles.tela}>
        {/*Exibe a mensagem de erro*/}
        <Text>Nenhuma seção selecionada.</Text>
        
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          {/*Exibe o texto do botão de voltar */}
          <Text style={styles.textoBotaoVoltar}>Voltar</Text> 
        {/*fecha o botão de voltar*/}
        </Pressable>  
        {}
      </View> 
    );   
      </>
    );
  }

  return (
    <>
    {/**/}
    <View style={styles.tela}>
      {/*Define a View do cartão com estilo definido em styles.cartao*/}
      <View style={styles.cartao}>
        {/*Define a View do título com estilo definido em styles.titulo*/}
        <Text style={styles.titulo}>Detalhes da Seção</Text>
        {/*Define a View do rótulo para o paciente com estilo definido em styles.rotulo*/}
        <Text style={styles.rotulo}>Paciente</Text>
        {/**/}
        {/**/}
        <Text style={styles.valor}>{secao.paciente}</Text>  
        {/**/}
        <Text style={styles.rotulo}>Serviço</Text>
        {/**/}
        {/**/}
        <Text style={styles.valor}>{secao.servico}</Text>
        {/**/}
        <Text style={styles.rotulo}>Data e Horário</Text>
        {/**/}
        {/**/}
        {/**/}
        {/**/}
        <Text style={styles.valor}>
          {secao.data} às {secao.horario} (Duração: {secao.duracao})
        </Text>
        {/**/}
        <Text style={styles.rotulo}>Observações</Text>
        {/**/}
        <Text style={styles.valor}>
          {secao.observacoes || 'Sem observações'}
        </Text>
        {/*
        <Pressable style={styles.botaoPrimario} onPress={aoEditar}>
          <Text style={styles.textoBotaoPrimario}>Editar Seção</Text>
        </Pressable>
        */}
        <Pressable style={styles.botaoPrimario} onPress={aoEditar}>
          <Text style={styles.textoBotaoPrimario}>Editar Seção</Text>
        </Pressable>
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar para Agenda</Text>
        </Pressable>
        */}
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar para Agenda</Text>
        </Pressable>
        {/*fecha a View cartão*/}
      </View>
      {/*/*fecha a View principal da tela*/*/}
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,  //o conteúdo cresce pra preencher
    backgroundColor: '#F1F3F8',  //Cor de fundo da tela, cor branca meio azulada
    alignItems: 'center',  //Alinhamento eixo cruzado
    justifyContent: 'center',  //Alinhamento eixo principal
    padding: 20,  //Espaçamento interno da tela
  },
  cartao: {
    width: '100%',    //Largura do cartão, ocupa toda a largura da tela
    maxWidth: 420,    //Largura máxima do cartão, não ultrapassa 420 pixels
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
    fontSize: 13,  //Tamanho do texto do rótulo, 13 pixels
    fontWeight: 'bold',  //Negrito
        color: '#334155',  //Cor do texto do rótulo, ardósia escura
    marginTop: 6,  //Espaçamento superior do rótulo, 6 pixels
  },
  valor: {
    fontSize: 16,  //Tamanho do texto do valor, 16 pixels
    color: '#1E293B',  //Cor do texto do valor, ardósia noturna
    marginBottom: 8,  //Espaçamento inferior do valor, 8 pixels
    backgroundColor: '#F8FAFC',  //Cor de fundo do valor, azul acinzentado muito claro
    padding: 10,  //Espaçamento interno do valor, 10 pixels
    borderRadius: 8,  //Arredondamento dos cantos do valor, 8 pixels
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',  //Cor de fundo do botão "Salvar Seção", Azul Majorelle
    padding: 12,  //Espaçamento interno do botão "Salvar Seção", 12 pixels
    borderRadius: 8,  //Arredondamento dos cantos do botão "Salvar Seção", 8 pixels
    alignItems: 'center',  //Alinhamento do conteúdo do botão "Salvar Seção" no eixo cruzado, centralizado
    marginTop: 14,  //Espaçamento superior do botão "Salvar Seção", 14 pixels
    marginBottom: 10,  //Espaçamento inferior do botão "Salvar Seção", 10 pixels
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor de fundo branca
    fontSize: 15,  //Tamanho do texto 
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
