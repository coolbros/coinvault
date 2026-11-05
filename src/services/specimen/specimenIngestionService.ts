import { coinTypeRepository } from '../../db/repositories/coinTypeRepository';
import { specimenRepository } from '../../db/repositories/specimenRepository';
import { valuationRepository } from '../../db/repositories/valuationRepository';
import { conditionRepository } from '../../db/repositories/conditionRepository';
import { identificationRepository } from '../../db/repositories/identificationRepository';
import { tagRepository } from '../../db/repositories/tagRepository';
import { imageStorage } from '../storage/imageStorage';
import { valuationEngine } from '../valuation/valuationEngine';
import { coinGradingService } from '../ai/gradingProvider';
import { useSettingsStore } from '../../stores/settingsStore';
import { Specimen, CoinType } from '../../db/schema';
import { CoinIdentificationResult } from '../ai/types';

export interface IngestionCoinTypeInput {
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
  shape?: string;
  edge_type?: string;
  diameter_mm?: number | null;
  weight_g?: number | null;
  composition?: string | null;
  is_reference_type?: number;
}

export interface IngestionSpecimenInput {
  custom_name?: string | null;
  user_grade?: string | null;
  grading_service?: string | null;
  certification_number?: string | null;
  acquisition_date?: string | null;
  acquisition_price?: number | null;
  acquisition_currency?: string | null;
  acquisition_source?: string | null;
  seller?: string | null;
  auction_reference?: string | null;
  condition_notes?: string | null;
  notes?: string | null;
  is_favorite?: number;
  tagIds?: string[];
}

export interface IngestionIdentificationInput {
  providerName?: string;
  modelVersion?: string;
  normalizedResult: Record<string, any>;
  confidenceScores: Record<string, number>;
  alternativeIdentifications?: any[];
  uncertainAttributes?: string[];
  rawPayload?: string;
  userConfirmed?: boolean;
}

export interface IngestCoinOptions {
  obverseImageUri?: string | null;
  reverseImageUri?: string | null;
  coinType: IngestionCoinTypeInput;
  specimen?: IngestionSpecimenInput;
  identification?: IngestionIdentificationInput;
  runValuation?: boolean;
  runGrading?: boolean;
}

