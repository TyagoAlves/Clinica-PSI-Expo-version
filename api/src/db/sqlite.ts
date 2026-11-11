// Adaptador SQLite (better-sqlite3) da interface Db.
//
// Os repositórios escrevem SQL num dialeto "postgres-compatível" — placeholders
// $1, ILIKE, casts (::timestamptz etc.) e RETURNING. Este adaptador traduz para
// SQLite e executa. O better-sqlite3 já roda sobre SQLite >= 3.35, então
// RETURNING (INSERT/UPDATE/DELETE) é executado NATIVAMENTE — a propriedade
// `stmt.reader` diz se o statement devolve linhas.
//
// Como o better-sqlite3 é síncrono, toda operação passa por uma fila (mutex):
// transações (BEGIN…COMMIT) nunca são atravessadas por queries de outras
// requisições que estejam no meio de um await.
import Database from 'better-sqlite3';
import type { Db, Row } from './types.js';

/** Tradução do dialeto postgres-compatível para SQLite. */
function translate(sql: string): string {
  return (
    sql
      // O repositório escapa \% e \_ no LIKE — o SQLite só entende com ESCAPE.
      .replace(/\bILIKE\s+(\$\d+)/gi, "LIKE $1 ESCAPE '\\'")
      .replace(/\$(\d+)/g, '?') // placeholders $n → ?
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/::\w+/g, '') // casts de tipo não existem no SQLite
  );
}

/** Tipos que o postgres.js aceita e o better-sqlite3 não: converte antes de ligar. */
function normParam(p: unknown): unknown {
  if (typeof p === 'boolean') return p ? 1 : 0;
  if (p instanceof Date) return p.toISOString();
  return p;
}

/** Abre (ou cria) o banco em `filePath` (use ':memory:' para testes). */
export function createSqliteDb(filePath: string): Db {
  const raw = new Database(filePath);
  raw.pragma('journal_mode = WAL');
  raw.pragma('foreign_keys = ON');
  raw.pragma('busy_timeout = 5000');

  // Cache de prepared statements: o load-test dispara centenas de queries/s.
  const stmts = new Map<string, Database.Statement>();
  const prepare = (sql: string): Database.Statement => {
    let stmt = stmts.get(sql);
    if (!stmt) {
      stmt = raw.prepare(sql);
      stmts.set(sql, stmt);
    }
    return stmt;
  };

  const coreQuery = <T>(sql: string, params: unknown[]): T[] => {
    const stmt = prepare(translate(sql));
    // reader = SELECT/PRAGMA ou escrita com RETURNING.
    if (stmt.reader) return stmt.all(...(params.map(normParam) as never[])) as T[];
    stmt.run(...(params.map(normParam) as never[]));
    return [];
  };

  // ---- fila de execução (serializa o acesso à única conexão) ----
  let queue: Promise<unknown> = Promise.resolve();
  const serialize = <T>(job: () => T | Promise<T>): Promise<T> => {
    const result = queue.then(job, job); // roda mesmo se o anterior falhou
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  };

  // Visão usada DENTRO de uma transação: executa direto, sem reentrar na fila.
  const inside: Db = {
    query<T>(text: string, params: unknown[] = []) {
      return Promise.resolve(coreQuery<T>(text, params));
    },
    async exec(text: string) {
      raw.exec(text);
    },
    tx<T>(fn: (db: Db) => Promise<T>) {
      return fn(inside); // transação aninhada: já estamos isolados
    },
    close() {
      return Promise.resolve();
    },
  };

  return {
    query<T>(text: string, params: unknown[] = []) {
      return serialize(() => coreQuery<T>(text, params));
    },
    exec(text: string) {
      return serialize(() => {
        raw.exec(text);
      });
    },
    tx<T>(fn: (db: Db) => Promise<T>) {
      return serialize(async () => {
        raw.exec('BEGIN IMMEDIATE');
        try {
          const out = await fn(inside);
          raw.exec('COMMIT');
          return out;
        } catch (err) {
          try {
            raw.exec('ROLLBACK');
          } catch {
            /* a conexão já pode ter desfeito a transação sozinha */
          }
          throw err;
        }
      });
    },
    async close() {
      await queue; // espera operações em andamento
      raw.close();
    },
  };
}

export type { Row };
