// src/banco/bancoDados.ts
// Comunicação do app com o banco de dados (Supabase), passando pela nossa API Node.js.
//
//   [ Telas do app ]
//         │  chamam as funções abaixo (async/await)
//         ▼
//   [ bancoDados.ts ]  ── HTTP (GET, POST, PATCH, DELETE) com o token do login ──▶  [ API Node.js (api/) ]
//                                                                                        │ SQL
//                                                                                        ▼
//                                                                               [ Supabase (PostgreSQL) ]
//
// São só 5 funções de CRUD + 1 "hook" que as telas usam para mostrar listas.
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/cliente';
import { useAuth } from '../login/AuthProvider';
import type { Appointment, Evolution, Patient, Service } from '../api/tipos';

// ===== Tipos com nomes em português (o formato vem da API) =====
export type Paciente = Patient;
export type Servico = Service;
export type Sessao = Appointment;
export type Evolucao = Evolution;

// ===== Endereços (rotas) da API =====
const V1 = '/api/v1';
export const rotas = {
  pacientes: (clinica: string) => `${V1}/clinics/${clinica}/patients`,
  paciente: (id: string) => `${V1}/patients/${id}`,

  servicos: (clinica: string) => `${V1}/clinics/${clinica}/services`,
  servico: (id: string) => `${V1}/services/${id}`,

  /** Prontuário de um paciente. */
  evolucoesDoPaciente: (paciente: string) => `${V1}/patients/${paciente}/evolutions`,
  /** Últimas evoluções da clínica (Painel). */
  ultimasEvolucoes: (clinica: string) => `${V1}/clinics/${clinica}/evolutions`,
  evolucao: (id: string) => `${V1}/evolutions/${id}`,

  /** Sessões da agenda; filtros opcionais por dia (AAAA-MM-DD) e por paciente. */
  sessoes: (clinica: string, filtro: { de?: string; ate?: string; paciente?: string } = {}) => {
    const params = [
      filtro.de ? `from=${filtro.de}` : '',
      filtro.ate ? `to=${filtro.ate}` : '',
      filtro.paciente ? `patientId=${filtro.paciente}` : '',
    ].filter(Boolean);
    return `${V1}/clinics/${clinica}/appointments${params.length ? `?${params.join('&')}` : ''}`;
  },
  sessao: (id: string) => `${V1}/appointments/${id}`,
};

// ===== Aviso de "os dados mudaram" =====
// Depois de criar/editar/apagar, todas as listas abertas recarregam do banco.
const ouvintes = new Set<() => void>();
export function avisarMudanca() {
  ouvintes.forEach((recarregar) => recarregar());
}
/** Registra uma função para rodar quando os dados mudarem. Devolve a função que cancela. */
export function ouvirMudancas(recarregar: () => void) {
  ouvintes.add(recarregar);
  return () => {
    ouvintes.delete(recarregar);
  };
}

// ===== As funções de CRUD =====

/** 1. LISTAR (READ) — GET. A API devolve em páginas; aqui juntamos todas (ou até `limite`). */
export async function buscarDados<T>(caminho: string, limite = Infinity): Promise<T[]> {
  const itens: T[] = [];
  let offset = 0;
  for (;;) {
    const tamanho = Math.min(200, limite - itens.length);
    const sep = caminho.includes('?') ? '&' : '?';
    const pagina = await apiRequest<{ items: T[]; nextOffset: number | null }>(
      'GET',
      `${caminho}${sep}limit=${tamanho}&offset=${offset}`
    );
    itens.push(...pagina.items);
    if (pagina.nextOffset === null || itens.length >= limite) return itens;
    offset = pagina.nextOffset;
  }
}

/** 1b. BUSCAR UM (READ) — GET de um item. Devolve null se não existir. */
export async function buscarUm<T>(caminho: string): Promise<T | null> {
  try {
    return await apiRequest<T>('GET', caminho);
  } catch (e: any) {
    if (e?.status === 404) return null;
    throw e;
  }
}

/** 2. CRIAR (CREATE) — POST. Devolve o registro salvo (com o id gerado). */
export async function criarNoBanco<T>(caminho: string, item: unknown): Promise<T> {
  const criado = await apiRequest<T>('POST', caminho, item);
  avisarMudanca();
  return criado;
}

/** 3. EDITAR (UPDATE) — PATCH. Manda só os campos alterados. */
export async function atualizarNoBanco<T>(caminho: string, campos: unknown): Promise<T> {
  const atualizado = await apiRequest<T>('PATCH', caminho, campos);
  avisarMudanca();
  return atualizado;
}

/** 4. APAGAR (DELETE). */
export async function apagarNoBanco(caminho: string): Promise<void> {
  await apiRequest<void>('DELETE', caminho);
  avisarMudanca();
}

// ===== Hook para as telas =====

/**
 * Lista que a tela mostra: busca ao abrir e recarrega quando algo muda.
 * Uso: `const { itens } = useDados<Paciente>(rotas.pacientes(clinica.id))`
 * Passe `null` como caminho para não buscar nada (ex.: sem clínica ainda).
 */
export function useDados<T>(caminho: string | null, limite?: number) {
  const [itens, setItens] = useState<T[]>([]);
  const [carregado, setCarregado] = useState(false);

  const recarregar = useCallback(async () => {
    if (!caminho) return;
    try {
      setItens(await buscarDados<T>(caminho, limite));
    } catch (erro) {
      console.warn(`[banco] erro ao buscar ${caminho}:`, erro);
    } finally {
      setCarregado(true);
    }
  }, [caminho, limite]);

  useEffect(() => {
    recarregar();
    return ouvirMudancas(recarregar);
  }, [recarregar]);

  return { itens, carregado, recarregar };
}

/** Atalho: pacientes da clínica logada. */
export function usePacientes() {
  const { clinic } = useAuth();
  return useDados<Paciente>(clinic ? rotas.pacientes(clinic.id) : null);
}

/** Atalho: serviços da clínica logada. */
export function useServicos() {
  const { clinic } = useAuth();
  return useDados<Servico>(clinic ? rotas.servicos(clinic.id) : null);
}
