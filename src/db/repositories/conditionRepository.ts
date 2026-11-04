import { getDatabase } from '../client';
import { ConditionAssessment } from '../schema';

export interface CreateConditionInput {
  id?: string;
  specimen_id: string;
  grading_system?: 'sheldon_70' | 'european' | 'adjectival';
  estimated_grade: string;
  estimated_grade_min?: string | null;
  estimated_grade_max?: string | null;
  numerical_grade_min?: number | null;
  numerical_grade_max?: number | null;
  observations?: Array<{
    category: 'wear' | 'luster' | 'surface' | 'scratches' | 'cleaning' | 'strike';
    observation: string;
    severity?: 'minor' | 'moderate' | 'significant';
  }>;
  confidence: number;
  assessment_provider: string;
  is_certified?: number;
  explanation?: string | null;
}

function parseRow(row: any): ConditionAssessment {
  let observations = [];
  try {
    observations = row.observations ? JSON.parse(row.observations) : [];
  } catch {
    observations = [];
  }
  return {
    ...row,
    observations,
    is_certified: row.is_certified ?? 0,
  };
}

export const conditionRepository = {
  create(input: CreateConditionInput): ConditionAssessment {
    const db = getDatabase();
    const id = input.id || `cond-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const observationsJson = JSON.stringify(input.observations || []);

    db.runSync(
      `INSERT INTO condition_assessments (
        id, specimen_id, grading_system, estimated_grade,
        estimated_grade_min, estimated_grade_max, numerical_grade_min,
        numerical_grade_max, observations, confidence, assessment_provider,
        is_certified, explanation, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        input.specimen_id,
        input.grading_system || 'sheldon_70',
        input.estimated_grade,
        input.estimated_grade_min ?? null,
        input.estimated_grade_max ?? null,
        input.numerical_grade_min ?? null,
        input.numerical_grade_max ?? null,
        observationsJson,
        input.confidence,
        input.assessment_provider,
        input.is_certified ?? 0,
        input.explanation ?? null,
        now,
      ]
    );

    return this.getById(id)!;
  },

  getById(id: string): ConditionAssessment | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>('SELECT * FROM condition_assessments WHERE id = ?;', [id]);
    return row ? parseRow(row) : null;
  },

  getLatestForSpecimen(specimenId: string): ConditionAssessment | null {
    const db = getDatabase();
    const row = db.getFirstSync<any>(
      'SELECT * FROM condition_assessments WHERE specimen_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1;',
      [specimenId]
    );
    return row ? parseRow(row) : null;
  },

  getHistoryForSpecimen(specimenId: string): ConditionAssessment[] {
    const db = getDatabase();
    const rows = db.getAllSync<any>(
      'SELECT * FROM condition_assessments WHERE specimen_id = ? ORDER BY created_at DESC;',
      [specimenId]
    );
    return rows.map(parseRow);
  }
};
