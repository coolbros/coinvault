import { DatabaseAdapter } from '../client';
import { Migration } from './types';
import { v1InitialSchema } from './v1_initial_schema';
import { v2CompositeIndexes } from './v2_composite_indexes';

export const MIGRATIONS: Migration[] = [
  v1InitialSchema,
  v2CompositeIndexes,
];

export function getUserVersion(db: DatabaseAdapter): number {
  try {
    const row = db.getFirstSync<any>('PRAGMA user_version;');
    if (row && typeof row.user_version === 'number') {
      return row.user_version;
    }
    // Some drivers return an object with numeric index or uppercase key
    if (row) {
      const val = Object.values(row)[0];
      if (typeof val === 'number') return val;
    }
    return 0;
  } catch (err) {
    console.warn('[migrations] Failed to read user_version, assuming 0:', err);
    return 0;
  }
}

export function setUserVersion(db: DatabaseAdapter, version: number): void {
  db.execSync(`PRAGMA user_version = ${version};`);
}

export function runMigrations(
  db: DatabaseAdapter,
  targetVersion?: number
): { fromVersion: number; toVersion: number; appliedCount: number } {
  const currentVersion = getUserVersion(db);
  const maxVersion = targetVersion !== undefined 
    ? targetVersion 
    : Math.max(...MIGRATIONS.map(m => m.version), 0);

  if (currentVersion >= maxVersion) {
    return { fromVersion: currentVersion, toVersion: currentVersion, appliedCount: 0 };
  }

  const pendingMigrations = MIGRATIONS
    .filter(m => m.version > currentVersion && m.version <= maxVersion)
    .sort((a, b) => a.version - b.version);

  let appliedCount = 0;
  let activeVersion = currentVersion;

  for (const migration of pendingMigrations) {
    db.withTransactionSync(() => {
      migration.up(db);
      setUserVersion(db, migration.version);
    });
    activeVersion = migration.version;
    appliedCount++;
  }

  return {
    fromVersion: currentVersion,
    toVersion: activeVersion,
    appliedCount,
  };
}
