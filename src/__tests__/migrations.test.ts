import { resetDatabaseForTesting } from '../db/nodeAdapter';
import { getDatabase } from '../db/client';
import { runMigrations, getUserVersion, setUserVersion, MIGRATIONS } from '../db/migrations';

describe('Database Migrations with PRAGMA user_version', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('initializes database to latest migration version', () => {
    const db = getDatabase();
    const currentVersion = getUserVersion(db);
    const expectedLatest = Math.max(...MIGRATIONS.map(m => m.version));
    expect(currentVersion).toBe(expectedLatest);
    expect(currentVersion).toBeGreaterThanOrEqual(2);
  });

  it('runs migrations incrementally from an older version', () => {
    const db = getDatabase();
    // Simulate an older database at version 1
    setUserVersion(db, 1);
    expect(getUserVersion(db)).toBe(1);

    const result = runMigrations(db);
    expect(result.fromVersion).toBe(1);
    expect(result.toVersion).toBe(2);
    expect(result.appliedCount).toBe(1);
    expect(getUserVersion(db)).toBe(2);
  });

  it('is idempotent when already at target version', () => {
    const db = getDatabase();
    const result = runMigrations(db);
    expect(result.appliedCount).toBe(0);
  });

  it('creates the composite index idx_valuation_specimen_date_desc', () => {
    const db = getDatabase();
    const indexRows = db.getAllSync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_valuation_specimen_date_desc';"
    );
    expect(indexRows.length).toBe(1);
    expect(indexRows[0].name).toBe('idx_valuation_specimen_date_desc');
  });
});
