// src/api/endereco.ts
// URL base da API Node.js (clinica-api).
//
// - Emulador Android: o host (seu PC) é acessível por 10.0.2.2 — "localhost" dentro do
//   emulador é o próprio emulador.
// - iOS Simulator / web: localhost funciona.
// - Celular físico: defina EXPO_PUBLIC_API_URL=http://<IP-do-PC>:3333 no .env do app
//   (e suba a API com HOST=0.0.0.0).
import { Platform } from 'react-native';

const DEFAULT_PORT = 3333;

function defaultBaseUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${DEFAULT_PORT}`;
}

export const API_BASE_URL: string = (process.env.EXPO_PUBLIC_API_URL || defaultBaseUrl()).replace(/\/+$/, '');

export const API_TIMEOUT_MS = 8000;
