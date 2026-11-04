import {
  CoinIdentificationProvider,
} from './providerInterface';
import {
  IdentificationInput,
  CoinIdentificationResult,
  CoinIdentificationResultSchema,
} from './types';
import { SEED_COIN_TYPES } from '../../db/seedData';

export class MockCoinIdentificationProvider implements CoinIdentificationProvider {
  providerName = 'Mock Numismatic AI Engine (Offline / Sandbox)';

  async identify(input: IdentificationInput): Promise<CoinIdentificationResult> {
    // Simulate real network/inference latency
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const countryHint = input.userHints?.countryHint?.toLowerCase();
    const yearHint = input.userHints?.yearHint;

    // Match candidate from curated numismatic knowledge base if hint or default
    let match = SEED_COIN_TYPES[0]; // Default: British India 1947 1 Rupee

    if (countryHint) {
      const found = SEED_COIN_TYPES.find(
        (c) => c.country.toLowerCase().includes(countryHint)
      );
      if (found) match = found;
    } else if (yearHint) {
      const found = SEED_COIN_TYPES.find(
        (c) => c.year_start <= yearHint && c.year_end >= yearHint
      );
      if (found) match = found;
    }

    const hasBothSides = !!input.reverseImageUri;
    const overallConfidence = hasBothSides ? 0.94 : 0.78;
    const yearConfidence = hasBothSides ? 0.92 : 0.72;

    const uncertainAttrs: string[] = [];
    if (!hasBothSides) {
      uncertainAttrs.push('mint_mark');
      uncertainAttrs.push('reverse_legend');
    }

    const alternatives = [
      {
        country: match.country,
        denomination: match.denomination,
        year: match.year_start - 1,
        coin_type: `${match.country} ${match.denomination} (Earlier Variety)`,
        confidence: 0.14,
        distinguishing_features: 'Varied mint mark placement or obverse portrait variety',
      },
    ];

    const result: CoinIdentificationResult = {
      country: match.country,
      denomination: match.denomination,
      year: match.year_start,
      year_start: match.year_start,
      year_end: match.year_end,
      currency: match.denomination.includes('Rupee') ? 'Rupee' : match.denomination.includes('Dollar') ? 'Dollar' : 'Standard Currency',
      issuing_authority: match.ruler || match.country,
      ruler: match.ruler || null,
      mint: match.mint ? match.mint.split('/')[0].trim() : null,
      mint_mark: hasBothSides ? (match.country === 'India' ? 'Dot / None' : 'P') : null,
      metal: match.metal,
      coin_type: `${match.country} ${match.denomination} (${match.year_start})`,
      coin_series: match.coin_series,
      historical_period: match.historical_period,
      shape: match.shape,
      edge_type: match.edge_type,
      diameter_mm: match.diameter_mm,
      weight_g: match.weight_g,
      obverse_description: match.obverse_description,
      reverse_description: match.reverse_description,
      catalog_references: match.catalog_references,
      confidence: {
        overall: overallConfidence,
        country: 0.98,
        denomination: 0.95,
        year: yearConfidence,
        mint: hasBothSides ? 0.85 : 0.40,
        metal: 0.92,
        series: 0.89,
      },
      alternative_identifications: alternatives,
      uncertain_attributes: uncertainAttrs,
      numismatic_notes: hasBothSides
        ? 'Identified with high confidence using obverse portrait and reverse reverse motifs.'
        : 'Single side captured: Reverse inscriptions were inferred. Verify reverse for definitive mint attribution.',
    };

    // Validate with Zod schema to ensure structural guarantee
    return CoinIdentificationResultSchema.parse(result);
  }
}

export const mockIdentificationProvider = new MockCoinIdentificationProvider();
