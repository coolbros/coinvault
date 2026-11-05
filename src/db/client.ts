import { SCHEMA_SQL } from './schema';
import { SEED_COIN_TYPES, SEED_TAGS } from './seedData';
import { runMigrations } from './migrations';

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

export function getDatabase(): DatabaseAdapter {
  if (!dbInstance) {
    const SQLite = require('expo-sqlite');
    dbInstance = SQLite.openDatabaseSync('coinvault.db');
  }
  return dbInstance!;
}

export function setTestDatabase(customDb: DatabaseAdapter): void {
  dbInstance = customDb;
  isInitialized = false;
}

export function initializeDatabase(): DatabaseAdapter {
  if (isInitialized && dbInstance) {
    return dbInstance!;
  }

  const db = getDatabase();

  // Run versioned migrations (uses PRAGMA user_version)
  runMigrations(db);

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
