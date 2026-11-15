// src/api/cliente.ts
// Cliente HTTP tipado da clinica-api. Guarda o token da sessão em memória
// (a persistência fica no AuthProvider, via SecureStore).
import { API_BASE_URL, API_TIMEOUT_MS } from './endereco';
import type { AuthResponse, MeResponse } from './tipos';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'error'
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Falha de rede/timeout: o servidor não foi alcançado (sem internet ou API desligada). */
  get isNetwork(): boolean {
    return this.status === 0;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Chamado quando a API responde 401 numa rota autenticada (sessão expirada/revogada). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function apiRequest<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const started = Date.now();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    console.log(`[api] ${method} ${path} -> ${res.status} (${Date.now() - started} ms)`);

    if (res.status === 204) return undefined as T;
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (data as { error?: { message?: string; code?: string } } | null)?.error;
      if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
      throw new ApiError(res.status, err?.message ?? `Erro ${res.status} na API.`, err?.code);
    }
    return data as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    const aborted = e instanceof Error && e.name === 'AbortError';
    console.warn(`[api] ${method} ${path} falhou:`, aborted ? 'timeout' : String(e));
    throw new ApiError(
      0,
      aborted
        ? `O servidor não respondeu em ${API_TIMEOUT_MS / 1000}s.`
        : 'Sem conexão com o servidor. Verifique a internet e tente de novo.',
      aborted ? 'timeout' : 'network_error'
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Rotas de login. Pacientes e sessões ficam em src/banco/bancoDados.ts. */
export const api = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('POST', '/api/v1/auth/login', { email, password }),
  logout: () => apiRequest<void>('POST', '/api/v1/auth/logout'),
  me: () => apiRequest<MeResponse>('GET', '/api/v1/me'),
};
