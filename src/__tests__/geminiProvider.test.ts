import {
  GeminiCoinIdentificationProvider,
  GeminiAuthError,
  GeminiRateLimitError,
  GeminiServiceError,
  GeminiParsingError,
} from '../services/ai/geminiProvider';

describe('GeminiCoinIdentificationProvider Error Handling & Resilience', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('throws GeminiAuthError when API key is missing or empty', async () => {
    const provider = new GeminiCoinIdentificationProvider('');
    await expect(
      provider.identify({
        obverseImageUri: 'file:///mock/coin.jpg',
      })
    ).rejects.toThrow(GeminiAuthError);
  });

  it('throws GeminiAuthError on 401 Unauthorized HTTP response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'API key not valid. Please pass a valid API key.',
    } as any);

    const provider = new GeminiCoinIdentificationProvider('invalid-key');
    await expect(
      provider.identify({
        obverseImageUri: 'file:///mock/coin.jpg',
      })
    ).rejects.toThrow(GeminiAuthError);
  });

  it('throws GeminiRateLimitError on 429 Too Many Requests response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Resource exhausted: rate limit exceeded.',
    } as any);

    const provider = new GeminiCoinIdentificationProvider('valid-key');
    await expect(
      provider.identify({
        obverseImageUri: 'file:///mock/coin.jpg',
      })
    ).rejects.toThrow(GeminiRateLimitError);
  });

  it('throws GeminiServiceError on 503 Service Unavailable response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'The model is overloaded. Please try again later.',
    } as any);

    const provider = new GeminiCoinIdentificationProvider('valid-key');
    await expect(
      provider.identify({
        obverseImageUri: 'file:///mock/coin.jpg',
      })
    ).rejects.toThrow(GeminiServiceError);
  });

  it('throws GeminiParsingError when response body is not valid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Sorry, I could not identify this coin because it is blurry.' }],
            },
          },
        ],
      }),
    } as any);

    const provider = new GeminiCoinIdentificationProvider('valid-key');
    await expect(
      provider.identify({
        obverseImageUri: 'file:///mock/coin.jpg',
      })
    ).rejects.toThrow(GeminiParsingError);
  });

  it('successfully parses valid Gemini JSON candidate matching schema', async () => {
    const validJson = {
      country: 'India',
      denomination: '1 Rupee',
      year: 1947,
      year_start: 1947,
      year_end: 1947,
      currency: 'INR',
      issuing_authority: 'Government of India',
      ruler: 'George VI',
      mint: 'Bombay',
      mint_mark: 'Dot',
      metal: 'Nickel',
      coin_type: '1947 Indian Rupee (Last British India Issue)',
      coin_series: 'British India King George VI',
      historical_period: 'Dominion Transition',
      shape: 'Round',
      edge_type: 'Security',
      diameter_mm: 28.0,
      weight_g: 11.66,
      obverse_description: 'Crowned bust of George VI facing left',
      reverse_description: 'Indian tiger walking left with denomination in English and Urdu',
      catalog_references: ['KM# 559'],
      confidence: {
        overall: 0.95,
        country: 0.99,
        denomination: 0.98,
        year: 0.97,
        mint: 0.92,
        metal: 0.95,
        series: 0.94,
      },
      alternative_identifications: [],
      uncertain_attributes: [],
      numismatic_notes: 'Iconic final British India one rupee issue minted in pure nickel.',
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(validJson) }],
            },
          },
        ],
      }),
    } as any);

    const provider = new GeminiCoinIdentificationProvider('valid-key');
    const result = await provider.identify({
      obverseImageUri: 'file:///mock/coin.jpg',
    });

    expect(result.country).toBe('India');
    expect(result.denomination).toBe('1 Rupee');
    expect(result.year).toBe(1947);
    expect(result.confidence.overall).toBe(0.95);
  });
});
