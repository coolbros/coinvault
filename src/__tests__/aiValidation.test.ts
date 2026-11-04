import {
  CoinIdentificationResultSchema,
  ConfidenceBreakdownSchema,
} from '../services/ai/types';
import { mockIdentificationProvider } from '../services/ai/mockProvider';

describe('AI Identification Schema & Confidence Validation', () => {
  test('Valid structured identification adheres strictly to schema', () => {
    const validData = {
      country: 'India',
      denomination: '1 Rupee',
      year: 1947,
      currency: 'Rupee',
      issuing_authority: 'King George VI',
      ruler: 'King George VI',
      mint: 'Bombay',
      mint_mark: 'Dot',
      metal: 'Nickel',
      coin_type: 'British India 1 Rupee',
      coin_series: 'George VI Series',
      historical_period: 'Colonial / Independence',
      shape: 'Round',
      edge_type: 'Security',
      catalog_references: ['KM# 559'],
      confidence: {
        overall: 0.94,
        country: 0.98,
        denomination: 0.95,
        year: 0.92,
        mint: 0.85,
      },
      alternative_identifications: [
        {
          country: 'India',
          denomination: '1/2 Rupee',
          year: 1947,
          coin_type: 'British India 1/2 Rupee',
          confidence: 0.05,
          distinguishing_features: 'Smaller diameter 24mm',
        },
      ],
      uncertain_attributes: [],
      numismatic_notes: 'High confidence attribution',
    };

    const parsed = CoinIdentificationResultSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.country).toBe('India');
      expect(parsed.data.year).toBe(1947);
      expect(parsed.data.confidence.overall).toBe(0.94);
    }
  });

  test('Rejects invalid payload when mandatory fields are missing', () => {
    const missingCountry = {
      denomination: '1 Rupee',
      year: 1947,
      coin_type: 'Unknown',
      confidence: {
        overall: 0.5,
        country: 0.0,
        denomination: 0.5,
        year: 0.5,
      },
    };

    const parsed = CoinIdentificationResultSchema.safeParse(missingCountry);
    expect(parsed.success).toBe(false);
  });

  test('Confidence score out of 0-1 range triggers validation error', () => {
    const invalidConfidence = {
      overall: 1.5, // Invalid > 1.0
      country: 0.9,
      denomination: 0.9,
      year: 0.8,
    };

    const parsed = ConfidenceBreakdownSchema.safeParse(invalidConfidence);
    expect(parsed.success).toBe(false);
  });

  test('Mock Identification Provider generates valid schema-compliant results', async () => {
    const result = await mockIdentificationProvider.identify({
      obverseImageUri: 'file:///tmp/mock_obverse.jpg',
      reverseImageUri: 'file:///tmp/mock_reverse.jpg',
      userHints: { countryHint: 'India' },
    });

    expect(result).toBeDefined();
    expect(result.country).toBe('India');
    expect(result.confidence.overall).toBeGreaterThan(0.8);
    expect(result.alternative_identifications).toBeInstanceOf(Array);
  });
});
