import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

export default function TelaHome({
  aoNovo,
  aoSair,
  aoAgenda,
  verPacientes,
  totalPacientes = 0,
  totalSecoes = 0,
}) {
  return (
    <>
    {/**/}
    <ScrollView contentContainerStyle={styles.tela}>
      {/*<View style={styles.container} O componente View chama o estilo .container que esta no final da pagina*/}
      <View style={styles.container}>
        <Text style={styles.titulo}>Painel</Text>
        <Text style={styles.subtitulo}>Visão geral da clínica</Text>

        {/* Cartão de Pacientes */}
        <View style={styles.cartao}>
          <Text style={styles.tituloCartao}>
            Pacientes cadastrados ({totalPacientes})
          </Text>
          <Text style={styles.texto}>
            Cadastre e acompanhe pacientes, sessões, evoluções e termos LGPD em
            um só lugar.
          </Text>

          <Pressable style={styles.botaoPrimario} onPress={verPacientes}>
            <Text style={styles.textoBotaoPrimario}>Ver Pacientes</Text>
          </Pressable>

          <Pressable style={styles.botaoSecundario} onPress={aoNovo}>
            <Text style={styles.textoBotaoSecundario}>+ Novo Paciente</Text>
          </Pressable>
        </View>

        {/* Cartão de Agenda */}
        <View style={styles.cartao}>
          <Text style={styles.tituloCartao}>
            Sessões agendadas ({totalSecoes})
          </Text>
          <Text style={styles.texto}>
            Consulte os horários do dia ou agende uma nova sessão.
          </Text>

          <Pressable style={styles.botaoPrimario} onPress={aoAgenda}>
            <Text style={styles.textoBotaoPrimario}>Abrir Agenda</Text>
          </Pressable>
        </View>

        <Pressable style={styles.botaoSair} onPress={aoSair}>
          <Text style={styles.textoBotaoSair}>Sair da conta</Text>
        </Pressable>
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  tela: {

    backgroundColor: '#f8f1f1', //Cor de fundo da tela, cor branca meio azulada
    alignItems: 'center', //Alinhamento horizontal
    justifyContent: 'center', //Alinhamento vertical
    padding: 20,  //espaçamento interno
  },
  container: {
    width: '100%',  //é 100% da largura do container pai.
    maxWidth: 420,  //Largura maxima
  },
  titulo: {
    fontSize: 26,  //Tamanho do texto "Painel"
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //azul-navy profundo
  },
  subtitulo: {
    fontSize: 15,  //Tamanho do texto "Visão geral da clínica"
    color: '#64748B',  //azul ardósia
    marginBottom: 20,  //espaçamento entre o texto e o item abaixo
  },
  cartao: {
    backgroundColor: '#FFFFFF',  //Cor de fundo branca
    padding: 18,  //espaçamento interno
    borderRadius: 12,  //Arredondamento de borda
    borderWidth: 1,  //Espessura da borda
    borderColor: '#DCE1EB',  //azul claro acinzentado
    marginBottom: 16,  //espaçamento entre o texto e o item abaixo
  },
  tituloCartao: {
    fontSize: 18,  //Tamanho do texto "Pacientes cadastrados" e "Sessões agendadas "
    fontWeight: 'bold',  //Negrito
    color: '#1E293B',  //azul escuro e dessaturado
    marginBottom: 6,  //espaçamento entre o texto e o item abaixo
  },
  texto: {
    fontSize: 14,  //Tamanho do texto "Cadastre e acompanhe pacientes, sessões, evoluções e termos LGPD em um só lugar." e "Consulte os horários do dia ou agende uma nova sessão."
    color: '#475569',  //azul-ciano escuro e médio
    marginBottom: 14,  //espaçamento entre o texto e o item abaixo
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5', //Cor de fundo do botão "Entrar"
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //Alinhamento do texto
    marginBottom: 8, //espaçamento entre o botão e o item abaixo
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor do texto do botões, cor branca
    fontSize: 15,  //Tamanho do texto do botão "Ver Pacientes" e "Abrir Agenda"
    fontWeight: 'bold',  //Negrito
  },
  botaoSecundario: {
    backgroundColor: '#E0E7FF',  //Azul muito claro
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //Alinhamento do texto
  },
  textoBotaoSecundario: {
    color: '#4F46E5',  //Cor do texto do botão "+ Novo Paciente", cor Majorelle Blue
    fontSize: 15,  //Tamanho do texto do botão 
    fontWeight: 'bold',  //Negrito
  },
  botaoSair: {
    backgroundColor: '#E2E8F0',  //azul acinzentado claro
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //Alinhamento do texto
    marginTop: 8,  //espaçamento entre o botão e o item acima
  },
  textoBotaoSair: {
    color: '#334155',  //Cor do texto do botão "Sair", azul slate escuro e dessaturado
    fontSize: 15,  //Tamanho do texto do botão "Sair"
    fontWeight: 'bold',  //Negrito
  },
});
