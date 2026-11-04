import * as FileSystem from 'expo-file-system/legacy';
import { CoinIdentificationProvider } from './providerInterface';
import {
  IdentificationInput,
  CoinIdentificationResult,
  CoinIdentificationResultSchema,
} from './types';

export class GeminiCoinIdentificationProvider implements CoinIdentificationProvider {
  providerName = 'Google Gemini 2.5 Flash Multimodal Vision API';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async identify(input: IdentificationInput): Promise<CoinIdentificationResult> {
    if (!this.apiKey) {
      throw new Error(
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

    // Convert obverse image to inline base64
    try {
      if (input.obverseImageUri.startsWith('data:')) {
        const [meta, data] = input.obverseImageUri.split(',');
        const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg';
        parts.push({
          inlineData: {
            mimeType,
            data,
          },
        });
      } else {
        const base64Obverse = await FileSystem.readAsStringAsync(input.obverseImageUri, {
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
        if (input.reverseImageUri.startsWith('data:')) {
          const [meta, data] = input.reverseImageUri.split(',');
          const mimeType = meta.split(':')[1]?.split(';')[0] || 'image/jpeg';
          parts.push({
            inlineData: {
              mimeType,
              data,
            },
          });
        } else {
          const base64Reverse = await FileSystem.readAsStringAsync(input.reverseImageUri, {
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
      throw new Error(`Failed to read coin photograph file: ${(readErr as Error).message}`);
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
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
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error('No identification response received from Gemini.');
    }

    const parsedJson = JSON.parse(candidateText);
    return CoinIdentificationResultSchema.parse(parsedJson);
  }
}
