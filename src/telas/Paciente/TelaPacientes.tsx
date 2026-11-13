import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

export default function TelaPacientes({
  pacientes = [],
  aoNovo,
  aoVoltar,
  verPaciente,
}) {
  return (
    <ScrollView contentContainerStyle={styles.tela}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Pacientes</Text>
        <Text style={styles.subtitulo}>Cadastro e acompanhamento</Text>

        <Pressable style={styles.botaoPrimario} onPress={aoNovo}>
          <Text style={styles.textoBotaoPrimario}>+ Novo Paciente</Text>
        </Pressable>

        {pacientes.length === 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.textoVazio}>Nenhum paciente cadastrado.</Text>
          </View>
        ) : (
          pacientes.map((paciente) => (
            <View key={paciente.id} style={styles.cartao}>
              <Text style={styles.nomePaciente}>{paciente.nome}</Text>
              <Text style={styles.detalhe}>Serviço: {paciente.servico}</Text>
              <Text style={styles.detalhe}>Início: {paciente.inicio}</Text>

              <Pressable
                style={styles.botaoSecundario}
                onPress={() => verPaciente(paciente)}
              >
                <Text style={styles.textoBotaoSecundario}>Ver Paciente</Text>
              </Pressable>
            </View>
          ))
        )}

        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar ao Painel</Text>
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
    marginBottom: 16,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1EB',
    marginBottom: 12,
  },
  nomePaciente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  detalhe: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  textoVazio: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoSecundario: {
    backgroundColor: '#E0E7FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotaoSecundario: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: 'bold',
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  textoBotaoVoltar: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
