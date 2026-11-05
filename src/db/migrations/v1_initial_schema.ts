import { Migration } from './types';
import { DatabaseAdapter } from '../client';
import { SCHEMA_SQL } from '../schema';

export const v1InitialSchema: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db: DatabaseAdapter) => {
    db.execSync('PRAGMA foreign_keys = ON;');
    db.execSync(SCHEMA_SQL);
  },
};
