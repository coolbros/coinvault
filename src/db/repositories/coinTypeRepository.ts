import { getDatabase } from '../client';
import { CoinType } from '../schema';

export interface CreateCoinTypeInput {
  id?: string;
  country: string;
  denomination: string;
  year_start?: number | null;
  year_end?: number | null;
  ruler?: string | null;
  mint?: string | null;
  metal?: string | null;
  coin_series?: string | null;
  historical_period?: string | null;
  catalog_references?: string[];
  obverse_description?: string | null;
  reverse_description?: string | null;
  shape?: string | null;
  edge_type?: string | null;
  diameter_mm?: number | null;
  weight_g?: number | null;
  is_reference_type?: number;
}

function parseRow(row: any): CoinType {
  let catalog_references: string[] = [];
  try {
    catalog_references = row.catalog_references ? JSON.parse(row.catalog_references) : [];
  } catch {
    catalog_references = [];
  }

  return {
    ...row,
    catalog_references,
    is_reference_type: row.is_reference_type ?? 0,
  };
}

export const coinTypeRepository = {
  create(input: CreateCoinTypeInput): CoinType {
    const db = getDatabase();
    const id = input.id || `ct-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const catalogJson = JSON.stringify(input.catalog_references || []);

    db.runSync(
      `INSERT INTO coin_types (
        id, country, denomination, year_start, year_end, ruler, mint, metal,
        coin_series, historical_period, catalog_references, obverse_description,
        reverse_description, shape, edge_type, diameter_mm, weight_g,
        is_reference_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.country,
        input.denomination,
        input.year_start ?? null,
        input.year_end ?? null,
        input.ruler ?? null,
        input.mint ?? null,
        input.metal ?? null,
        input.coin_series ?? null,
        input.historical_period ?? null,
        catalogJson,
        input.obverse_description ?? null,
        input.reverse_description ?? null,
        input.shape ?? 'Round',
        input.edge_type ?? 'Reeded',
        input.diameter_mm ?? null,
        input.weight_g ?? null,
        input.is_reference_type ?? 0,
        now,
        now,
      ]
    );

    return this.getById(id)!;
  },

  getById(id: string): CoinType | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM coin_types WHERE id = ?;', [id]);
    return row ? parseRow(row) : null;
  },

  findExisting(country: string, denomination: string, year?: number | null): CoinType | null {
    const db = getDatabase();
    let query = 'SELECT * FROM coin_types WHERE LOWER(country) = LOWER(?) AND LOWER(denomination) = LOWER(?)';
    const params: any[] = [country, denomination];

    if (year !== undefined && year !== null) {
      query += ' AND (year_start IS NULL OR (year_start <= ? AND (year_end IS NULL OR year_end >= ?)))';
      params.push(year, year);
    }
    query += ' LIMIT 1;';

    const row = db.getFirstSync<any>(query, params);
    return row ? parseRow(row) : null;
  },

  findOrCreate(input: CreateCoinTypeInput): CoinType {
    const existing = this.findExisting(input.country, input.denomination, input.year_start);
    if (existing) {
      return existing;
    }
    return this.create(input);
  },

  listAll(options?: { isReferenceOnly?: boolean; country?: string; metal?: string }): CoinType[] {
    const db = getDatabase();
    let query = 'SELECT * FROM coin_types WHERE 1=1';
    const params: any[] = [];

    if (options?.isReferenceOnly) {
      query += ' AND is_reference_type = 1';
    }
    if (options?.country) {
      query += ' AND LOWER(country) = LOWER(?)';
      params.push(options.country);
    }
    if (options?.metal) {
      query += ' AND LOWER(metal) LIKE LOWER(?)';
      params.push(`%${options.metal}%`);
    }

    query += ' ORDER BY country ASC, year_start ASC;';
    const rows = db.getAllSync<any>(query, params);
    return rows.map(parseRow);
  },

  search(searchTerm: string): CoinType[] {
    const db = getDatabase();
    const term = `%${searchTerm.toLowerCase()}%`;
    const rows = db.getAllSync<any>(
      `SELECT * FROM coin_types WHERE 
        LOWER(country) LIKE ? OR
        LOWER(denomination) LIKE ? OR
        LOWER(ruler) LIKE ? OR
        LOWER(coin_series) LIKE ? OR
        LOWER(historical_period) LIKE ? OR
        LOWER(catalog_references) LIKE ?
      ORDER BY country ASC, year_start ASC LIMIT 50;`,
      [term, term, term, term, term, term]
    );
    return rows.map(parseRow);
  },

  count(): number {
    const db = getDatabase();
    const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM coin_types;');
    return row?.count ?? 0;
  }
};
