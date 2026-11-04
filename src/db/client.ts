import { SCHEMA_SQL } from './schema';
import { SEED_COIN_TYPES, SEED_TAGS } from './seedData';

export interface DatabaseAdapter {
  execSync: (sql: string) => void;
  runSync: (sql: string, params?: any[]) => { changes: number; lastInsertRowId: number };
  getAllSync: <T = any>(sql: string, params?: any[]) => T[];
  getFirstSync: <T = any>(sql: string, params?: any[]) => T | null;
  withTransactionSync: (callback: () => void) => void;
  prepareSync: (sql: string) => {
    executeSync: (params?: any) => { changes: number; lastInsertRowId: number };
    finalizeSync: () => void;
  };
}

let dbInstance: DatabaseAdapter | null = null;
let isInitialized = false;

// Create better-sqlite3 wrapper for test/Node environments
function createNodeSqliteAdapter(): DatabaseAdapter {
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
            // handle named params like $country or object params
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

export function getDatabase(): DatabaseAdapter {
  if (!dbInstance) {
    if (process.env.NODE_ENV === 'test' || typeof jest !== 'undefined') {
      dbInstance = createNodeSqliteAdapter();
    } else {
      const SQLite = require('expo-sqlite');
      dbInstance = SQLite.openDatabaseSync('coinvault.db');
    }
  }
  return dbInstance!;
}

export function setTestDatabase(customDb: DatabaseAdapter): void {
  dbInstance = customDb;
  isInitialized = false;
}

export function resetDatabaseForTesting(): void {
  dbInstance = createNodeSqliteAdapter();
  isInitialized = false;
  initializeDatabase();
}

export function initializeDatabase(): DatabaseAdapter {
  if (isInitialized && dbInstance) {
    return dbInstance!;
  }

  const db = getDatabase();

  // Execute schema creation
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(SCHEMA_SQL);

  // Seed reference data if coin_types table is empty or missing reference types
  seedReferenceData(db);

  isInitialized = true;
  return db;
}

function seedReferenceData(db: DatabaseAdapter): void {
  const countRow = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM coin_types WHERE is_reference_type = 1;'
  );

  const existingRefCount = countRow?.count ?? 0;
  if (existingRefCount === 0) {
    const now = new Date().toISOString();

    db.withTransactionSync(() => {
      // Seed Reference Coin Types
      const stmt = db.prepareSync(`
        INSERT OR IGNORE INTO coin_types (
          id, country, denomination, year_start, year_end, ruler, mint, metal,
          coin_series, historical_period, catalog_references, obverse_description,
          reverse_description, shape, edge_type, diameter_mm, weight_g,
          is_reference_type, created_at, updated_at
        ) VALUES (
          $id, $country, $denomination, $year_start, $year_end, $ruler, $mint, $metal,
          $coin_series, $historical_period, $catalog_references, $obverse_description,
          $reverse_description, $shape, $edge_type, $diameter_mm, $weight_g,
          1, $created_at, $updated_at
        );
      `);

      for (const coin of SEED_COIN_TYPES) {
        stmt.executeSync({
          id: coin.id,
          country: coin.country,
          denomination: coin.denomination,
          year_start: coin.year_start,
          year_end: coin.year_end,
          ruler: coin.ruler,
          mint: coin.mint,
          metal: coin.metal,
          coin_series: coin.coin_series,
          historical_period: coin.historical_period,
          catalog_references: JSON.stringify(coin.catalog_references),
          obverse_description: coin.obverse_description,
          reverse_description: coin.reverse_description,
          shape: coin.shape,
          edge_type: coin.edge_type,
          diameter_mm: coin.diameter_mm,
          weight_g: coin.weight_g,
          created_at: now,
          updated_at: now,
        });
      }
      stmt.finalizeSync();

      // Seed Default Tags
      const tagStmt = db.prepareSync(`
        INSERT OR IGNORE INTO tags (id, name, color) VALUES ($id, $name, $color);
      `);

      for (const tag of SEED_TAGS) {
        tagStmt.executeSync({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        });
      }
      tagStmt.finalizeSync();
    });
  }
}
