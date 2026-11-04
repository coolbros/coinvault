export interface CoinType {
  id: string;
  country: string;
  denomination: string;
  year_start: number | null;
  year_end: number | null;
  ruler: string | null;
  mint: string | null;
  metal: string | null;
  coin_series: string | null;
  historical_period: string | null;
  catalog_references: string[]; // parsed from JSON
  obverse_description: string | null;
  reverse_description: string | null;
  shape: string | null;
  edge_type: string | null;
  diameter_mm: number | null;
  weight_g: number | null;
  is_reference_type: number; // 1 for catalog reference, 0 for user custom
  created_at: string;
  updated_at: string;
}

export interface Specimen {
  id: string;
  coin_type_id: string;
  custom_name: string | null;
  obverse_image_path: string | null;
  reverse_image_path: string | null;
  additional_images: string[]; // parsed from JSON
  acquisition_date: string | null;
  acquisition_price: number | null;
  acquisition_currency: string;
  acquisition_source: string | null;
  seller: string | null;
  auction_reference: string | null;
  user_grade: string | null;
  grading_service: string | null; // e.g., 'Raw', 'PCGS', 'NGC', 'ANACS'
  certification_number: string | null;
  condition_notes: string | null;
  notes: string | null;
  is_favorite: number; // 0 or 1
  created_at: string;
  updated_at: string;
  
  // Joined fields populated by repository queries
  coin_type?: CoinType;
  tags?: Tag[];
  latest_valuation?: ValuationRecord;
  latest_condition?: ConditionAssessment;
}

export interface CoinImage {
  id: string;
  specimen_id: string;
  image_path: string;
  image_side: 'obverse' | 'reverse' | 'edge' | 'detail';
  original_image_path: string | null;
  image_metadata: Record<string, any> | null;
  created_at: string;
}

export interface IdentificationRecord {
  id: string;
  specimen_id: string | null;
  model_provider: string;
  model_version: string;
  raw_response: string | null;
  normalized_result: Record<string, any>;
  confidence_scores: Record<string, number>;
  alternative_identifications: Record<string, any>[];
  uncertain_attributes: string[];
  user_confirmed: number;
  created_at: string;
}

export interface ConditionAssessment {
  id: string;
  specimen_id: string;
  grading_system: 'sheldon_70' | 'european' | 'adjectival';
  estimated_grade: string;
  estimated_grade_min: string | null;
  estimated_grade_max: string | null;
  numerical_grade_min: number | null;
  numerical_grade_max: number | null;
  observations: Array<{
    category: 'wear' | 'luster' | 'surface' | 'scratches' | 'cleaning' | 'strike';
    observation: string;
    severity?: 'minor' | 'moderate' | 'significant';
  }>;
  confidence: number;
  assessment_provider: string;
  is_certified: number;
  explanation: string | null;
  created_at: string;
}

export interface ValuationRecord {
  id: string;
  specimen_id: string;
  estimated_value_min: number;
  estimated_value_max: number;
  currency: string;
  valuation_type: 'numismatic_market' | 'intrinsic_metal' | 'auction_realized' | 'retail_asking';
  source: string;
  comparable_sales: Array<{
    date: string;
    price: number;
    grade: string;
    venue: string;
    url?: string;
  }>;
  confidence: number;
  valuation_date: string;
  notes: string | null;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface SpecimenTag {
  specimen_id: string;
  tag_id: string;
}

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS coin_types (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  denomination TEXT NOT NULL,
  year_start INTEGER,
  year_end INTEGER,
  ruler TEXT,
  mint TEXT,
  metal TEXT,
  coin_series TEXT,
  historical_period TEXT,
  catalog_references TEXT DEFAULT '[]',
  obverse_description TEXT,
  reverse_description TEXT,
  shape TEXT DEFAULT 'Round',
  edge_type TEXT DEFAULT 'Reeded',
  diameter_mm REAL,
  weight_g REAL,
  is_reference_type INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS specimens (
  id TEXT PRIMARY KEY,
  coin_type_id TEXT NOT NULL,
  custom_name TEXT,
  obverse_image_path TEXT,
  reverse_image_path TEXT,
  additional_images TEXT DEFAULT '[]',
  acquisition_date TEXT,
  acquisition_price REAL,
  acquisition_currency TEXT DEFAULT 'USD',
  acquisition_source TEXT,
  seller TEXT,
  auction_reference TEXT,
  user_grade TEXT,
  grading_service TEXT DEFAULT 'Raw',
  certification_number TEXT,
  condition_notes TEXT,
  notes TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (coin_type_id) REFERENCES coin_types(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS coin_images (
  id TEXT PRIMARY KEY,
  specimen_id TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_side TEXT NOT NULL,
  original_image_path TEXT,
  image_metadata TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (specimen_id) REFERENCES specimens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS identification_records (
  id TEXT PRIMARY KEY,
  specimen_id TEXT,
  model_provider TEXT NOT NULL,
  model_version TEXT NOT NULL,
  raw_response TEXT,
  normalized_result TEXT NOT NULL,
  confidence_scores TEXT NOT NULL,
  alternative_identifications TEXT DEFAULT '[]',
  uncertain_attributes TEXT DEFAULT '[]',
  user_confirmed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (specimen_id) REFERENCES specimens(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS condition_assessments (
  id TEXT PRIMARY KEY,
  specimen_id TEXT NOT NULL,
  grading_system TEXT NOT NULL DEFAULT 'sheldon_70',
  estimated_grade TEXT NOT NULL,
  estimated_grade_min TEXT,
  estimated_grade_max TEXT,
  numerical_grade_min INTEGER,
  numerical_grade_max INTEGER,
  observations TEXT DEFAULT '[]',
  confidence REAL NOT NULL,
  assessment_provider TEXT NOT NULL,
  is_certified INTEGER DEFAULT 0,
  explanation TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (specimen_id) REFERENCES specimens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS valuation_records (
  id TEXT PRIMARY KEY,
  specimen_id TEXT NOT NULL,
  estimated_value_min REAL NOT NULL,
  estimated_value_max REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  valuation_type TEXT NOT NULL DEFAULT 'numismatic_market',
  source TEXT NOT NULL,
  comparable_sales TEXT DEFAULT '[]',
  confidence REAL NOT NULL,
  valuation_date TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (specimen_id) REFERENCES specimens(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS specimen_tags (
  specimen_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (specimen_id, tag_id),
  FOREIGN KEY (specimen_id) REFERENCES specimens(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_specimens_coin_type ON specimens(coin_type_id);
CREATE INDEX IF NOT EXISTS idx_specimens_fav ON specimens(is_favorite);
CREATE INDEX IF NOT EXISTS idx_specimens_created ON specimens(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_types_country ON coin_types(country);
CREATE INDEX IF NOT EXISTS idx_coin_types_metal ON coin_types(metal);
CREATE INDEX IF NOT EXISTS idx_coin_types_period ON coin_types(historical_period);
CREATE INDEX IF NOT EXISTS idx_coin_types_ref ON coin_types(is_reference_type);
CREATE INDEX IF NOT EXISTS idx_valuation_specimen ON valuation_records(specimen_id);
CREATE INDEX IF NOT EXISTS idx_condition_specimen ON condition_assessments(specimen_id);
CREATE INDEX IF NOT EXISTS idx_images_specimen ON coin_images(specimen_id);
`;
