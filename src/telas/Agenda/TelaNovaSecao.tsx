import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

export default function TelaNovaSecao({ aoSalvar, aoVoltar }) {
  const [paciente, setPaciente] = useState('');
  const [servico, setServico] = useState('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [duracao, setDuracao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  function salvar() {
    if (!paciente.trim()) return;
    aoSalvar({
      paciente: paciente.trim(),
      servico: servico.trim() || 'Psicoterapia',
      data: data.trim() || new Date().toLocaleDateString('pt-BR'),
      horario: horario.trim() || '14:00',
      duracao: duracao.trim() || '00:50',
      observacoes: observacoes.trim(),
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.tela}>
      <View style={styles.cartao}>
        <Text style={styles.titulo}>Nova Seção</Text>

        <Text style={styles.rotulo}>Paciente</Text>
        <TextInput
          style={styles.input}
          placeholder="Paciente que será agendado"
          value={paciente}
          onChangeText={setPaciente}
        />

        <Text style={styles.rotulo}>Serviço</Text>
        <TextInput
          style={styles.input}
          placeholder="Psicoterapia / Avaliação"
          value={servico}
          onChangeText={setServico}
        />

        <Text style={styles.rotulo}>Data</Text>
        <TextInput
          style={styles.input}
          placeholder="00/00/0000"
          value={data}
          onChangeText={setData}
        />

        <Text style={styles.rotulo}>Horário</Text>
        <TextInput
          style={styles.input}
          placeholder="00:00"
          value={horario}
          onChangeText={setHorario}
        />

        <Text style={styles.rotulo}>Duração</Text>
        <TextInput
          style={styles.input}
          placeholder="00:50"
          value={duracao}
          onChangeText={setDuracao}
        />

        <Text style={styles.rotulo}>Observações</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Primeira consulta, trazer exames"
          value={observacoes}
          onChangeText={setObservacoes}
        />

        <Pressable style={styles.botaoPrimario} onPress={salvar}>
          <Text style={styles.textoBotaoPrimario}>Salvar Seção</Text>
        </Pressable>

        <Pressable style={styles.botaoVoltar} onPress={aoVoltar}>
          <Text style={styles.textoBotaoVoltar}>Cancelar / Voltar</Text>
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
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
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
