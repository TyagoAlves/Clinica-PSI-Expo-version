import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function TelaPaciente({ paciente, aoVoltar, aoEditar }) {
  {/*valida se tem paciente, se não mostra a tela sem nenhum paciente*/}
  if (!paciente) {
    {/*
      <View style={styles.tela} O componente View chama o estilo .tela que esta no final da pagina
      <Text>Nenhum paciente selecionado.</Text> texto sem estilo
      */}
    return (
      <View style={styles.tela}>
        <Text>Nenhum paciente selecionado.</Text>
        {/*
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}> O componente Pressable chama o estilo .botaoVoltar que esta no final da pagina chamando conteudo da tela anterior da lista
        <Text style={styles.textoBotaoVoltar}>Voltar</Text> O componente Text chama o estilo .textoBotaoVoltar que esta no final da pagina
        </Pressable> Fechamento do Pressable
        */}
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar</Text>
        </Pressable>
        {/*Fechamento da View tela*/}
      </View>
    );
  }

  return (
    <>{/* agrupa elementos sem criar um nó extra no DOM.*/} 
      {/*<View style={styles.tela} O componente View chama o estilo .tela que esta no final da pagina*/}
      <View style={styles.tela}>
        {/*<View style={styles.cartao} O componente View chama o estilo .cartao que esta no final da pagina*/}
        <View style={styles.cartao}>
          {/*<Text style={styles.titulo} O componente Text chama o estilo .titulo que esta no final da pagina*/}
          <Text style={styles.titulo}>Ficha do Paciente</Text>
          {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
          <Text style={styles.rotulo}>Nome completo</Text>
          {/*<Text style={styles.valor} O componente Text chama o estilo .valor que esta no final da pagina e mostra o nome vinculado ao paciente*/}
          <Text style={styles.valor}>{paciente.nome}</Text>
          {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
          <Text style={styles.rotulo}>Serviço</Text>
          {/*<Text style={styles.valor} O componente Text chama o estilo .valor que esta no final da pagina e mostra o serviço vinculado ao paciente*/}
          <Text style={styles.valor}>{paciente.servico}</Text>
          {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
          <Text style={styles.rotulo}>Início do tratamento</Text>
          {/*<Text style={styles.valor} O componente Text chama o estilo .valor que esta no final da pagina e mostra a data de inicio vinculada ao paciente*/}
          <Text style={styles.valor}>{paciente.inicio}</Text>
          {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina*/}
          <Text style={styles.rotulo}>Descrição / Queixa principal</Text>
          {/*<Text style={styles.valor} O componente Text chama o estilo .valor que esta no final da pagina e mostra a descrição vinculada ao paciente*/}
          <Text style={styles.valor}>{paciente.descricao}</Text>
          {/*
          <Pressable style={styles.botaoPrimario} onPress={aoEditar}}> O componente Pressable chama o estilo .botaoPrimario que esta no final da pagina ao clicar chama a tela editar paciente
            <Text style={styles.textoBotaoPrimario}>Editar Paciente</Text> O componente Text chama o estilo .textoBotaoPrimario que esta no final da pagina
          </Pressable> Fechamento do Pressable
          */}
          <Pressable style={styles.botaoPrimario} onPress={aoEditar}>
            <Text style={styles.textoBotaoPrimario}>Editar Paciente</Text>
          </Pressable>
          {/*
          <Pressable style={styles.botaoVoltar} onPress={aoVoltar}> O componente Pressable chama o estilo .botaoVoltar que esta no final da pagina chamando conteudo da tela anterior da lista
          <Text style={styles.textoBotaoVoltar}>Voltar</Text> O componente Text chama o estilo .textoBotaoVoltar que esta no final da pagina
          </Pressable> Fechamento do Pressable
          */}
          <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
            <Text style={styles.textoBotaoVoltar}>Voltar para Lista</Text>
          </Pressable>
          {/*Fechamento da View cartao*/}
        </View>
        {/*Fechamento da View tela*/}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,  //ocupa todo o espaço disponível no pai
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
    color: '#1E293B',  //azul-navy profundo
    marginBottom: 18,  //espaçamento entre o texto e o item abaixo
  },
  rotulo: {
    fontSize: 13,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#64748B',  //azul ardósia
    marginTop: 8,  //espaçamento entre o texto e o item acima
  },
  valor: {
    fontSize: 16,  //Tamanho do texto 
    color: '#1E293B',  //azul-navy profundo
    marginBottom: 10,  //espaçamento entre o texto e o item abaixo
    backgroundColor: '#F8FAFC',
    padding: 10,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',  //Cor de fundo do botão
    padding: 12,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginTop: 14,  //espaçamento entre o texto e o item acima
    marginBottom: 10,  //espaçamento entre o botão e o item abaixo
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor do texto branca
    fontSize: 15,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',  //azul acinzentado claro
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Voltar"
    fontWeight: 'bold',  //Negrito
  },
});
