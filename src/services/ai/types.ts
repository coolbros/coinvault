import { z } from 'zod';

export const ConfidenceBreakdownSchema = z.object({
  overall: z.number().min(0).max(1),
  country: z.number().min(0).max(1),
  denomination: z.number().min(0).max(1),
  year: z.number().min(0).max(1),
  mint: z.number().min(0).max(1).optional(),
  metal: z.number().min(0).max(1).optional(),
  series: z.number().min(0).max(1).optional(),
});

export const AlternativeCandidateSchema = z.object({
  country: z.string(),
  denomination: z.string(),
  year: z.number().nullable(),
  coin_type: z.string(),
  confidence: z.number().min(0).max(1),
  distinguishing_features: z.string(),
});

export const CoinIdentificationResultSchema = z.object({
  country: z.string(),
  denomination: z.string(),
  year: z.number().nullable(),
  year_start: z.number().nullable().optional(),
  year_end: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  issuing_authority: z.string().nullable().optional(),
  ruler: z.string().nullable(),
  mint: z.string().nullable(),
  mint_mark: z.string().nullable().optional(),
  metal: z.string().nullable(),
  coin_type: z.string(),
  coin_series: z.string().nullable().optional(),
  historical_period: z.string().nullable().optional(),
  shape: z.string().default('Round'),
  edge_type: z.string().default('Reeded'),
  diameter_mm: z.number().nullable().optional(),
  weight_g: z.number().nullable().optional(),
  obverse_description: z.string().nullable().optional(),
  reverse_description: z.string().nullable().optional(),
  catalog_references: z.array(z.string()).default([]),
  confidence: ConfidenceBreakdownSchema,
  alternative_identifications: z.array(AlternativeCandidateSchema).default([]),
  uncertain_attributes: z.array(z.string()).default([]),
  numismatic_notes: z.string().nullable().optional(),
});

export type ConfidenceBreakdown = z.infer<typeof ConfidenceBreakdownSchema>;
export type AlternativeCandidate = z.infer<typeof AlternativeCandidateSchema>;
export type CoinIdentificationResult = z.infer<typeof CoinIdentificationResultSchema>;

export interface IdentificationInput {
  obverseImageUri: string;
  reverseImageUri?: string | null;
  userHints?: {
    countryHint?: string;
    yearHint?: number;
    notes?: string;
  };
}

export interface CoinGradingInput {
  obverseImageUri: string;
  reverseImageUri?: string | null;
  coinType: string;
  year?: number | null;
  metal?: string | null;
}

export interface ConditionAssessmentOutput {
  gradingSystem: 'sheldon_70' | 'european' | 'adjectival';
  estimatedGrade: string; // e.g. "AU55" or "XF40-AU50"
  estimatedGradeMin: string;
  estimatedGradeMax: string;
  numericalGradeMin: number;
  numericalGradeMax: number;
  observations: Array<{
    category: 'wear' | 'luster' | 'surface' | 'scratches' | 'cleaning' | 'strike';
    observation: string;
    severity?: 'minor' | 'moderate' | 'significant';
  }>;
  confidence: number;
  explanation: string;
  disclaimer: string;
}

export interface ValuationInput {
  coinType: string;
  country: string;
  denomination: string;
  year?: number | null;
  mint?: string | null;
  metal?: string | null;
  weightG?: number | null;
  grade?: string | null;
  currency?: string;
}

export interface ValuationOutput {
  estimatedValueMin: number;
  estimatedValueMax: number;
  currency: string;
  valuationType: 'numismatic_market' | 'intrinsic_metal' | 'auction_realized' | 'retail_asking';
  meltValue: number | null;
  numismaticPremium: number | null;
  confidence: number;
  source: string;
  valuationDate: string;
  comparableSales: Array<{
    date: string;
    price: number;
    grade: string;
    venue: string;
    url?: string;
  }>;
  caveats: string[];
}
