import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

export default function TelaAgenda({
  secoes = [],
  aoVoltar,
  verSecao,
  editarSecao,
  novaSecao,
}) {
  // Pega a data de hoje formatada no padrão brasileiro (dd/mm/aaaa)
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return (
    <ScrollView contentContainerStyle={styles.tela}>
      <View style={styles.container}>
        <Text style={styles.titulo}>Agenda</Text>
        <Text style={styles.subtitulo}>Seções por dia</Text>

        {/* Barra de dias */}
        <View style={styles.barraDias}>
          <Text style={styles.diaInativo}>Ontem</Text>
          <Text style={styles.diaAtivo}>Hoje ({dataHoje})</Text>
          <Text style={styles.diaInativo}>Amanhã</Text>
        </View>

        <Pressable style={styles.botaoPrimario} onPress={novaSecao}>
          <Text style={styles.textoBotaoPrimario}>+ Nova Seção</Text>
        </Pressable>

        {secoes.length === 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.textoVazio}>Nenhuma seção agendada.</Text>
          </View>
        ) : (
          secoes.map((secao) => (
            <View key={secao.id} style={styles.cartao}>
              <View style={styles.linhaTopo}>
                <Text style={styles.horario}>
                  {secao.horario} ({secao.duracao})
                </Text>
                <Text style={styles.data}>{secao.data}</Text>
              </View>

              <Text style={styles.nomePaciente}>{secao.paciente}</Text>
              <Text style={styles.servico}>{secao.servico}</Text>
              {secao.observacoes ? (
                <Text style={styles.observacoes}>Obs: {secao.observacoes}</Text>
              ) : null}

              <View style={styles.linhaBotoes}>
                <Pressable
                  style={styles.botaoAcao}
                  onPress={() => verSecao && verSecao(secao)}
                >
                  <Text style={styles.textoBotaoAcao}>Ver Seção</Text>
                </Pressable>

                <Pressable
                  style={styles.botaoAcao}
                  onPress={() => editarSecao(secao)}
                >
                  <Text style={styles.textoBotaoAcao}>Editar Seção</Text>
                </Pressable>
              </View>
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
    marginBottom: 14,
  },
  barraDias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE1EB',
    marginBottom: 14,
  },
  diaInativo: {
    fontSize: 13,
    color: '#64748B',
  },
  diaAtivo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1EB',
    marginBottom: 12,
  },
  linhaTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  horario: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  data: {
    fontSize: 13,
    color: '#64748B',
  },
  nomePaciente: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  servico: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
  },
  observacoes: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  textoVazio: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
  botaoAcao: {
    flex: 1,
    backgroundColor: '#E0E7FF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  textoBotaoAcao: {
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
