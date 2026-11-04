import { create } from 'zustand';
import { CoinIdentificationResult, IdentificationInput } from '../services/ai/types';
import { QualityAssessment } from '../components/QualityIndicator';
import { imageQualityService } from '../services/ai/imageQuality';
import { mockIdentificationProvider } from '../services/ai/mockProvider';
import { GeminiCoinIdentificationProvider } from '../services/ai/geminiProvider';
import { useSettingsStore } from './settingsStore';
import { coinTypeRepository } from '../db/repositories/coinTypeRepository';
import { specimenRepository } from '../db/repositories/specimenRepository';
import { valuationRepository } from '../db/repositories/valuationRepository';
import { conditionRepository } from '../db/repositories/conditionRepository';
import { identificationRepository } from '../db/repositories/identificationRepository';
import { imageStorage } from '../services/storage/imageStorage';
import { valuationEngine } from '../services/valuation/valuationEngine';
import { coinGradingService } from '../services/ai/gradingProvider';
import { Specimen } from '../db/schema';

export type ScanStep =
  | 'idle'
  | 'capturing_obverse'
  | 'capturing_reverse'
  | 'analyzing'
  | 'ready_to_confirm'
  | 'error';

export interface ScanState {
  step: ScanStep;
  obverseImageUri: string | null;
  reverseImageUri: string | null;
  qualityAssessment: QualityAssessment | null;
  identificationResult: CoinIdentificationResult | null;
  editableAttributes: Partial<CoinIdentificationResult>;
  isAnalyzing: boolean;
  errorMessage: string | null;

  // Actions
  setObverseImage: (uri: string) => Promise<void>;
  setReverseImage: (uri: string) => Promise<void>;
  clearScan: () => void;
  updateEditableAttribute: <K extends keyof CoinIdentificationResult>(
    key: K,
    value: CoinIdentificationResult[K]
  ) => void;
  selectAlternative: (alternativeIndex: number) => void;
  runIdentification: (userHints?: { countryHint?: string; yearHint?: number }) => Promise<CoinIdentificationResult | null>;
  confirmAndSaveSpecimen: (userGrade?: string, purchasePrice?: number, notes?: string) => Promise<Specimen | null>;
  saveAsUnidentifiedSpecimen: (notes?: string) => Promise<Specimen | null>;
}

