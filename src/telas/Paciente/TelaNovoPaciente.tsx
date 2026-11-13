import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';

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
    <ScrollView contentContainerStyle={styles.tela}>
      <View style={styles.cartao}>
        <Text style={styles.titulo}>Novo Paciente</Text>

        <Text style={styles.rotulo}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Como o paciente deve aparecer no sistema"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.rotulo}>Serviço</Text>
        <TextInput
          style={styles.input}
          placeholder="Psicoterapia / Avaliação"
          value={servico}
          onChangeText={setServico}
        />

        <Text style={styles.rotulo}>Início do tratamento</Text>
        <TextInput
          style={styles.input}
          placeholder="00/00/0000"
          value={inicio}
          onChangeText={setInicio}
        />

        <Text style={styles.rotulo}>Descrição / queixa principal</Text>
        <TextInput
          style={styles.input}
          placeholder="O que trouxe o paciente até o atendimento?"
          value={descricao}
          onChangeText={setDescricao}
        />

        <Pressable style={styles.botaoPrimario} onPress={salvar}>
          <Text style={styles.textoBotaoPrimario}>Salvar Paciente</Text>
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
    marginBottom: 14,
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