export class SpecimenIngestionService {
  /**
   * Unified entry point to ingest a coin into the collection.
   * Handles image persistence, CoinType resolution, Specimen record creation,
   * tag assignment, automated condition assessment, and market valuation.
   */
  async ingest(options: IngestCoinOptions): Promise<Specimen> {
    const {
      obverseImageUri,
      reverseImageUri,
      coinType: coinTypeInput,
      specimen: specimenInput = {},
      identification,
      runValuation = true,
      runGrading = true,
    } = options;

    const currentCurrency = useSettingsStore.getState().currency;

    // 1. Persist images to non-volatile local storage
    let persistedObverse: string | null = null;
    let persistedReverse: string | null = null;

    if (obverseImageUri) {
      persistedObverse = await imageStorage.persistImage(obverseImageUri, 'obverse');
    }
    if (reverseImageUri) {
      persistedReverse = await imageStorage.persistImage(reverseImageUri, 'reverse');
    }

    // 2. Find existing CoinType or create new classified entity
    const coinType: CoinType = coinTypeRepository.findOrCreate({
      country: coinTypeInput.country.trim() || 'Unknown',
      denomination: coinTypeInput.denomination.trim() || 'Unknown',
      year_start: coinTypeInput.year_start ?? null,
      year_end: coinTypeInput.year_end ?? null,
      ruler: coinTypeInput.ruler?.trim() || null,
      mint: coinTypeInput.mint?.trim() || null,
      metal: coinTypeInput.metal?.trim() || null,
      coin_series: coinTypeInput.coin_series?.trim() || null,
      historical_period: coinTypeInput.historical_period?.trim() || null,
      catalog_references: coinTypeInput.catalog_references || [],
      obverse_description: coinTypeInput.obverse_description?.trim() || null,
      reverse_description: coinTypeInput.reverse_description?.trim() || null,
      shape: coinTypeInput.shape || 'Round',
      edge_type: coinTypeInput.edge_type || 'Reeded',
      diameter_mm: coinTypeInput.diameter_mm ?? null,
      weight_g: coinTypeInput.weight_g ?? null,
      is_reference_type: coinTypeInput.is_reference_type ?? 0,
    });

    // 3. Create the physical Specimen entity
    const defaultName = coinType.year_start
      ? `${coinType.country} ${coinType.denomination} (${coinType.year_start})`
      : `${coinType.country} ${coinType.denomination}`;

    const specimen = specimenRepository.create({
      coin_type_id: coinType.id,
      custom_name: specimenInput.custom_name?.trim() || defaultName,
      obverse_image_path: persistedObverse,
      reverse_image_path: persistedReverse,
      acquisition_date: specimenInput.acquisition_date || new Date().toISOString().split('T')[0],
      acquisition_price: specimenInput.acquisition_price ?? null,
      acquisition_currency: specimenInput.acquisition_currency || currentCurrency,
      acquisition_source: specimenInput.acquisition_source || 'Collection Ingestion',
      seller: specimenInput.seller?.trim() || null,
      auction_reference: specimenInput.auction_reference?.trim() || null,
      user_grade: specimenInput.user_grade?.trim() || 'VF20',
      grading_service: specimenInput.grading_service || 'Raw',
      certification_number: specimenInput.certification_number?.trim() || null,
      condition_notes: specimenInput.condition_notes?.trim() || null,
      notes: specimenInput.notes?.trim() || null,
      is_favorite: specimenInput.is_favorite ?? 0,
    });

    // 4. Assign Tags if specified
    if (specimenInput.tagIds && specimenInput.tagIds.length > 0) {
      for (const tagId of specimenInput.tagIds) {
        tagRepository.assignToSpecimen(specimen.id, tagId);
      }
    }

    // 5. Persist AI identification provenance if available
    if (identification) {
      identificationRepository.create({
        specimen_id: specimen.id,
        model_provider: identification.providerName || 'CoinVault AI',
        model_version: identification.modelVersion || '1.0.0',
        raw_response: identification.rawPayload,
        normalized_result: identification.normalizedResult,
        confidence_scores: identification.confidenceScores,
        alternative_identifications: identification.alternativeIdentifications || [],
        uncertain_attributes: identification.uncertainAttributes || [],
        user_confirmed: identification.userConfirmed ? 1 : 0,
      });
    }

    // 6. Run automated condition assessment
    if (runGrading) {
      try {
        const conditionRes = await coinGradingService.assess({
          obverseImageUri: persistedObverse || '',
          reverseImageUri: persistedReverse || '',
          coinType: coinType.denomination,
          year: coinType.year_start,
          metal: coinType.metal,
        });

        conditionRepository.create({
          specimen_id: specimen.id,
          grading_system: conditionRes.gradingSystem,
          estimated_grade: specimen.user_grade || conditionRes.estimatedGrade,
          estimated_grade_min: conditionRes.estimatedGradeMin,
          estimated_grade_max: conditionRes.estimatedGradeMax,
          numerical_grade_min: conditionRes.numericalGradeMin,
          numerical_grade_max: conditionRes.numericalGradeMax,
          observations: conditionRes.observations,
          confidence: conditionRes.confidence,
          assessment_provider: coinGradingService.providerName,
          explanation: conditionRes.explanation,
        });
      } catch (err) {
        console.warn('[SpecimenIngestionService] Condition assessment failed:', err);
      }
    }

    // 7. Run initial market valuation estimate
    if (runValuation) {
      try {
        const valRes = await valuationEngine.estimate({
          coinType: coinType.denomination,
          country: coinType.country,
          denomination: coinType.denomination,
          year: coinType.year_start,
          metal: coinType.metal,
          weightG: coinType.weight_g,
          grade: specimen.user_grade,
          currency: currentCurrency,
        });

        valuationRepository.create({
          specimen_id: specimen.id,
          estimated_value_min: valRes.estimatedValueMin,
          estimated_value_max: valRes.estimatedValueMax,
          currency: valRes.currency,
          valuation_type: valRes.valuationType,
          source: valRes.source,
          comparable_sales: valRes.comparableSales,
          confidence: valRes.confidence,
          valuation_date: valRes.valuationDate,
          notes: valRes.caveats[0] || null,
        });
      } catch (err) {
        console.warn('[SpecimenIngestionService] Valuation estimate failed:', err);
      }
    }

    // Return the hydrated specimen with its relations
    const hydrated = specimenRepository.getById(specimen.id);
    return hydrated || specimen;
  }

