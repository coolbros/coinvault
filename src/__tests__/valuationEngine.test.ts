import { valuationEngine } from '../services/valuation/valuationEngine';
import { useSettingsStore } from '../stores/settingsStore';

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
    expect(Array.isArray(goldValuation.comparableSales)).toBe(true);
    expect(goldValuation.source).toContain('Bullion Index');
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

  test('Respects user-configured bullion spot prices', async () => {
    // Override gold spot price to $100/g
    useSettingsStore.getState().setSpotPrice('gold', 100);

    const val = await valuationEngine.estimate({
      coinType: 'Gold Eagle',
      country: 'United States',
      denomination: '50 Dollars',
      metal: 'Gold (.9167)',
      weightG: 33.93,
      grade: 'MS70',
      currency: 'USD',
    });

    // 33.93 * 0.9167 * 100 ≈ 3110.36
    expect(val.meltValue).toBeGreaterThan(3000);

    // Reset spot prices to default
    useSettingsStore.getState().setSpotPrice('gold', 85);
  });
});
