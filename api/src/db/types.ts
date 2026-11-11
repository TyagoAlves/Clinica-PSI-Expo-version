// Interface única de acesso ao banco (padrão "conector"): services, rotas e
// repositórios só conhecem este contrato — o adaptador SQLite (src/db/sqlite.ts)
// implementa; trocar de banco não mexe no resto da API.
export type Row = Record<string, unknown>;

export interface Db {
  /** Consulta parametrizada ($1, $2… no dialeto postgres-compatível). Devolve as linhas. */
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Executa SQL com vários comandos, sem parâmetros (migrações/reset). */
  exec(text: string): Promise<void>;
  /** Executa `fn` numa transação; desfaz tudo se lançar erro. */
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