export const useScanStore = create<ScanState>((set, get) => ({
  step: 'idle',
  obverseImageUri: null,
  reverseImageUri: null,
  qualityAssessment: null,
  identificationResult: null,
  editableAttributes: {},
  isAnalyzing: false,
  errorMessage: null,

  setObverseImage: async (uri: string) => {
    set({ obverseImageUri: uri, errorMessage: null });
    const assessment = await imageQualityService.assessQuality(uri);
    set({ qualityAssessment: assessment });
  },

  setReverseImage: async (uri: string) => {
    set({ reverseImageUri: uri });
    if (get().obverseImageUri) {
      const assessment = await imageQualityService.assessQuality(uri);
      set({ qualityAssessment: assessment });
    }
  },

  clearScan: () => {
    set({
      step: 'idle',
      obverseImageUri: null,
      reverseImageUri: null,
      qualityAssessment: null,
      identificationResult: null,
      editableAttributes: {},
      isAnalyzing: false,
      errorMessage: null,
    });
  },

  updateEditableAttribute: (key, value) => {
    set((state) => ({
      editableAttributes: {
        ...state.editableAttributes,
        [key]: value,
      },
    }));
  },

  selectAlternative: (index: number) => {
    const result = get().identificationResult;
    if (!result || !result.alternative_identifications[index]) return;

    const alt = result.alternative_identifications[index];
    set((state) => ({
      editableAttributes: {
        ...state.editableAttributes,
        country: alt.country,
        denomination: alt.denomination,
        year: alt.year,
        coin_type: alt.coin_type,
      },
    }));
  },

  runIdentification: async (userHints) => {
    const { obverseImageUri, reverseImageUri } = get();
    if (!obverseImageUri) {
      set({ errorMessage: 'Please capture or select an obverse photograph of the coin.' });
      return null;
    }

    set({ isAnalyzing: true, errorMessage: null, step: 'analyzing' });

    try {
      const settings = useSettingsStore.getState();
      let provider;

      if (settings.aiProvider === 'gemini' && settings.geminiApiKey) {
        provider = new GeminiCoinIdentificationProvider(settings.geminiApiKey);
      } else {
        provider = mockIdentificationProvider;
      }

      const input: IdentificationInput = {
        obverseImageUri,
        reverseImageUri,
        userHints,
      };

      const result = await provider.identify(input);

      set({
        identificationResult: result,
        editableAttributes: { ...result },
        isAnalyzing: false,
        step: 'ready_to_confirm',
      });

      return result;
    } catch (err: any) {
      console.error('Scan identification failed:', err);
      set({
        isAnalyzing: false,
        errorMessage: err.message || 'Failed to identify coin. You can still save it as an unidentified specimen.',
        step: 'error',
      });
      return null;
    }
  },

  confirmAndSaveSpecimen: async (userGrade, purchasePrice, notes) => {
    const { obverseImageUri, reverseImageUri, editableAttributes, identificationResult } = get();
    if (!obverseImageUri) return null;

    try {
      // 1. Copy photos to persistent storage
      const persistedObverse = await imageStorage.persistImage(obverseImageUri, 'obverse');
      const persistedReverse = reverseImageUri
        ? await imageStorage.persistImage(reverseImageUri, 'reverse')
        : null;

      // 2. Find or create CoinType
      const coinType = coinTypeRepository.findOrCreate({
        country: editableAttributes.country || 'Unknown',
        denomination: editableAttributes.denomination || 'Unknown',
        year_start: editableAttributes.year || editableAttributes.year_start || null,
        year_end: editableAttributes.year || editableAttributes.year_end || null,
        ruler: editableAttributes.ruler ?? null,
        mint: editableAttributes.mint ?? null,
        metal: editableAttributes.metal ?? null,
        coin_series: editableAttributes.coin_series ?? null,
        historical_period: editableAttributes.historical_period ?? null,
        catalog_references: editableAttributes.catalog_references || [],
        obverse_description: editableAttributes.obverse_description ?? null,
        reverse_description: editableAttributes.reverse_description ?? null,
        shape: editableAttributes.shape || 'Round',
        edge_type: editableAttributes.edge_type || 'Reeded',
        diameter_mm: editableAttributes.diameter_mm ?? null,
        weight_g: editableAttributes.weight_g ?? null,
        is_reference_type: 0,
      });

      // 3. Create Specimen
      const specimen = specimenRepository.create({
        coin_type_id: coinType.id,
        custom_name: editableAttributes.coin_type || `${coinType.country} ${coinType.denomination}`,
        obverse_image_path: persistedObverse,
        reverse_image_path: persistedReverse,
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_price: purchasePrice ?? null,
        acquisition_currency: useSettingsStore.getState().currency,
        acquisition_source: 'AI Scan & Attribution',
        user_grade: userGrade || 'AU50',
        notes: notes || editableAttributes.numismatic_notes || null,
      });

      // 4. Save Identification Record
      if (identificationResult) {
        identificationRepository.create({
          specimen_id: specimen.id,
          model_provider: useSettingsStore.getState().aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Mock Numismatic Engine',
          model_version: '1.0.0',
          normalized_result: editableAttributes,
          confidence_scores: identificationResult.confidence,
          alternative_identifications: identificationResult.alternative_identifications,
          uncertain_attributes: identificationResult.uncertain_attributes,
          user_confirmed: 1,
        });
      }

      // 5. Generate initial condition assessment
      const conditionRes = await coinGradingService.assess({
        obverseImageUri: persistedObverse,
        reverseImageUri: persistedReverse,
        coinType: coinType.denomination,
        year: coinType.year_start,
        metal: coinType.metal,
      });

      conditionRepository.create({
        specimen_id: specimen.id,
        grading_system: conditionRes.gradingSystem,
        estimated_grade: conditionRes.estimatedGrade,
        estimated_grade_min: conditionRes.estimatedGradeMin,
        estimated_grade_max: conditionRes.estimatedGradeMax,
        numerical_grade_min: conditionRes.numericalGradeMin,
        numerical_grade_max: conditionRes.numericalGradeMax,
        observations: conditionRes.observations,
        confidence: conditionRes.confidence,
        assessment_provider: coinGradingService.providerName,
        explanation: conditionRes.explanation,
      });

      // 6. Generate initial valuation
      const valRes = await valuationEngine.estimate({
        coinType: coinType.denomination,
        country: coinType.country,
        denomination: coinType.denomination,
        year: coinType.year_start,
        metal: coinType.metal,
        weightG: coinType.weight_g,
        grade: specimen.user_grade,
        currency: useSettingsStore.getState().currency,
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
        notes: valRes.caveats[0],
      });

      get().clearScan();
      return specimen;
    } catch (err: any) {
      console.error('Failed to confirm and save specimen:', err);
      set({ errorMessage: err.message || 'Failed to save specimen.' });
      return null;
    }
  },

  saveAsUnidentifiedSpecimen: async (notes) => {
    const { obverseImageUri, reverseImageUri } = get();
    if (!obverseImageUri) return null;

    try {
      const persistedObverse = await imageStorage.persistImage(obverseImageUri, 'obverse');
      const persistedReverse = reverseImageUri
        ? await imageStorage.persistImage(reverseImageUri, 'reverse')
        : null;

      const unkType = coinTypeRepository.findOrCreate({
        country: 'Unidentified Country',
        denomination: 'Unknown Specimen',
        is_reference_type: 0,
      });

      const specimen = specimenRepository.create({
        coin_type_id: unkType.id,
        custom_name: 'Unidentified Coin Specimen',
        obverse_image_path: persistedObverse,
        reverse_image_path: persistedReverse,
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_currency: useSettingsStore.getState().currency,
        acquisition_source: 'Unidentified Scan',
        notes: notes || 'Photographed for future research & identification.',
      });

      get().clearScan();
      return specimen;
    } catch (err: any) {
      console.error('Failed to save unidentified specimen:', err);
      return null;
    }
  },
}));
