import { valuationEngine } from '../services/valuation/valuationEngine';

describe('Numismatic Valuation Engine', () => {
  test('Calculates intrinsic bullion melt value for gold and silver', async () => {
    // Gold sovereign: ~8 grams of .9167 gold
    const goldValuation = await valuationEngine.estimate({
      coinType: 'Sovereign',
      country: 'United Kingdom',
      denomination: '1 Sovereign',
      metal: 'Gold (22k)',
      weightG: 7.988,
      grade: 'MS63',
      currency: 'USD',
    });

    expect(goldValuation.meltValue).toBeGreaterThan(500);
    expect(goldValuation.estimatedValueMin).toBeGreaterThanOrEqual(goldValuation.meltValue!);
    expect(goldValuation.caveats.length).toBeGreaterThan(0);
    expect(goldValuation.comparableSales.length).toBeGreaterThan(0);
  });

  test('Higher grades yield higher valuation multipliers', async () => {
    const vfValuation = await valuationEngine.estimate({
      coinType: 'Morgan Dollar',
      country: 'United States',
      denomination: '1 Dollar',
      metal: 'Silver (.900)',
      weightG: 26.73,
      grade: 'VF20',
      currency: 'USD',
    });

    const msValuation = await valuationEngine.estimate({
      coinType: 'Morgan Dollar',
      country: 'United States',
      denomination: '1 Dollar',
      metal: 'Silver (.900)',
      weightG: 26.73,
      grade: 'MS65',
      currency: 'USD',
    });

    expect(msValuation.estimatedValueMax).toBeGreaterThan(vfValuation.estimatedValueMax);
  });
});
