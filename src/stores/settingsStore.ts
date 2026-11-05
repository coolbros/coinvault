import { create } from 'zustand';
import { secureStorage } from '../services/security/secureStorage';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD' | 'CHF';
export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light';
export type GradingStandard = 'sheldon_70' | 'european' | 'adjectival';
export type AIProviderType = 'mock' | 'gemini';

export interface SpotPricesPerGram {
  gold: number;
  silver: number;
  platinum: number;
  palladium: number;
  copper: number;
}

export interface SettingsState {
  currency: Currency;
  currencySymbol: string;
  unitSystem: UnitSystem;
  themeMode: ThemeMode;
  defaultGradingSystem: GradingStandard;
  aiProvider: AIProviderType;
  geminiApiKey: string;
  hasSeenOnboarding: boolean;
  isKeyLoaded: boolean;
  spotPrices: SpotPricesPerGram;

  setCurrency: (currency: Currency) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDefaultGradingSystem: (standard: GradingStandard) => void;
  setAIProvider: (provider: AIProviderType) => void;
  setGeminiApiKey: (key: string) => Promise<void>;
  setSpotPrice: (metal: keyof SpotPricesPerGram, pricePerGram: number) => void;
  loadSecureSettings: () => Promise<void>;
  formatPrice: (amount: number | null | undefined) => string;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'AU$',
  CHF: 'CHF ',
};

export const DEFAULT_SPOT_PRICES: SpotPricesPerGram = {
  gold: 85.0,     // ~$2640 / troy oz
  silver: 1.05,   // ~$32.60 / troy oz
  platinum: 31.0,
  palladium: 33.0,
  copper: 0.01,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: 'USD',
  currencySymbol: '$',
  unitSystem: 'metric',
  themeMode: 'dark',
  defaultGradingSystem: 'sheldon_70',
  aiProvider: 'mock',
  geminiApiKey: '',
  hasSeenOnboarding: true,
  isKeyLoaded: false,
  spotPrices: { ...DEFAULT_SPOT_PRICES },

  setCurrency: (currency: Currency) => {
    set({ currency, currencySymbol: CURRENCY_SYMBOLS[currency] || '$' });
  },

  setUnitSystem: (unitSystem: UnitSystem) => set({ unitSystem }),
  setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
  setDefaultGradingSystem: (defaultGradingSystem: GradingStandard) => set({ defaultGradingSystem }),
  setAIProvider: (aiProvider: AIProviderType) => set({ aiProvider }),

  setGeminiApiKey: async (geminiApiKey: string) => {
    set({ geminiApiKey });
    try {
      if (geminiApiKey.trim()) {
        await secureStorage.setItem('gemini_api_key', geminiApiKey.trim());
      } else {
        await secureStorage.deleteItem('gemini_api_key');
      }
    } catch (err) {
      console.warn('Failed to persist Gemini API key to secure storage:', err);
    }
  },

  setSpotPrice: (metal, pricePerGram) => {
    set((state) => ({
      spotPrices: {
        ...state.spotPrices,
        [metal]: Math.max(0, pricePerGram),
      },
    }));
  },

  loadSecureSettings: async () => {
    try {
      const storedKey = await secureStorage.getItem('gemini_api_key');
      if (storedKey) {
        set({ geminiApiKey: storedKey, isKeyLoaded: true });
        return;
      }
    } catch (err) {
      console.warn('Failed to load Gemini API key from secure storage:', err);
    }
    set({ isKeyLoaded: true });
  },

  formatPrice: (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '—';
    }
    const symbol = get().currencySymbol;
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  },
}));
