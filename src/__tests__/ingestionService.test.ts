import { resetDatabaseForTesting, getDatabase } from '../db/client';
import { specimenIngestionService } from '../services/specimen/specimenIngestionService';
import { specimenRepository } from '../db/repositories/specimenRepository';
import { coinTypeRepository } from '../db/repositories/coinTypeRepository';
import { valuationRepository } from '../db/repositories/valuationRepository';
import { conditionRepository } from '../db/repositories/conditionRepository';
import { tagRepository } from '../db/repositories/tagRepository';

describe('SpecimenIngestionService', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('unifies specimen creation, coin type resolution, grading, and valuation', async () => {
    const createdTag = tagRepository.create('Morgan Silver', '#B8860B');

    const specimen = await specimenIngestionService.ingest({
      obverseImageUri: 'file:///tmp/morgan_obv.jpg',
      reverseImageUri: 'file:///tmp/morgan_rev.jpg',
      coinType: {
        country: 'United States',
        denomination: '1 Dollar',
        year_start: 1881,
        year_end: 1881,
        mint: 'S',
        metal: 'Silver',
        coin_series: 'Morgan Dollar',
      },
      specimen: {
        custom_name: '1881-S Morgan Dollar Blast White',
        user_grade: 'MS65',
        acquisition_price: 185,
        acquisition_currency: 'USD',
        acquisition_source: 'Heritage Auctions',
        notes: 'Exceptional luster and clean cheek.',
        tagIds: [createdTag.id],
      },
      runGrading: true,
      runValuation: true,
    });

    expect(specimen).toBeDefined();
    expect(specimen.id).toBeDefined();
    expect(specimen.custom_name).toBe('1881-S Morgan Dollar Blast White');
    expect(specimen.user_grade).toBe('MS65');
    expect(specimen.acquisition_price).toBe(185);

    // Verify CoinType was created or matched from reference catalog
    expect(specimen.coin_type).toBeDefined();
    expect(specimen.coin_type?.country).toBe('United States');
    expect(specimen.coin_type?.denomination).toBe('1 Dollar');
    expect(specimen.coin_type?.year_start).toBeLessThanOrEqual(1881);
    expect(specimen.coin_type?.year_end).toBeGreaterThanOrEqual(1881);

    // Verify initial condition assessment was recorded
    const conditionHistory = conditionRepository.getHistoryForSpecimen(specimen.id);
    expect(conditionHistory.length).toBeGreaterThanOrEqual(1);
    expect(conditionHistory[0].grading_system).toBe('sheldon_70');

    // Verify initial valuation record was recorded
    const valuationHistory = valuationRepository.getHistoryForSpecimen(specimen.id);
    expect(valuationHistory.length).toBeGreaterThanOrEqual(1);
    expect(valuationHistory[0].estimated_value_min).toBeGreaterThan(0);

    // Verify tag association
    const tags = tagRepository.getTagsForSpecimen(specimen.id);
    expect(tags.some((t: any) => t.id === createdTag.id)).toBe(true);
  });

  it('ingests AI scan result with provenance metadata correctly', async () => {
    const specimen = await specimenIngestionService.ingestFromScanResult(
      'file:///tmp/scan_obv.jpg',
      'file:///tmp/scan_rev.jpg',
      {
        country: 'Great Britain',
        denomination: '1 Sovereign',
        year: 1902,
        ruler: 'Edward VII',
        metal: 'Gold',
      },
      {
        confidence: { overall: 0.96, country: 0.98, denomination: 0.95, year: 0.95 },
        alternative_identifications: [],
        uncertain_attributes: [],
      } as any,
      'MS62',
      550,
      'King Edward VII Gold Sovereign',
      'Gemini 2.5 Flash'
    );

    expect(specimen.coin_type?.country).toBe('Great Britain');
    expect(specimen.coin_type?.denomination).toBe('1 Sovereign');
    expect(specimen.coin_type?.ruler).toBe('Edward VII');
    expect(specimen.user_grade).toBe('MS62');
  });

  it('ingests an unidentified specimen without failing validation', async () => {
    const specimen = await specimenIngestionService.ingestUnidentified(
      'file:///tmp/mystery_obv.jpg',
      null,
      'Found in old drawer, needs attribution'
    );

    expect(specimen).toBeDefined();
    expect(specimen.coin_type?.country).toBe('Unidentified');
    expect(specimen.user_grade).toBe('Ungraded');
    expect(specimen.notes).toContain('Found in old drawer');
  });
});
