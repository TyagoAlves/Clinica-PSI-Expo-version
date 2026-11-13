// src/conexao/ConexaoProvider.tsx
// Estado da conexão com o servidor. O app é ONLINE: todos os dados ficam no Supabase.
// Este provider:
//  - acompanha se há internet (NetInfo) e se a API respondeu;
//  - busca a lista de profissionais da clínica;
//  - "Atualizar agora" (atualizarAgora) recarrega todas as telas a partir do servidor;
//  - recarrega sozinho ao voltar a internet, ao reabrir o app e a cada 1 minuto.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { avisarMudanca } from '../banco/bancoDados';
import { useAuth } from '../login/AuthProvider';
import { api, ApiError } from '../api/cliente';
import type { ApiMember } from '../api/tipos';

const INTERVALO_MS = 60_000;

export type EstadoConexao = 'conectado' | 'atualizando' | 'sem-internet' | 'erro';

interface ConexaoValue {
  estado: EstadoConexao;
  /** Última vez que os dados foram atualizados do servidor. */
  atualizadoEm: string | null;
  ultimoErro: string | null;
  /** Profissionais da clínica (usados nos formulários). */
  membros: ApiMember[];
  atualizarAgora(): Promise<void>;
}

const ConexaoContext = createContext<ConexaoValue | null>(null);

export function useConexao(): ConexaoValue {
  const ctx = useContext(ConexaoContext);
  if (!ctx) throw new Error('useConexao deve ser usado dentro de <ConexaoProvider>');
  return ctx;
}

export function ConexaoProvider({ children }: { children: React.ReactNode }) {
  const { status, clinic } = useAuth();
  const clinicId = status === 'signedIn' ? (clinic?.id ?? null) : null;

  const [estado, setEstado] = useState<EstadoConexao>('conectado');
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [ultimoErro, setUltimoErro] = useState<string | null>(null);
  const [membros, setMembros] = useState<ApiMember[]>([]);
  const rodando = useRef(false);

  const atualizarAgora = useCallback(async () => {
    if (!clinicId || rodando.current) return;
    rodando.current = true;
    setEstado('atualizando');
    try {
      setMembros(await api.members(clinicId));
      avisarMudanca(); // as listas abertas recarregam do banco
      setAtualizadoEm(new Date().toISOString());
      setUltimoErro(null);
      setEstado('conectado');
    } catch (e) {
      const semInternet = e instanceof ApiError && e.isNetwork;
      setEstado(semInternet ? 'sem-internet' : 'erro');
      setUltimoErro(e instanceof Error ? e.message : String(e));
    } finally {
      rodando.current = false;
    }
  }, [clinicId]);

  useEffect(() => {
    if (!clinicId) {
      setMembros([]);
      setAtualizadoEm(null);
      setEstado('conectado');
      return;
    }
    const atualizar = () => {
      atualizarAgora().catch(() => {});
    };
    atualizar();
    const pararNet = NetInfo.addEventListener((s) => {
      if (s.isConnected && s.isInternetReachable !== false) atualizar();
      else setEstado('sem-internet');
    });
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') atualizar();
    });
    const intervalo = setInterval(atualizar, INTERVALO_MS);
    return () => {
      pararNet();
      appSub.remove();
      clearInterval(intervalo);
    };
  }, [clinicId, atualizarAgora]);

  const value = useMemo<ConexaoValue>(
    () => ({ estado, atualizadoEm, ultimoErro, membros, atualizarAgora }),
    [estado, atualizadoEm, ultimoErro, membros, atualizarAgora]
  );

  return <ConexaoContext.Provider value={value}>{children}</ConexaoContext.Provider>;
}
