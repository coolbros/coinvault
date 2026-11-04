import { getDatabase } from '../client';
import { ValuationRecord } from '../schema';

export interface CreateValuationInput {
  id?: string;
  specimen_id: string;
  estimated_value_min: number;
  estimated_value_max: number;
  currency?: string;
  valuation_type?: 'numismatic_market' | 'intrinsic_metal' | 'auction_realized' | 'retail_asking';
  source: string;
  comparable_sales?: Array<{
    date: string;
    price: number;
    grade: string;
    venue: string;
    url?: string;
  }>;
  confidence: number;
  valuation_date?: string;
  notes?: string | null;
}

function parseRow(row: any): ValuationRecord {
  let comparable_sales = [];
  try {
    comparable_sales = row.comparable_sales ? JSON.parse(row.comparable_sales) : [];
  } catch {
    comparable_sales = [];
  }
  return {
    ...row,
    comparable_sales,
  };
}

export const valuationRepository = {
  create(input: CreateValuationInput): ValuationRecord {
    const db = getDatabase();
    const id = input.id || `val-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const valuationDate = input.valuation_date || new Date().toISOString();
    const salesJson = JSON.stringify(input.comparable_sales || []);

    db.runSync(
      `INSERT INTO valuation_records (
        id, specimen_id, estimated_value_min, estimated_value_max,
        currency, valuation_type, source, comparable_sales, confidence,
        valuation_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.specimen_id,
        input.estimated_value_min,
        input.estimated_value_max,
        input.currency || 'USD',
        input.valuation_type || 'numismatic_market',
        input.source,
        salesJson,
        input.confidence,
        valuationDate,
        input.notes ?? null,
      ]
    );

    return this.getById(id)!;
  },

  getById(id: string): ValuationRecord | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM valuation_records WHERE id = ?;', [id]);
    return row ? parseRow(row) : null;
  },

  getLatestForSpecimen(specimenId: string): ValuationRecord | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      'SELECT * FROM valuation_records WHERE specimen_id = ? ORDER BY valuation_date DESC, rowid DESC LIMIT 1;',
      [specimenId]
    );
    return row ? parseRow(row) : null;
  },

  getHistoryForSpecimen(specimenId: string): ValuationRecord[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      'SELECT * FROM valuation_records WHERE specimen_id = ? ORDER BY valuation_date DESC;',
      [specimenId]
    );
    return rows.map(parseRow);
  }
};
