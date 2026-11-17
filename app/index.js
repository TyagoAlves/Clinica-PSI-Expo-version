//o objetivo dessa parte do código é:
// o app Android precisam de um ponto de entrada. o Expo esconde essa parte nativa e só pede que você diga qual componente é a “raiz”

import { registerRootComponent } from 'expo'; //importa do expo a função que registra o componente principal.
import App from './App'; //importa o app da pasta /app

registerRootComponent(App); // função que regista a raiz do app
