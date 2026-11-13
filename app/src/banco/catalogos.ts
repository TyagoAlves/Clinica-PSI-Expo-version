// src/banco/catalogos.ts
// Catálogos usados nos formulários (serviços ativos e profissionais da clínica).
import { useAuth } from '../login/AuthProvider';
import { useConexao } from '../conexao/ConexaoProvider';
import { useServicos } from './bancoDados';

/** Nomes do catálogo de serviços e dos profissionais, para os seletores do formulário. */
export function useCatalogs() {
  const { user } = useAuth();
  const { membros: members } = useConexao();
  const { itens: servicos } = useServicos();
  const professionals = members.length > 0 ? members.map((m) => m.name) : user ? [user.name] : [];
  // Só serviços ativos aparecem nos formulários (inativos continuam no histórico).
  const ativos = servicos.filter((s) => s.active !== false);
  return { services: ativos.map((s) => s.name), serviceList: ativos, professionals };
}
