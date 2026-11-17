import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

export default function TelaAgenda({ //  - os dados são salvos e recupecuperados do banco de dados Supabase que é configurado no arquivo bancoDados.js, e são passados como props para o componente TelaAgenda.
  secoes = [],  //- secoes: um array de objetos representando as seções agendadas. Cada objeto deve conter informações como id, horário, duração, data, paciente, serviço e observações.
  aoVoltar,  //- aoVoltar: uma função que é chamada quando o botão "Voltar ao Painel" é pressionado.
  verSecao,  //- verSecao: uma função que é chamada quando o botão "Ver Seção" de uma seção específica é pressionado. Recebe a seção como argumento.
  editarSecao,  //- editarSecao: uma função que é chamada quando o botão "Editar Seção" de uma seção específica é pressionado. Recebe a seção como argumento.
  novaSecao,  //- novaSecao: uma função que é chamada quando o botão "+ Nova Seção" é pressionado. Abre um formulário para criar uma nova seção na agenda.
}) {
  // Pega a data de hoje formatada no padrão brasileiro (dd/mm/aaaa)
  // A função toLocaleDateString('pt-BR') formata a data no padrão brasileiro, que é dia/mês/ano.
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const d = new Date(); // Cria um objeto Date com a data atual
  d.setDate(d.getDate() + 1);  // Adiciona um dia à data atual para obter a data de amanhã
  const dataAmanha = d.toLocaleDateString('pt-BR'); // Formata a data de amanhã no padrão brasileiro (dd/mm/aaaa)
  const dOntem = new Date();  // Cria um objeto Date com a data atual
  dOntem.setDate(dOntem.getDate() - 1);  // Subtrai um dia da data atual para obter a data de ontem
  const dataOntem = dOntem.toLocaleDateString('pt-BR');   // Formata a data de ontem no padrão brasileiro (dd/mm/aaaa)

  return (
    <>
      {/*Define um ScrollView para permitir rolagem da tela, com estilo definido em styles.tela*/}
      <ScrollView contentContainerStyle={styles.tela}>
      {/*<View style={styles.container} O componente View chama o estilo .container que esta no final da pagina*/}
        <View style={styles.container}>
          {/*<Text style={styles.titulo} O componente Text chama o estilo .titulo que esta no final da pagina*/}
          <Text style={styles.titulo}>Agenda</Text>
          {/*<Text style={styles.subtitulo} O componente Text chama o estilo .subtitulo que esta no final da pagina*/}
          <Text style={styles.subtitulo}>Seções por dia</Text>

          {/*<View style={styles.barraDias} O componente View chama o estilo .barraDias que esta no final da pagina*/}
          {/*A barra de dias mostra "Ontem", "Hoje" e "Amanhã", com o dia atual destacado.*/}
          <View style={styles.barraDias}>
            {/*<Text style={styles.diaInativo}>Ontem</Text>  O componente Text chama o estilo .diaInativo que esta no final da pagina*/}
            {/*o valoe de dataOntem é obtido através da const dOntem que é criada e formatada no padrão brasileiro*/}
            <Text style={styles.diaInativo}>Ontem ({dataOntem})</Text>
            {/*<Text style={styles.diaAtivo}>Hoje ({dataHoje})</Text>  O componente Text chama o estilo .diaAtivo que esta no final da pagina*/}
            {/*dataHoje faz a formatação da data no padrão brasileiro e pega esse valor da const dataHoje definida no início da função*/}
            <Text style={styles.diaAtivo}>Hoje ({dataHoje})</Text>
            {/*<Text style={styles.diaInativo}>Amanhã</Text>  O componente Text chama o estilo .diaInativo que esta no final da pagina*/}
            {/*dataAmanha faz a formatação da data no padrão brasileiro e pega esse valor da const dataAmanha definida no início da função*/}
            <Text style={styles.diaInativo}>Amanhã ({dataAmanha})</Text>
          </View>
          {/*
          //novaSecao é uma função que é chamada quando o botão "+ Nova Seção" é pressionado. Ela abre um formulário para criar uma nova seção na agenda que foi definido no início da função e no app.js.
          <Pressable style={styles.botaoPrimario} onPress={novaSecao}> //O componente Pressable chama o estilo .botaoPrimario que esta no final da pagina
            <Text style={styles.textoBotaoPrimario}>+ Nova Seção</Text> //O componente Text chama o estilo .textoBotaoPrimario que esta no final da pagina
          </Pressable>
          */}
          <Pressable style={styles.botaoPrimario} onPress={novaSecao}>
            <Text style={styles.textoBotaoPrimario}>+ Nova Seção</Text>
          </Pressable>
          {/*{secoes.length === 0 ? ( Se não houver seções agendadas, exibe uma mensagem informando que não há seções agendadas.*/}
          {secoes.length === 0 ? (
            <>
            {/*<View style={styles.cartao}> O componente View chama o estilo .cartao que esta no final da pagina*/}
            <View style={styles.cartao}>
              {/*<Text style={styles.textoVazio}>Nenhuma seção agendada.</Text> O componente Text chama o estilo .textoVazio que esta no final da pagina*/}
              <Text style={styles.textoVazio}>Nenhuma seção agendada.</Text>
            </View>
            {/*fecha o componente View do cartão*/}
            {/* ) : ( Se houver seções agendadas, exibe uma lista de cartões com as informações de cada seção.*/}
            </>
          ) : (
            //O método map() é usado para percorrer o array de seções e renderizar um cartão para cada seção.
            secoes.map((secao) => (
              //secao.id é usado como chave única para cada cartão, garantindo que o React possa identificar corretamente cada elemento da lista.
              //O componente View chama o estilo .cartao que esta no final da pagina  
              <View key={secao.id} style={styles.cartao}>   
                <>
                {/*O componente View chama o estilo .linhaTopo que esta no final da pagina*/}
                <View style={styles.linhaTopo}> 
                  {/*O componente Text chama o estilo .horario que esta no final da pagina*/}
                  <Text style={styles.horario}>
                    {/*secao.horario é a hora da seção, e secao.duracao é a duração da seção. Ambos são exibidos no formato "horário (duração)".*/}
                    {/*secao.data é a data da seção, exibida no formato "dd/mm/aaaa".*/}
                    {secao.horario} ({secao.duracao})
                    {/*essa informação vem do objeto secao que é passado como parâmetro para a função map().*/}
                  </Text>
                  {/*O componente Text chama o estilo .data que esta no final da pagina*/}
                  {/*Exibe a data da seção buscada no banco de dados Supabase e passada como parâmetro para a função map().*/}
                  <Text style={styles.data}>{secao.data}</Text> 
                </View>
                {/*O componente Text chama o estilo .nomePaciente que esta no final da pagina*/}
                {/*Exibe o nome do paciente da seção buscada no banco de dados Supabase e passada como parâmetro para a função map().*/}
                <Text style={styles.nomePaciente}>{secao.paciente}</Text>
                  {/*O componente Text chama o estilo .servico que esta no final da pagina*/}
                  {/*Exibe o serviço da seção buscada no banco de dados Supabase e passada como parâmetro para a função map().*/}
                <Text style={styles.servico}>{secao.servico}</Text>
                {secao.observacoes ? (  //Se houver observações para a seção
                  <>
                  {/*O componente Text chama o estilo .observacoes que esta no final da pagina*/}
                  {/*Exibe as observações da seção buscada no banco de dados Supabase e passada como parâmetro para a função map().*/}  
                  {/*  Acho que esse texto abaixo esta errado ou a função map() não esta funcionando corretamente, pois não exibe as observações da seção buscada no banco de dados Supabase e passada como parâmetro para a função map().*/}
                  <Text style={styles.observacoes}>Obs: {secao.observacoes}</Text>
                  </>
                ) : null}
                {/*<View style={styles.linhaBotoes}> O componente View chama o estilo .linhaBotoes que esta no final da pagina
                </View>*/}
                <View style={styles.linhaBotoes}>
                  {/*
                  <Pressable
                    style={styles.botaoAcao} //O componente Pressable chama o estilo .botaoAcao que esta no final da pagina
                    onPress={() => verSecao && verSecao(secao)} //A função verSecao é chamada quando o botão "Ver Seção" é pressionado, passando a seção como argumento. A verificação verSecao && garante que a função só será chamada se ela estiver definida.
                  >
                    <Text style={styles.textoBotaoAcao}>Ver Seção</Text> //O componente Text chama o estilo .textoBotaoAcao que esta no final da pagina
                  </Pressable>
                  */}
                  <Pressable
                    style={styles.botaoAcao}
                    onPress={() => verSecao && verSecao(secao)}
                  >
                    <Text style={styles.textoBotaoAcao}>Ver Seção</Text>
                  </Pressable>
                  {/*
                  <Pressable
                    style={styles.botaoAcao} //O componente Pressable chama o estilo .botaoAcao que esta no final da pagina
                    onPress={() => editarSecao(secao)} //A função editarSecao é chamada quando o botão "Editar Seção" é pressionado, passando a seção como argumento.
                  */}
                  <Pressable
                    style={styles.botaoAcao}
                    onPress={() => editarSecao(secao)}
                  >
                    <Text style={styles.textoBotaoAcao}>Editar Seção</Text>
                  </Pressable>
                  {/*Fechamento do componente View que contém os botões de ação */}
                </View>
                {/*Fechamento do componente View que contém a seção */}
                </>
              </View>
            ))
          )}
          {/*
          aoVoltar é uma função que é chamada quando o botão "Voltar ao Painel" é pressionado. Ela retorna o usuário para a tela anterior, que é o painel principal do aplicativo.
          <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>  O componente Pressable chama o estilo .botaoVoltar que esta no final da pagina
            <Text style={styles.textoBotaoVoltar}>Voltar ao Painel</Text>  O componente Text chama o estilo .textoBotaoVoltar que esta no final da pagina
          */}
          <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
            <Text style={styles.textoBotaoVoltar}>Voltar ao Painel</Text>
          </Pressable>
          {/*Fechamento do componente View do container principal */}
        </View>
      {/*Fechamento do componente ScrollView que permite rolagem da tela */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {
    flexGrow: 1,  //o conteúdo cresce pra preencher
    backgroundColor: '#f8f1f1', //Cor de fundo da tela, cor rosa pálido
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal)
    padding: 20,  //espaçamento interno
  },
  container: {
    width: '100%',  //Largura total do container
    maxWidth: 420,  //Largura máxima do container
  },
  titulo: {
    fontSize: 26,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //ardósia noturna
  },
  subtitulo: {
    fontSize: 15,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
    marginBottom: 14,  //espaçamento entre o texto e o item abaixo
  },
  barraDias: {
    flexDirection: 'row',  //Alinhamento horizontal
    justifyContent: 'space-between',  //Espaçamento entre os itens
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    backgroundColor: '#FFFFFF',  //Cor de fundo branca
    padding: 12,  //espaçamento interno
    borderRadius: 10,  //Arredondamento de borda
    borderWidth: 1,  //Espessura da borda
    borderColor: '#DCE1EB',  //azul claro acinzentado
    marginBottom: 14,  //espaçamento entre o texto e o item abaixo
  },
  diaInativo: {
    fontSize: 13,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
  },
  diaAtivo: {
    fontSize: 14,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#4F46E5',  //Azul Majorelle
  },
  cartao: {
    backgroundColor: '#FFFFFF',  //Cor de fundo branca
    padding: 16,  //espaçamento interno
    borderRadius: 12,  //Arredondamento de borda
    borderWidth: 1,  //Espessura da borda
    borderColor: '#DCE1EB',  //azul claro acinzentado
    marginBottom: 12,  //espaçamento entre o texto e o item abaixo
  },
  linhaTopo: {
    flexDirection: 'row',  //Alinhamento horizontal
    justifyContent: 'space-between',  //Espaçamento entre os itens
    marginBottom: 6,  //espaçamento entre o texto e o item abaixo
  },
  horario: {
    fontSize: 15,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#4F46E5',  //Azul Majorelle
  },
  data: {
    fontSize: 13,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
  },
  nomePaciente: {
    fontSize: 18,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //ardósia noturna
  },
  servico: {
    fontSize: 14,  //Tamanho do texto 
    color: '#475569',  //East Bay
    marginTop: 2,  //espaçamento entre o texto e o item abaixo
  },
  observacoes: {
    fontSize: 13,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
    marginTop: 4,  //espaçamento entre o texto e o item abaixo
  },
  textoVazio: {
    fontSize: 15,  //Tamanho do texto 
    color: '#64748B',  //azul ardósia
    textAlign: 'center',  //Alinhamento do texto
  },
  linhaBotoes: {
    flexDirection: 'row',  //Alinhamento horizontal
    gap: 8,  //espaçamento entre os botões
    marginTop: 12,  //espaçamento entre o texto e o item abaixo
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',  //Azul Majorelle
    padding: 12,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginBottom: 16,  //espaçamento entre o botão e o item abaixo
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //cor do texto branca
    fontSize: 15,  //Tamanho do texto 
    fontWeight: 'bold',  //Negrito
  },
  botaoAcao: {
    flex: 1,
    backgroundColor: '#E0E7FF',  //Azul muito claro
    padding: 10,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
  },
  textoBotaoAcao: {
    color: '#4F46E5',  //Azul Majorelle
    fontSize: 14,  //Tamanho do texto
    fontWeight: 'bold',  //Negrito
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',  //azul acinzentado claro
    padding: 12,  //espaçamento interno
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //centraliza o conteúdo no eixo cruzado (horizontal),  
    marginTop: 8,  //espaçamento entre o botão e o item abaixo
  },
  textoBotaoVoltar: {
    color: '#334155',  //Cor do texto do botão "Voltar", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Voltar"
    fontWeight: 'bold',  //Negrito
  },
});
