import { CoinValuationProvider } from '../ai/providerInterface';
import { ValuationInput, ValuationOutput } from '../ai/types';
import { useSettingsStore, DEFAULT_SPOT_PRICES } from '../../stores/settingsStore';

export class NumismaticValuationEngine implements CoinValuationProvider {
  providerName = 'CoinVault Global Numismatic Valuation Engine';

  async estimate(input: ValuationInput): Promise<ValuationOutput> {
    const currency = input.currency || 'USD';
    const metal = (input.metal || '').toLowerCase();
    const weight = input.weightG || 10.0;
    const grade = (input.grade || 'VF20').toUpperCase();

    // Get current configured or default spot prices
    let spotPrices = DEFAULT_SPOT_PRICES;
    try {
      const storePrices = useSettingsStore.getState().spotPrices;
      if (storePrices) {
        spotPrices = storePrices;
      }
    } catch {
      spotPrices = DEFAULT_SPOT_PRICES;
    }

    // 1. Calculate Intrinsic Precious Metal Bullion Value (Melt Value)
    let meltValue: number | null = null;
    if (metal.includes('gold')) {
      const purity = metal.includes('.900') ? 0.90 : metal.includes('22k') ? 0.9167 : 0.98;
      meltValue = Math.round(weight * purity * spotPrices.gold * 100) / 100;
    } else if (metal.includes('silver')) {
      const purity = metal.includes('.900') ? 0.90 : metal.includes('.925') ? 0.925 : 0.80;
      meltValue = Math.round(weight * purity * spotPrices.silver * 100) / 100;
    } else if (metal.includes('platinum')) {
      meltValue = Math.round(weight * 0.95 * spotPrices.platinum * 100) / 100;
    }

    // 2. Base Numismatic Value based on grade multiplier
    // Sheldon scale grade multiplier baseline
    let gradeMultiplier = 1.0;
    if (grade.startsWith('MS68') || grade.startsWith('MS69') || grade.startsWith('MS70')) {
      gradeMultiplier = 6.0;
    } else if (grade.startsWith('MS65') || grade.startsWith('MS66') || grade.startsWith('MS67')) {
      gradeMultiplier = 3.5;
    } else if (grade.startsWith('MS') || grade.includes('MINT') || grade.includes('UNC')) {
      gradeMultiplier = 2.4;
    } else if (grade.startsWith('AU')) {
      gradeMultiplier = 1.6;
    } else if (grade.startsWith('XF') || grade.startsWith('EF')) {
      gradeMultiplier = 1.25;
    } else if (grade.startsWith('VF')) {
      gradeMultiplier = 1.0;
    } else if (grade.startsWith('F')) {
      gradeMultiplier = 0.8;
    } else {
      gradeMultiplier = 0.6;
    }

    let baseNumismaticVal = 45;
    const coinTypeLower = (input.coinType || '').toLowerCase();
    const countryLower = (input.country || '').toLowerCase();

    if (countryLower.includes('india') && (input.denomination.includes('Rupee') || coinTypeLower.includes('rupee'))) {
      baseNumismaticVal = 60; // 1947 Rupee or British India series
    } else if (coinTypeLower.includes('morgan')) {
      baseNumismaticVal = 55;
    } else if (coinTypeLower.includes('sovereign')) {
      baseNumismaticVal = (meltValue || 650) * 1.08;
    } else if (coinTypeLower.includes('owl') || coinTypeLower.includes('denarius') || coinTypeLower.includes('athenian')) {
      baseNumismaticVal = 650;
    }

    const calculatedCenter = Math.max(
      baseNumismaticVal * gradeMultiplier,
      (meltValue || 0) * 1.12
    );

    const minVal = Math.round(calculatedCenter * 0.85);
    const maxVal = Math.round(calculatedCenter * 1.20);
    const numismaticPremium = meltValue ? Math.max(0, Math.round(calculatedCenter - meltValue)) : null;

    // Do NOT fabricate mock auction lots or claims of specific historical floor bids.
    // Instead, provide factual valuation transparency notes and empty or verified comps.
    const comparableSales: Array<{
      date: string;
      price: number;
      grade: string;
      venue: string;
      url?: string;
    }> = [];

    const caveats = [
      'Valuation represents an algorithmic collector range based on grade category and precious metal bullion content.',
      'Intrinsic metal melt value and numismatic collector premium are evaluated separately. Numismatic value may vary based on strike sharpness, toning, eye appeal, and certified third-party grading (PCGS/NGC).',
      'Dealer buy-back bids are typically 20-30% below retail fair market value.',
    ];

    return {
      estimatedValueMin: minVal,
      estimatedValueMax: maxVal,
      currency,
      valuationType: meltValue && meltValue > calculatedCenter * 0.8 ? 'intrinsic_metal' : 'numismatic_market',
      meltValue,
      numismaticPremium,
      confidence: 0.82,
      source: 'CoinVault Algorithmic Numismatic Valuation Model (Grade & Bullion Index)',
      valuationDate: new Date().toISOString().split('T')[0],
      comparableSales,
      caveats,
    };
  }
}

export const valuationEngine = new NumismaticValuationEngine();
