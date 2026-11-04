import { getDatabase } from '../../db/client';
import { z } from 'zod';

export const BackupSchema = z.object({
  version: z.string(),
  exported_at: z.string(),
  coin_types: z.array(z.any()),
  specimens: z.array(z.any()),
  coin_images: z.array(z.any()),
  tags: z.array(z.any()),
  specimen_tags: z.array(z.any()),
  condition_assessments: z.array(z.any()),
  valuation_records: z.array(z.any()),
  identification_records: z.array(z.any()),
});

export type BackupData = z.infer<typeof BackupSchema>;

export const jsonBackupService = {
  createBackup(): BackupData {
    const db = getDatabase();

    const coin_types = db.getAllSync('SELECT * FROM coin_types;');
    const specimens = db.getAllSync('SELECT * FROM specimens;');
    const coin_images = db.getAllSync('SELECT * FROM coin_images;');
    const tags = db.getAllSync('SELECT * FROM tags;');
    const specimen_tags = db.getAllSync('SELECT * FROM specimen_tags;');
    const condition_assessments = db.getAllSync('SELECT * FROM condition_assessments;');
    const valuation_records = db.getAllSync('SELECT * FROM valuation_records;');
    const identification_records = db.getAllSync('SELECT * FROM identification_records;');

    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      coin_types,
      specimens,
      coin_images,
      tags,
      specimen_tags,
      condition_assessments,
      valuation_records,
      identification_records,
    };
  },

  validateBackup(jsonString: string): { valid: boolean; data?: BackupData; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      const validated = BackupSchema.parse(parsed);
      return { valid: true, data: validated };
    } catch (e: any) {
      return { valid: false, error: e.message || 'Invalid CoinVault backup schema' };
    }
  },

  restoreBackup(data: BackupData, overwriteExisting = false): { success: boolean; specimensRestored: number } {
    const db = getDatabase();
    let specimensRestored = 0;

    db.withTransactionSync(() => {
      if (overwriteExisting) {
        db.runSync('DELETE FROM specimen_tags;');
        db.runSync('DELETE FROM coin_images;');
        db.runSync('DELETE FROM valuation_records;');
        db.runSync('DELETE FROM condition_assessments;');
        db.runSync('DELETE FROM identification_records;');
        db.runSync('DELETE FROM specimens;');
        db.runSync('DELETE FROM coin_types WHERE is_reference_type = 0;');
      }

      // Restore Coin Types
      const ctStmt = db.prepareSync(`
        INSERT OR REPLACE INTO coin_types (
          id, country, denomination, year_start, year_end, ruler, mint, metal,
          coin_series, historical_period, catalog_references, obverse_description,
          reverse_description, shape, edge_type, diameter_mm, weight_g,
          is_reference_type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      for (const ct of data.coin_types) {
        ctStmt.executeSync([
          ct.id,
          ct.country,
          ct.denomination,
          ct.year_start ?? null,
          ct.year_end ?? null,
          ct.ruler ?? null,
          ct.mint ?? null,
          ct.metal ?? null,
          ct.coin_series ?? null,
          ct.historical_period ?? null,
          typeof ct.catalog_references === 'string' ? ct.catalog_references : JSON.stringify(ct.catalog_references || []),
          ct.obverse_description ?? null,
          ct.reverse_description ?? null,
          ct.shape ?? 'Round',
          ct.edge_type ?? 'Reeded',
          ct.diameter_mm ?? null,
          ct.weight_g ?? null,
          ct.is_reference_type ?? 0,
          ct.created_at || new Date().toISOString(),
          ct.updated_at || new Date().toISOString(),
        ]);
      }
      ctStmt.finalizeSync();

      // Restore Tags
      const tagStmt = db.prepareSync('INSERT OR REPLACE INTO tags (id, name, color) VALUES (?, ?, ?);');
      for (const t of data.tags) {
        tagStmt.executeSync([t.id, t.name, t.color]);
      }
      tagStmt.finalizeSync();

      // Restore Specimens
      const specStmt = db.prepareSync(`
        INSERT OR REPLACE INTO specimens (
          id, coin_type_id, custom_name, obverse_image_path, reverse_image_path,
          additional_images, acquisition_date, acquisition_price, acquisition_currency,
          acquisition_source, seller, auction_reference, user_grade, grading_service,
          certification_number, condition_notes, notes, is_favorite, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      for (const s of data.specimens) {
        specStmt.executeSync([
          s.id,
          s.coin_type_id,
          s.custom_name ?? null,
          s.obverse_image_path ?? null,
          s.reverse_image_path ?? null,
          typeof s.additional_images === 'string' ? s.additional_images : JSON.stringify(s.additional_images || []),
          s.acquisition_date ?? null,
          s.acquisition_price ?? null,
          s.acquisition_currency || 'USD',
          s.acquisition_source ?? null,
          s.seller ?? null,
          s.auction_reference ?? null,
          s.user_grade ?? null,
          s.grading_service || 'Raw',
          s.certification_number ?? null,
          s.condition_notes ?? null,
          s.notes ?? null,
          s.is_favorite ?? 0,
          s.created_at || new Date().toISOString(),
          s.updated_at || new Date().toISOString(),
        ]);
        specimensRestored++;
      }
      specStmt.finalizeSync();

      // Restore specimen_tags
      const stStmt = db.prepareSync('INSERT OR IGNORE INTO specimen_tags (specimen_id, tag_id) VALUES (?, ?);');
      for (const st of data.specimen_tags) {
        stStmt.executeSync([st.specimen_id, st.tag_id]);
      }
      stStmt.finalizeSync();

      // Restore Valuations
      const valStmt = db.prepareSync(`
        INSERT OR REPLACE INTO valuation_records (
          id, specimen_id, estimated_value_min, estimated_value_max, currency,
          valuation_type, source, comparable_sales, confidence, valuation_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      for (const v of data.valuation_records) {
        valStmt.executeSync([
          v.id,
          v.specimen_id,
          v.estimated_value_min,
          v.estimated_value_max,
          v.currency || 'USD',
          v.valuation_type || 'numismatic_market',
          v.source,
          typeof v.comparable_sales === 'string' ? v.comparable_sales : JSON.stringify(v.comparable_sales || []),
          v.confidence,
          v.valuation_date,
          v.notes ?? null,
        ]);
      }
      valStmt.finalizeSync();

      // Restore Conditions
      const condStmt = db.prepareSync(`
        INSERT OR REPLACE INTO condition_assessments (
          id, specimen_id, grading_system, estimated_grade, estimated_grade_min,
          estimated_grade_max, numerical_grade_min, numerical_grade_max, observations,
          confidence, assessment_provider, is_certified, explanation, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      for (const c of data.condition_assessments) {
        condStmt.executeSync([
          c.id,
          c.specimen_id,
          c.grading_system || 'sheldon_70',
          c.estimated_grade,
          c.estimated_grade_min ?? null,
          c.estimated_grade_max ?? null,
          c.numerical_grade_min ?? null,
          c.numerical_grade_max ?? null,
          typeof c.observations === 'string' ? c.observations : JSON.stringify(c.observations || []),
          c.confidence,
          c.assessment_provider,
          c.is_certified ?? 0,
          c.explanation ?? null,
          c.created_at,
        ]);
      }
      condStmt.finalizeSync();
    });

    return { success: true, specimensRestored };
  }
};
