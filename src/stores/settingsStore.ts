import { create } from 'zustand';
import { secureStorage } from '../services/security/secureStorage';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD' | 'CHF';
export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark' | 'light';
export type GradingStandard = 'sheldon_70' | 'european' | 'adjectival';
export type AIProviderType = 'mock' | 'gemini';

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

  setCurrency: (currency: Currency) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDefaultGradingSystem: (standard: GradingStandard) => void;
  setAIProvider: (provider: AIProviderType) => void;
  setGeminiApiKey: (key: string) => Promise<void>;
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
