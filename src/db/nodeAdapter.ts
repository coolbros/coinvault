import { DatabaseAdapter, setTestDatabase, initializeDatabase } from './client';

export function createNodeSqliteAdapter(): DatabaseAdapter {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  return {
    execSync: (sql: string) => {
      db.exec(sql);
    },
    runSync: (sql: string, params: any[] = []) => {
      const stmt = db.prepare(sql);
      const info = stmt.run(...params);
      return { changes: info.changes, lastInsertRowId: Number(info.lastInsertRowid) };
    },
    getAllSync: <T = any>(sql: string, params: any[] = []): T[] => {
      const stmt = db.prepare(sql);
      return stmt.all(...params) as T[];
    },
    getFirstSync: <T = any>(sql: string, params: any[] = []): T | null => {
      const stmt = db.prepare(sql);
      return (stmt.get(...params) as T) || null;
    },
    withTransactionSync: (callback: () => void) => {
      const tx = db.transaction(callback);
      tx();
    },
    prepareSync: (sql: string) => {
      const stmt = db.prepare(sql);
      return {
        executeSync: (params: any = []) => {
          let info;
          if (Array.isArray(params)) {
            info = stmt.run(...params);
          } else if (typeof params === 'object' && params !== null) {
            const normalized: Record<string, any> = {};
            for (const key of Object.keys(params)) {
              const cleanKey = key.startsWith('$') ? key.substring(1) : key;
              normalized[cleanKey] = params[key];
            }
            info = stmt.run(normalized);
          } else {
            info = stmt.run();
          }
          return { changes: info.changes, lastInsertRowId: Number(info.lastInsertRowid) };
        },
        finalizeSync: () => {},
      };
    },
  };
}

export function resetDatabaseForTesting(): void {
  const adapter = createNodeSqliteAdapter();
  setTestDatabase(adapter);
  initializeDatabase();
}
