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
    <ScrollView contentContainerStyle={styles.tela}>
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
  );
}

const styles = StyleSheet.create({
  tela: {
    flexGrow: 1,
    backgroundColor: '#F1F3F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitulo: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 20,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1EB',
    marginBottom: 16,
  },
  tituloCartao: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  texto: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 14,
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    backgroundColor: '#E0E7FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotaoSecundario: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoSair: {
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotaoSair: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
