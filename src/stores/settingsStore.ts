import { create } from 'zustand';

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

  setCurrency: (currency: Currency) => void;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDefaultGradingSystem: (standard: GradingStandard) => void;
  setAIProvider: (provider: AIProviderType) => void;
  setGeminiApiKey: (key: string) => void;
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

  setCurrency: (currency: Currency) => {
    set({ currency, currencySymbol: CURRENCY_SYMBOLS[currency] || '$' });
  },

  setUnitSystem: (unitSystem: UnitSystem) => set({ unitSystem }),
  setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
  setDefaultGradingSystem: (defaultGradingSystem: GradingStandard) => set({ defaultGradingSystem }),
  setAIProvider: (aiProvider: AIProviderType) => set({ aiProvider }),
  setGeminiApiKey: (geminiApiKey: string) => set({ geminiApiKey }),

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
