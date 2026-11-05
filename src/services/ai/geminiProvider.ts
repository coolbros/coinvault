import * as FileSystem from 'expo-file-system/legacy';
import { CoinIdentificationProvider } from './providerInterface';
import {
  IdentificationInput,
  CoinIdentificationResult,
  CoinIdentificationResultSchema,
} from './types';
import { imageProcessor } from '../image/imageProcessor';

export class GeminiAuthError extends Error {
  constructor(message = 'Gemini API key is invalid or unauthorized (401). Please verify your API key in Settings.') {
    super(message);
    this.name = 'GeminiAuthError';
  }
}

export class GeminiRateLimitError extends Error {
  constructor(message = 'Gemini API rate limit or quota exceeded (429). Please wait a moment before analyzing another coin.') {
    super(message);
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiServiceError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'GeminiServiceError';
  }
}

export class GeminiParsingError extends Error {
  constructor(message: string, public readonly rawText?: string) {
    super(message);
    this.name = 'GeminiParsingError';
  }
}

export class GeminiCoinIdentificationProvider implements CoinIdentificationProvider {
  providerName = 'Google Gemini 2.5 Flash Multimodal Vision API';
  private apiKey: string;
  private timeoutMs: number;

  constructor(apiKey: string, timeoutMs = 25000) {
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async identify(input: IdentificationInput): Promise<CoinIdentificationResult> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new GeminiAuthError(
        'Gemini API Key is not configured. Please enter your Gemini API key in Settings or switch to the Sandbox Provider.'
      );
    }

    const parts: any[] = [];

    // System prompt for numismatic precision
    const systemPrompt = `You are a world-class numismatic computer vision expert.
Identify the physical coin shown in the provided photograph(s).
Follow strict numismatic rules:
1. Never invent catalog references or mint marks. If not clearly visible or established, return null or empty array.
2. Return confidence scores between 0.0 and 1.0 for each attribute.
3. If only one side (e.g. obverse) is provided, acknowledge that mint mark or reverse details might be uncertain.
4. Output must be strictly valid JSON matching this schema:
{
  "country": string,
  "denomination": string,
  "year": number or null,
  "year_start": number or null,
  "year_end": number or null,
  "currency": string or null,
  "issuing_authority": string or null,
  "ruler": string or null,
  "mint": string or null,
  "mint_mark": string or null,
  "metal": string or null,
  "coin_type": string,
  "coin_series": string or null,
  "historical_period": string or null,
  "shape": string,
  "edge_type": string,
  "diameter_mm": number or null,
  "weight_g": number or null,
  "obverse_description": string or null,
  "reverse_description": string or null,
  "catalog_references": string[],
  "confidence": {
    "overall": number,
    "country": number,
    "denomination": number,
    "year": number,
    "mint": number,
    "metal": number,
    "series": number
  },
  "alternative_identifications": [
    {
      "country": string,
      "denomination": string,
      "year": number or null,
      "coin_type": string,
      "confidence": number,
      "distinguishing_features": string
    }
  ],
  "uncertain_attributes": string[],
  "numismatic_notes": string or null
}`;

    parts.push({ text: systemPrompt });

    if (input.userHints) {
      parts.push({
        text: `User notes or hints: Country hint: ${input.userHints.countryHint || 'none'}, Year hint: ${input.userHints.yearHint || 'none'}`
      });
    }

    // Downscale obverse image for fast network transmission & memory safety
    const optimizedObverseUri = await imageProcessor.prepareForInference(input.obverseImageUri);

    try {
      if (optimizedObverseUri.startsWith('data:')) {
        const [meta, data] = optimizedObverseUri.split(',');
        const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType,
            data,
          },
        });
      } else {
        const base64Obverse = await FileSystem.readAsStringAsync(optimizedObverseUri, {
          encoding: 'base64',
        });
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Obverse,
          },
        });
      }

      // Convert reverse image if provided
      if (input.reverseImageUri) {
        const optimizedReverseUri = await imageProcessor.prepareForInference(input.reverseImageUri);
        if (optimizedReverseUri.startsWith('data:')) {
          const [meta, data] = optimizedReverseUri.split(',');
          const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg';
          parts.push({
            inlineData: {
              mimeType,
              data,
            },
          });
        } else {
          const base64Reverse = await FileSystem.readAsStringAsync(optimizedReverseUri, {
            encoding: 'base64',
          });
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Reverse,
            },
          });
        }
      }
    } catch (readErr) {
      throw new GeminiServiceError(
        `Failed to process coin photograph for AI identification: ${(readErr as Error).message}`
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new GeminiServiceError(`Gemini API request timed out after ${this.timeoutMs / 1000} seconds. Check your internet connection.`);
      }
      throw new GeminiServiceError(`Network error communicating with Gemini API: ${fetchErr.message}`);
    } finally {
      clearTimeout(timeoutId);
    }

    // Detailed HTTP status handling
    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new GeminiAuthError(`Gemini API key is invalid or unauthorized (${response.status}): ${errText}`);
      }
      if (response.status === 429) {
        throw new GeminiRateLimitError(`Gemini API rate limit or quota exceeded (429). Please wait before trying again.`);
      }
      if (response.status >= 500) {
        throw new GeminiServiceError(`Gemini vision service is temporarily unavailable (${response.status}). Please try again shortly.`, response.status);
      }
      throw new GeminiServiceError(`Gemini API error (${response.status}): ${errText}`, response.status);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (jsonErr: any) {
      throw new GeminiParsingError(`Failed to parse Gemini response envelope as JSON: ${jsonErr.message}`);
    }

    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new GeminiParsingError('No identification candidates received from Gemini API.', JSON.stringify(data));
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(candidateText);
    } catch (parseErr: any) {
      throw new GeminiParsingError(
        `Gemini returned malformed non-JSON text: ${parseErr.message}`,
        candidateText
      );
    }

    const validationResult = CoinIdentificationResultSchema.safeParse(parsedJson);
    if (!validationResult.success) {
      throw new GeminiParsingError(
        `Gemini numismatic identification schema validation failed: ${validationResult.error.message}`,
        candidateText
      );
    }

    return validationResult.data;
  }
}
