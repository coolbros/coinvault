import { CoinGradingProvider } from './providerInterface';
import { CoinGradingInput, ConditionAssessmentOutput } from './types';

export class LocalCoinGradingProvider implements CoinGradingProvider {
  providerName = 'CoinVault Numismatic Condition Engine';

  async assess(input: CoinGradingInput): Promise<ConditionAssessmentOutput> {
    // Simulate assessment
    await new Promise((resolve) => setTimeout(resolve, 800));

    const observations: ConditionAssessmentOutput['observations'] = [
      {
        category: 'wear',
        observation: 'High points of the portrait and eagle design exhibit light friction wear with major devices clearly defined.',
        severity: 'minor',
      },
      {
        category: 'luster',
        observation: 'Cartwheel luster remains intact in protected field areas and around outer lettering.',
        severity: 'minor',
      },
      {
        category: 'surface',
        observation: 'Natural cabinet patina with no active bronze disease, PVC contamination, or artificial darkeners.',
        severity: 'minor',
      },
      {
        category: 'scratches',
        observation: 'A few superficial hairline contact marks on cheek, typical of bag handling.',
        severity: 'minor',
      },
      {
        category: 'cleaning',
        observation: 'No evidence of abrasive wiping, wire brush marks, or unnatural dipped brilliance.',
        severity: 'minor',
      },
      {
        category: 'strike',
        observation: 'Strong sharp central strike with complete hair curls and eagle feather detail.',
        severity: 'minor',
      },
    ];

    return {
      gradingSystem: 'sheldon_70',
      estimatedGrade: 'AU55',
      estimatedGradeMin: 'XF45',
      estimatedGradeMax: 'AU58',
      numericalGradeMin: 45,
      numericalGradeMax: 58,
      observations,
      confidence: 0.86,
      explanation:
        'AI-assisted estimated condition: XF45–AU58. High points show minimal friction with substantial remaining mint luster in the fields. Surfaces appear completely original and uncleaned.',
      disclaimer:
        'NOTICE: This is an AI-assisted computer vision estimate, NOT a certified third-party grading guarantee. Only submit to accredited services (PCGS, NGC, ANACS) for official encapsulation and market-recognized certification.',
    };
  }
}

export const coinGradingService = new LocalCoinGradingProvider();
