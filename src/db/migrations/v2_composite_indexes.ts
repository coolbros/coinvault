import { Migration } from './types';
import { DatabaseAdapter } from '../client';

export const v2CompositeIndexes: Migration = {
  version: 2,
  name: 'composite_query_indexes',
  up: (db: DatabaseAdapter) => {
    // 1. Composite index to accelerate latest-valuation queries in specimen list & details
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_valuation_specimen_date_desc 
      ON valuation_records(specimen_id, valuation_date DESC);
    `);

    // 2. Composite index to accelerate latest-condition queries
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_condition_specimen_created_desc 
      ON condition_assessments(specimen_id, created_at DESC);
    `);

    // 3. Composite index for coin type lookup by country, denomination and year
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_coin_types_country_denom_year 
      ON coin_types(country, denomination, year_start);
    `);

    // 4. Composite index for coin images by specimen and side
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_coin_images_specimen_side 
      ON coin_images(specimen_id, image_side);
    `);
  },
};
