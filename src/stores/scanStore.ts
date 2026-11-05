import { create } from 'zustand';
import { CoinIdentificationResult, IdentificationInput } from '../services/ai/types';
import { QualityAssessment } from '../components/QualityIndicator';
import { imageQualityService } from '../services/ai/imageQuality';
import { mockIdentificationProvider } from '../services/ai/mockProvider';
import { GeminiCoinIdentificationProvider } from '../services/ai/geminiProvider';
import { useSettingsStore } from './settingsStore';
import { specimenIngestionService } from '../services/specimen/specimenIngestionService';
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
      const providerName =
        useSettingsStore.getState().aiProvider === 'gemini'
          ? 'Gemini 2.5 Flash'
          : 'Mock Numismatic Engine';

      const specimen = await specimenIngestionService.ingestFromScanResult(
        obverseImageUri,
        reverseImageUri,
        editableAttributes,
        identificationResult,
        userGrade,
        purchasePrice,
        notes,
        providerName
      );

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
      const specimen = await specimenIngestionService.ingestUnidentified(
        obverseImageUri,
        reverseImageUri,
        notes
      );

      get().clearScan();
      return specimen;
    } catch (err: any) {
      console.error('Failed to save unidentified specimen:', err);
      return null;
    }
  },
}));
