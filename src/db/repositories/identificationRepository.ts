import { getDatabase } from '../client';
import { IdentificationRecord } from '../schema';

export interface CreateIdentificationInput {
  id?: string;
  specimen_id?: string | null;
  model_provider: string;
  model_version: string;
  raw_response?: string | null;
  normalized_result: Record<string, any>;
  confidence_scores: Record<string, number>;
  alternative_identifications?: Record<string, any>[];
  uncertain_attributes?: string[];
  user_confirmed?: number;
}

function parseRow(row: any): IdentificationRecord {
  let normalized_result = {};
  let confidence_scores = {};
  let alternative_identifications = [];
  let uncertain_attributes = [];

  try { normalized_result = row.normalized_result ? JSON.parse(row.normalized_result) : {}; } catch {}
  try { confidence_scores = row.confidence_scores ? JSON.parse(row.confidence_scores) : {}; } catch {}
  try { alternative_identifications = row.alternative_identifications ? JSON.parse(row.alternative_identifications) : []; } catch {}
  try { uncertain_attributes = row.uncertain_attributes ? JSON.parse(row.uncertain_attributes) : []; } catch {}

  return {
    ...row,
    normalized_result,
    confidence_scores,
    alternative_identifications,
    uncertain_attributes,
    user_confirmed: row.user_confirmed ?? 0,
  };
}

export const identificationRepository = {
  create(input: CreateIdentificationInput): IdentificationRecord {
    const db = getDatabase();
    const id = input.id || `idrec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    db.runSync(
      `INSERT INTO identification_records (
        id, specimen_id, model_provider, model_version,
        raw_response, normalized_result, confidence_scores,
        alternative_identifications, uncertain_attributes,
        user_confirmed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.specimen_id ?? null,
        input.model_provider,
        input.model_version,
        input.raw_response ?? null,
        JSON.stringify(input.normalized_result),
        JSON.stringify(input.confidence_scores),
        JSON.stringify(input.alternative_identifications || []),
        JSON.stringify(input.uncertain_attributes || []),
        input.user_confirmed ?? 0,
        now,
      ]
    );

    return this.getById(id)!;
  },

  getById(id: string): IdentificationRecord | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM identification_records WHERE id = ?;', [id]);
    return row ? parseRow(row) : null;
  },

  linkToSpecimen(id: string, specimenId: string): void {
    const db = getDatabase();
    db.runSync(
      'UPDATE identification_records SET specimen_id = ?, user_confirmed = 1 WHERE id = ?;',
      [specimenId, id]
    );
  },

  getBySpecimenId(specimenId: string): IdentificationRecord[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      'SELECT * FROM identification_records WHERE specimen_id = ? ORDER BY created_at DESC;',
      [specimenId]
    );
    return rows.map(parseRow);
  }
};
