import {
  IdentificationInput,
  CoinIdentificationResult,
  CoinGradingInput,
  ConditionAssessmentOutput,
  ValuationInput,
  ValuationOutput,
} from './types';
import { QualityAssessment } from '../../components/QualityIndicator';
import { CoinType } from '../../db/schema';

export interface CoinIdentificationProvider {
  providerName: string;
  identify(input: IdentificationInput): Promise<CoinIdentificationResult>;
}

export interface ImageQualityProvider {
  assessQuality(imageUri: string): Promise<QualityAssessment>;
}

export interface CoinGradingProvider {
  providerName: string;
  assess(input: CoinGradingInput): Promise<ConditionAssessmentOutput>;
}

export interface CoinValuationProvider {
  providerName: string;
  estimate(input: ValuationInput): Promise<ValuationOutput>;
}

export interface CoinReferenceProvider {
  searchCatalog(query: string): Promise<CoinType[]>;
  getByCatalogId(catalogId: string): Promise<CoinType | null>;
}
