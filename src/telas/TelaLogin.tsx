import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';

export default function TelaLogin({ aoEntrar }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  return ( //o return de um componente React só pode ter um elemento raiz
    <> {/*Usar um Fragment (<>...</>) se quiser que os dois itens sejam irmãos sem um wrapper extra*/} 
{/*<View style={styles.tela} O componente View chama o estilo .tela que esta no final da pagina
*/}
<View style={styles.tela}>
      {/*<View style={styles.cartao} O componente View chama o estilo .cartao que esta no final da pagina
      */}
      <View style={styles.cartao}>
        {/*<Text style={styles.titulo} O componente Text chama o estilo .titulo que esta no final da pagina
        */}
        <Text style={styles.titulo}>Clínica PSI</Text>
        {/*<Text style={styles.subtitulo} O componente Text chama o estilo .subtitulo que esta no final da pagina
        */}
        <Text style={styles.subtitulo}>Prontuário Psicológico</Text>

        {/*<Text style={styles.rotulo} O componente Text chama o estilo .rotulo que esta no final da pagina
        */}
        <Text style={styles.rotulo}>E-mail</Text>
        {/*<TextInput Campo de digitação do e-mail
          style={styles.input} O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="nome@clinica.com.br" O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          value={email} valor atual do campo (estado)
          onChangeText={setEmail} a cada tecla, o novo texto atualiza o estado
        /> */}
        <TextInput 
          style={styles.input} 
          placeholder="nome@clinica.com.br" 
          value={email} 
          onChangeText={setEmail}
        />
        {/*<Text style={styles.rotulo}>Senha</Text> O componente Text chama o estilo .rotulo que esta no final da pagina
           <TextInput Campo de digitação do e-mail
          style={styles.input} O componente TextInput chama o estilo .input que esta no final da pagina
          placeholder="••••••••" O componente TextInput tem um texto interno que indica como deve ser preenchido o campo, e some ao começar a digitar
          secureTextEntry={true} Ao digitar no campo, a informação é protegida pela ocultação
          value={senha} valor atual do campo (estado)
          onChangeText={setSenha} a cada tecla, o novo texto atualiza o estado
        />
        */}
        <Text style={styles.rotulo}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry={true}
          value={senha}
          onChangeText={setSenha}
        />
        {/*
        <Pressable style={styles.botaoPrimario} onPress={aoEntrar}> O componente Pressable chama o estilo .botaoPrimario que esta no final da pagina
          <Text style={styles.textoBotaoPrimario}>Entrar</Text> O componente Text chama o estilo .textoBotaoPrimario que esta no final da pagina
        </Pressable> Fechamento do Pressable
        */}
        <Pressable style={styles.botaoPrimario} onPress={aoEntrar}>
          <Text style={styles.textoBotaoPrimario}>Entrar</Text>
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
    flex: 1, //preenche todo o espaço disponível
    backgroundColor: '#f8f1f1', //Cor de fundo da tela, cor branca meio azulada
    alignItems: 'center', //Alinhamento horizontal
    justifyContent: 'center', //Alinhamento vertical
    padding: 20,
  },
  cartao: { //Cartão siginifica a parte branca que contem todos os objetos de login
    width: '100%',  //é 100% da largura do container pai.
    maxWidth: 380, //Largura maxima
    backgroundColor: '#ffffff', //Cor de fundo branca
    padding: 20, //Espaçamento interno
    borderRadius: 12, //Arredondamento de borda
    borderWidth: 1, //Espessura da borda
    borderColor: '#DCE1EB', //Cor da borda
  },
  titulo: {
    fontSize: 26, //Tamanho do texto "Clinica PSI"
    fontWeight: 'bold', //Negrito
    color: '#1E293B', //azul-navy profundo
    textAlign: 'center', //Alinhamento do texto
  },
  subtitulo: {
    fontSize: 15, //Tamanho do texto "Prontuário Psicológico"
    color: '#64748B', //azul ardósia
    textAlign: 'center', //Alinhamento do texto
    marginBottom: 24, //Espaçamento entre o texto e o item abaixo
  },
  rotulo: {
    fontSize: 14, //Tamanho do texto que indica qual campo é
    fontWeight: 'bold', //Negrito
    color: '#334155', //Carvão azulado
    marginBottom: 6, //Espaçamento entre o texto e o item abaixo
  },
  input: {
    backgroundColor: '#F8FAFC', //Cor de fundo do campo de digitação
    borderWidth: 1,  //Espessura da borda
    borderColor: '#CBD5E1',  //Cor da borda
    borderRadius: 8, //Arredondamento de borda
    padding: 10,  //Espaçamento interno
    fontSize: 15, //Tamanho do texto do campo de digitação
    marginBottom: 16,  //Espaçamento entre o campo e o item abaixo
  },
  botaoPrimario: {
    backgroundColor: '#4F46E5', //Cor de fundo do botão "Entrar"
    padding: 12,  //espaçamento interno (define o tamanho do botão)
    borderRadius: 8,  //Arredondamento de borda
    alignItems: 'center',  //Alinhamento do texto
    marginTop: 8, //espaçamento acima do botão
  },
  textoBotaoPrimario: {
    color: '#FFFFFF',  //Cor do texto do botão "Entrar", cor branca
    fontSize: 16,  //Tamanho do texto do botão "Entrar"
    fontWeight: 'bold',  //Negrito
  },
});
