import { View, Text, Pressable, StyleSheet } from 'react-native';

export default function TelaPaciente({ paciente, aoVoltar, aoEditar }) {
  if (!paciente) {
    return (
      <View style={styles.tela}>
        <Text>Nenhum paciente selecionado.</Text>
        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={styles.cartao}>
        <Text style={styles.titulo}>Ficha do Paciente</Text>

        <Text style={styles.rotulo}>Nome completo</Text>
        <Text style={styles.valor}>{paciente.nome}</Text>

        <Text style={styles.rotulo}>Serviço</Text>
        <Text style={styles.valor}>{paciente.servico}</Text>

        <Text style={styles.rotulo}>Início do tratamento</Text>
        <Text style={styles.valor}>{paciente.inicio}</Text>

        <Text style={styles.rotulo}>Descrição / Queixa principal</Text>
        <Text style={styles.valor}>{paciente.descricao}</Text>

        <Pressable style={styles.botaoPrimario} onPress={aoEditar}>
          <Text style={styles.textoBotaoPrimario}>Editar Paciente</Text>
        </Pressable>

        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Voltar para Lista</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#F1F3F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cartao: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1EB',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 18,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 8,
  },
  valor: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  botaoVoltar: {
    backgroundColor: '#E2E8F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotaoVoltar: {
    color: '#334155',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