  /**
   * Helper to ingest from an AI scan confirmation flow.
   */
  async ingestFromScanResult(
    obverseUri: string,
    reverseUri: string | null,
    attributes: Partial<CoinIdentificationResult>,
    identificationResult: CoinIdentificationResult | null,
    userGrade?: string,
    purchasePrice?: number,
    notes?: string,
    providerName: string = 'Gemini 2.5 Flash'
  ): Promise<Specimen> {
    const yearStart = attributes.year || attributes.year_start || null;
    const yearEnd = attributes.year || attributes.year_end || null;

    return this.ingest({
      obverseImageUri: obverseUri,
      reverseImageUri: reverseUri,
      coinType: {
        country: attributes.country || 'Unknown',
        denomination: attributes.denomination || 'Unknown',
        year_start: yearStart,
        year_end: yearEnd,
        ruler: attributes.ruler ?? null,
        mint: attributes.mint ?? null,
        metal: attributes.metal ?? null,
        coin_series: attributes.coin_series ?? null,
        historical_period: attributes.historical_period ?? null,
        catalog_references: attributes.catalog_references || [],
        obverse_description: attributes.obverse_description ?? null,
        reverse_description: attributes.reverse_description ?? null,
        shape: attributes.shape || 'Round',
        edge_type: attributes.edge_type || 'Reeded',
        diameter_mm: attributes.diameter_mm ?? null,
        weight_g: attributes.weight_g ?? null,
        is_reference_type: 0,
      },
      specimen: {
        custom_name: attributes.coin_type || `${attributes.country || 'Unknown'} ${attributes.denomination || 'Coin'}`,
        user_grade: userGrade || 'AU50',
        acquisition_price: purchasePrice ?? null,
        acquisition_source: 'AI Scan & Attribution',
        notes: notes || attributes.numismatic_notes || null,
      },
      identification: identificationResult
        ? {
            providerName,
            modelVersion: '1.0.0',
            normalizedResult: attributes,
            confidenceScores: identificationResult.confidence,
            alternativeIdentifications: identificationResult.alternative_identifications,
            uncertainAttributes: identificationResult.uncertain_attributes,
            userConfirmed: true,
          }
        : undefined,
      runGrading: true,
      runValuation: true,
    });
  }

  /**
   * Helper to ingest an unidentified specimen quickly from the scanner.
   */
  async ingestUnidentified(
    obverseUri: string,
    reverseUri: string | null,
    notes?: string
  ): Promise<Specimen> {
    return this.ingest({
      obverseImageUri: obverseUri,
      reverseImageUri: reverseUri,
      coinType: {
        country: 'Unidentified',
        denomination: 'Unknown Specimen',
        year_start: null,
        year_end: null,
        is_reference_type: 0,
      },
      specimen: {
        custom_name: `Unidentified Coin #${Date.now().toString().slice(-4)}`,
        user_grade: 'Ungraded',
        acquisition_source: 'Unidentified Scan',
        notes: notes || 'Pending numismatic attribution.',
      },
      runGrading: false,
      runValuation: false,
    });
  }
}

export const specimenIngestionService = new SpecimenIngestionService();
