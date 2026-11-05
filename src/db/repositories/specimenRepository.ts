import { getDatabase } from '../client';
import { Specimen, CoinType, Tag, ValuationRecord, ConditionAssessment } from '../schema';
import { coinTypeRepository } from './coinTypeRepository';
import { tagRepository } from './tagRepository';
import { valuationRepository } from './valuationRepository';
import { conditionRepository } from './conditionRepository';

export interface CreateSpecimenInput {
  id?: string;
  coin_type_id: string;
  custom_name?: string | null;
  obverse_image_path?: string | null;
  reverse_image_path?: string | null;
  additional_images?: string[];
  acquisition_date?: string | null;
  acquisition_price?: number | null;
  acquisition_currency?: string;
  acquisition_source?: string | null;
  seller?: string | null;
  auction_reference?: string | null;
  user_grade?: string | null;
  grading_service?: string | null;
  certification_number?: string | null;
  condition_notes?: string | null;
  notes?: string | null;
  is_favorite?: number;
  tag_ids?: string[];
}

export interface SpecimenFilterOptions {
  search?: string;
  country?: string;
  metal?: string;
  denomination?: string;
  yearMin?: number;
  yearMax?: number;
  condition?: string;
  acquisitionSource?: string;
  valueMin?: number;
  valueMax?: number;
  tagId?: string;
  isFavorite?: boolean;
  sortBy?: 'created_at' | 'year' | 'value' | 'country' | 'denomination' | 'grade';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CollectionStatistics {
  totalSpecimens: number;
  uniqueCoinTypes: number;
  totalEstimatedValue: number;
  totalAcquisitionCost: number;
  countriesRepresented: number;
  mostRepresentedCountry: string | null;
  mostCommonDenomination: string | null;
  countryDistribution: Array<{ country: string; count: number; percentage: number }>;
  metalDistribution: Array<{ metal: string; count: number; percentage: number }>;
  periodDistribution: Array<{ period: string; count: number; percentage: number }>;
}

function parseSpecimenRow(row: any): Specimen {
  let additional_images = [];
  try {
    additional_images = row.additional_images ? JSON.parse(row.additional_images) : [];
  } catch {
    additional_images = [];
  }

  return {
    ...row,
    additional_images,
    is_favorite: row.is_favorite ?? 0,
  };
}

export const specimenRepository = {
  create(input: CreateSpecimenInput): Specimen {
    const db = getDatabase();
    const id = input.id || `spec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const additionalJson = JSON.stringify(input.additional_images || []);

    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO specimens (
          id, coin_type_id, custom_name, obverse_image_path, reverse_image_path,
          additional_images, acquisition_date, acquisition_price, acquisition_currency,
          acquisition_source, seller, auction_reference, user_grade, grading_service,
          certification_number, condition_notes, notes, is_favorite, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          input.coin_type_id,
          input.custom_name ?? null,
          input.obverse_image_path ?? null,
          input.reverse_image_path ?? null,
          additionalJson,
          input.acquisition_date ?? null,
          input.acquisition_price ?? null,
          input.acquisition_currency || 'USD',
          input.acquisition_source ?? null,
          input.seller ?? null,
          input.auction_reference ?? null,
          input.user_grade ?? null,
          input.grading_service || 'Raw',
          input.certification_number ?? null,
          input.condition_notes ?? null,
          input.notes ?? null,
          input.is_favorite ?? 0,
          now,
          now,
        ]
      );

      // Save specimen images to coin_images table if paths are provided
      if (input.obverse_image_path) {
        db.runSync(
          'INSERT INTO coin_images (id, specimen_id, image_path, image_side, created_at) VALUES (?, ?, ?, ?, ?);',
          [`img-${id}-obv`, id, input.obverse_image_path, 'obverse', now]
        );
      }
      if (input.reverse_image_path) {
        db.runSync(
          'INSERT INTO coin_images (id, specimen_id, image_path, image_side, created_at) VALUES (?, ?, ?, ?, ?);',
          [`img-${id}-rev`, id, input.reverse_image_path, 'reverse', now]
        );
      }

      // Associate tags
      if (input.tag_ids && input.tag_ids.length > 0) {
        const tagStmt = db.prepareSync('INSERT INTO specimen_tags (specimen_id, tag_id) VALUES (?, ?);');
        for (const tagId of input.tag_ids) {
          tagStmt.executeSync([id, tagId]);
        }
        tagStmt.finalizeSync();
      }
    });

    return this.getById(id)!;
  },

  getById(id: string): Specimen | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM specimens WHERE id = ?;', [id]);
    if (!row) return null;

    const specimen = parseSpecimenRow(row);
    specimen.coin_type = coinTypeRepository.getById(specimen.coin_type_id) ?? undefined;
    specimen.tags = tagRepository.getTagsForSpecimen(specimen.id);
    specimen.latest_valuation = valuationRepository.getLatestForSpecimen(specimen.id) ?? undefined;
    specimen.latest_condition = conditionRepository.getLatestForSpecimen(specimen.id) ?? undefined;

    return specimen;
  },

  update(id: string, updates: Partial<CreateSpecimenInput>): Specimen | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const now = new Date().toISOString();
    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.coin_type_id !== undefined) {
      fields.push('coin_type_id = ?');
      values.push(updates.coin_type_id);
    }
    if (updates.custom_name !== undefined) {
      fields.push('custom_name = ?');
      values.push(updates.custom_name);
    }
    if (updates.obverse_image_path !== undefined) {
      fields.push('obverse_image_path = ?');
      values.push(updates.obverse_image_path);
    }
    if (updates.reverse_image_path !== undefined) {
      fields.push('reverse_image_path = ?');
      values.push(updates.reverse_image_path);
    }
    if (updates.additional_images !== undefined) {
      fields.push('additional_images = ?');
      values.push(JSON.stringify(updates.additional_images));
    }
    if (updates.acquisition_date !== undefined) {
      fields.push('acquisition_date = ?');
      values.push(updates.acquisition_date);
    }
    if (updates.acquisition_price !== undefined) {
      fields.push('acquisition_price = ?');
      values.push(updates.acquisition_price);
    }
    if (updates.acquisition_currency !== undefined) {
      fields.push('acquisition_currency = ?');
      values.push(updates.acquisition_currency);
    }
    if (updates.acquisition_source !== undefined) {
      fields.push('acquisition_source = ?');
      values.push(updates.acquisition_source);
    }
    if (updates.seller !== undefined) {
      fields.push('seller = ?');
      values.push(updates.seller);
    }
    if (updates.auction_reference !== undefined) {
      fields.push('auction_reference = ?');
      values.push(updates.auction_reference);
    }
    if (updates.user_grade !== undefined) {
      fields.push('user_grade = ?');
      values.push(updates.user_grade);
    }
    if (updates.grading_service !== undefined) {
      fields.push('grading_service = ?');
      values.push(updates.grading_service);
    }
    if (updates.certification_number !== undefined) {
      fields.push('certification_number = ?');
      values.push(updates.certification_number);
    }
    if (updates.condition_notes !== undefined) {
      fields.push('condition_notes = ?');
      values.push(updates.condition_notes);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.is_favorite !== undefined) {
      fields.push('is_favorite = ?');
      values.push(updates.is_favorite);
    }

    values.push(id);

    db.withTransactionSync(() => {
      db.runSync(`UPDATE specimens SET ${fields.join(', ')} WHERE id = ?;`, values);

      if (updates.tag_ids !== undefined) {
        tagRepository.setSpecimenTags(id, updates.tag_ids);
      }
    });

    return this.getById(id);
  },

  delete(id: string): boolean {
    const db = getDatabase();
    // PRAGMA foreign_keys = ON ensures specimen_tags, coin_images, valuation_records,
    // condition_assessments cascade delete, but the related coin_type is NOT deleted.
    const result = db.runSync('DELETE FROM specimens WHERE id = ?;', [id]);
    return result.changes > 0;
  },

  bulkDelete(ids: string[]): number {
    const db = getDatabase();
    let totalDeleted = 0;
    db.withTransactionSync(() => {
      const stmt = db.prepareSync('DELETE FROM specimens WHERE id = ?;');
      for (const id of ids) {
        const res = stmt.executeSync([id]);
        totalDeleted += res.changes;
      }
      stmt.finalizeSync();
    });
    return totalDeleted;
  },

  duplicate(id: string): Specimen | null {
    const original = this.getById(id);
    if (!original) return null;

    const copyInput: CreateSpecimenInput = {
      coin_type_id: original.coin_type_id,
      custom_name: original.custom_name ? `${original.custom_name} (Copy)` : null,
      obverse_image_path: original.obverse_image_path,
      reverse_image_path: original.reverse_image_path,
      additional_images: [...original.additional_images],
      acquisition_date: new Date().toISOString().split('T')[0],
      acquisition_price: original.acquisition_price,
      acquisition_currency: original.acquisition_currency,
      acquisition_source: original.acquisition_source,
      seller: original.seller,
      auction_reference: original.auction_reference,
      user_grade: original.user_grade,
      grading_service: original.grading_service,
      certification_number: null,
      condition_notes: original.condition_notes,
      notes: original.notes ? `Duplicated from ${original.id}. ${original.notes}` : `Duplicated from ${original.id}`,
      is_favorite: 0,
      tag_ids: original.tags ? original.tags.map(t => t.id) : [],
    };

    return this.create(copyInput);
  },

  toggleFavorite(id: string): boolean {
    const db = getDatabase();
    const current = db.getFirstSync<{ is_favorite: number }>('SELECT is_favorite FROM specimens WHERE id = ?;', [id]);
    if (!current) return false;

    const newVal = current.is_favorite === 1 ? 0 : 1;
    db.runSync('UPDATE specimens SET is_favorite = ?, updated_at = ? WHERE id = ?;', [
      newVal,
      new Date().toISOString(),
      id,
    ]);
    return newVal === 1;
  },

  list(options: SpecimenFilterOptions = {}): Specimen[] {
    const db = getDatabase();
    let query = `
      SELECT s.*, 
             ct.country, ct.denomination, ct.year_start, ct.year_end, 
             ct.metal, ct.coin_series, ct.ruler, ct.mint, ct.historical_period,
             v.estimated_value_min, v.estimated_value_max
      FROM specimens s
      JOIN coin_types ct ON s.coin_type_id = ct.id
      LEFT JOIN valuation_records v ON v.id = (
        SELECT vr2.id
        FROM valuation_records vr2
        WHERE vr2.specimen_id = s.id
        ORDER BY vr2.valuation_date DESC
        LIMIT 1
      )
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (options.tagId) {
      query += ' JOIN specimen_tags st ON s.id = st.specimen_id AND st.tag_id = ? ';
      params.push(options.tagId);
    }

    if (options.search) {
      const term = `%${options.search.toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(ct.country) LIKE ? OR
        LOWER(ct.denomination) LIKE ? OR
        LOWER(IFNULL(ct.ruler, '')) LIKE ? OR
        LOWER(IFNULL(ct.mint, '')) LIKE ? OR
        LOWER(IFNULL(ct.coin_series, '')) LIKE ? OR
        LOWER(IFNULL(ct.metal, '')) LIKE ? OR
        LOWER(IFNULL(ct.historical_period, '')) LIKE ? OR
        LOWER(IFNULL(s.custom_name, '')) LIKE ? OR
        LOWER(IFNULL(s.notes, '')) LIKE ? OR
        LOWER(IFNULL(s.user_grade, '')) LIKE ?
      )`);
      params.push(term, term, term, term, term, term, term, term, term, term);
    }

    if (options.country) {
      whereClauses.push('LOWER(ct.country) = LOWER(?)');
      params.push(options.country);
    }

    if (options.metal) {
      whereClauses.push('LOWER(ct.metal) LIKE LOWER(?)');
      params.push(`%${options.metal}%`);
    }

    if (options.denomination) {
      whereClauses.push('LOWER(ct.denomination) = LOWER(?)');
      params.push(options.denomination);
    }

    if (options.yearMin !== undefined) {
      whereClauses.push('(ct.year_start >= ? OR ct.year_end >= ?)');
      params.push(options.yearMin, options.yearMin);
    }

    if (options.yearMax !== undefined) {
      whereClauses.push('(ct.year_start <= ? OR ct.year_end <= ?)');
      params.push(options.yearMax, options.yearMax);
    }

    if (options.condition) {
      whereClauses.push('LOWER(s.user_grade) LIKE LOWER(?)');
      params.push(`%${options.condition}%`);
    }

    if (options.acquisitionSource) {
      whereClauses.push('LOWER(s.acquisition_source) = LOWER(?)');
      params.push(options.acquisitionSource);
    }

    if (options.valueMin !== undefined) {
      whereClauses.push('v.estimated_value_max >= ?');
      params.push(options.valueMin);
    }

    if (options.valueMax !== undefined) {
      whereClauses.push('v.estimated_value_min <= ?');
      params.push(options.valueMax);
    }

    if (options.isFavorite) {
      whereClauses.push('s.is_favorite = 1');
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Sorting
    const sortField = options.sortBy || 'created_at';
    const sortDir = (options.sortOrder || 'desc').toUpperCase();

    switch (sortField) {
      case 'year':
        query += ` ORDER BY ct.year_start ${sortDir}, s.created_at DESC`;
        break;
      case 'value':
        query += ` ORDER BY v.estimated_value_max ${sortDir} NULLS LAST, s.created_at DESC`;
        break;
      case 'country':
        query += ` ORDER BY ct.country ${sortDir}, ct.denomination ASC`;
        break;
      case 'denomination':
        query += ` ORDER BY ct.denomination ${sortDir}, ct.country ASC`;
        break;
      case 'grade':
        query += ` ORDER BY s.user_grade ${sortDir} NULLS LAST, s.created_at DESC`;
        break;
      case 'created_at':
      default:
        query += ` ORDER BY s.created_at ${sortDir}`;
        break;
    }

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = db.getAllSync<any>(query, params);
    return rows.map(row => {
      const specimen = parseSpecimenRow(row);
      specimen.coin_type = coinTypeRepository.getById(specimen.coin_type_id) ?? undefined;
      specimen.tags = tagRepository.getTagsForSpecimen(specimen.id);
      specimen.latest_valuation = valuationRepository.getLatestForSpecimen(specimen.id) ?? undefined;
      specimen.latest_condition = conditionRepository.getLatestForSpecimen(specimen.id) ?? undefined;
      return specimen;
    });
  },

  getCollectionStatistics(): CollectionStatistics {
    const db = getDatabase();

    // 1. Total specimens count and unique coin types
    const basicStats = db.getFirstSync<{ total_specimens: number; unique_types: number; total_cost: number }>(`
      SELECT 
        COUNT(*) as total_specimens,
        COUNT(DISTINCT coin_type_id) as unique_types,
        SUM(IFNULL(acquisition_price, 0)) as total_cost
      FROM specimens;
    `) || { total_specimens: 0, unique_types: 0, total_cost: 0 };

    // 2. Total estimated value from latest valuations (optimized via composite index)
    const valueStat = db.getFirstSync<{ total_value: number }>(`
      SELECT SUM((v.estimated_value_min + v.estimated_value_max) / 2.0) as total_value
      FROM specimens s
      JOIN valuation_records v ON v.id = (
        SELECT vr2.id
        FROM valuation_records vr2
        WHERE vr2.specimen_id = s.id
        ORDER BY vr2.valuation_date DESC
        LIMIT 1
      );
    `);

    // 3. Country distribution
    const countryRows = db.getAllSync<{ country: string; count: number }>(`
      SELECT ct.country, COUNT(s.id) as count
      FROM specimens s
      JOIN coin_types ct ON s.coin_type_id = ct.id
      GROUP BY ct.country
      ORDER BY count DESC;
    `);

    // 4. Metal distribution
    const metalRows = db.getAllSync<{ metal: string; count: number }>(`
      SELECT IFNULL(ct.metal, 'Unknown') as metal, COUNT(s.id) as count
      FROM specimens s
      JOIN coin_types ct ON s.coin_type_id = ct.id
      GROUP BY ct.metal
      ORDER BY count DESC;
    `);

    // 5. Period distribution
    const periodRows = db.getAllSync<{ period: string; count: number }>(`
      SELECT IFNULL(ct.historical_period, 'Other') as period, COUNT(s.id) as count
      FROM specimens s
      JOIN coin_types ct ON s.coin_type_id = ct.id
      GROUP BY ct.historical_period
      ORDER BY count DESC;
    `);

    // 6. Most common denomination
    const denomRow = db.getFirstSync<{ denomination: string; count: number }>(`
      SELECT ct.denomination, COUNT(s.id) as count
      FROM specimens s
      JOIN coin_types ct ON s.coin_type_id = ct.id
      GROUP BY ct.denomination
      ORDER BY count DESC
      LIMIT 1;
    `);

    const total = basicStats.total_specimens;

    return {
      totalSpecimens: total,
      uniqueCoinTypes: basicStats.unique_types,
      totalEstimatedValue: valueStat?.total_value ?? 0,
      totalAcquisitionCost: basicStats.total_cost ?? 0,
      countriesRepresented: countryRows.length,
      mostRepresentedCountry: countryRows.length > 0 ? countryRows[0].country : null,
      mostCommonDenomination: denomRow ? denomRow.denomination : null,
      countryDistribution: countryRows.map(r => ({
        country: r.country,
        count: r.count,
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      })),
      metalDistribution: metalRows.map(r => ({
        metal: r.metal,
        count: r.count,
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      })),
      periodDistribution: periodRows.map(r => ({
        period: r.period,
        count: r.count,
        percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      })),
    };
  }
};
