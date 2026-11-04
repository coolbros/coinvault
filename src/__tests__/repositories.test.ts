import { resetDatabaseForTesting } from '../db/client';
import { coinTypeRepository } from '../db/repositories/coinTypeRepository';
import { specimenRepository } from '../db/repositories/specimenRepository';
import { tagRepository } from '../db/repositories/tagRepository';
import { valuationRepository } from '../db/repositories/valuationRepository';
import { conditionRepository } from '../db/repositories/conditionRepository';

describe('CoinVault Repositories & Relational Integrity', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  test('Database seeds initial world reference coin types', () => {
    const coinTypes = coinTypeRepository.listAll({ isReferenceOnly: true });
    expect(coinTypes.length).toBeGreaterThan(5);

    const indianRupee = coinTypes.find((c) => c.country === 'India' && c.denomination === '1 Rupee');
    expect(indianRupee).toBeDefined();
    expect(indianRupee?.metal).toBe('Nickel');
    expect(indianRupee?.ruler).toBe('King George VI');

    const morgan = coinTypes.find((c) => c.denomination === '1 Dollar');
    expect(morgan).toBeDefined();
    expect(morgan?.coin_series).toBe('Morgan Dollar');
  });

  test('Create physical specimen linked to coin type', () => {
    const coinType = coinTypeRepository.findOrCreate({
      country: 'India',
      denomination: '1 Rupee',
      year_start: 1947,
      year_end: 1947,
      metal: 'Nickel',
    });

    const specimen = specimenRepository.create({
      coin_type_id: coinType.id,
      custom_name: '1947 British India Rupee Choice AU',
      user_grade: 'AU55',
      acquisition_date: '2026-05-12',
      acquisition_price: 45.0,
      acquisition_currency: 'USD',
      acquisition_source: 'Heritage Auctions',
      notes: 'Exceptional cartwheel luster',
    });

    expect(specimen.id).toBeDefined();
    expect(specimen.coin_type_id).toBe(coinType.id);
    expect(specimen.coin_type?.country).toBe('India');
    expect(specimen.user_grade).toBe('AU55');
    expect(specimen.acquisition_price).toBe(45.0);
  });

  test('Deleting a specimen preserves its associated coin type', () => {
    const coinType = coinTypeRepository.create({
      country: 'France',
      denomination: '20 Francs',
      metal: 'Gold',
      year_start: 1907,
    });

    const specimen = specimenRepository.create({
      coin_type_id: coinType.id,
      custom_name: 'French Rooster 20F',
      user_grade: 'MS63',
      acquisition_price: 480.0,
    });

    // Add a valuation and condition
    valuationRepository.create({
      specimen_id: specimen.id,
      estimated_value_min: 490,
      estimated_value_max: 540,
      source: 'Test Spot',
      confidence: 0.9,
    });

    conditionRepository.create({
      specimen_id: specimen.id,
      estimated_grade: 'MS63',
      confidence: 0.88,
      assessment_provider: 'Test',
    });

    // Delete specimen
    const deleted = specimenRepository.delete(specimen.id);
    expect(deleted).toBe(true);

    // Specimen is gone
    const fetchedSpecimen = specimenRepository.getById(specimen.id);
    expect(fetchedSpecimen).toBeNull();

    // Cascaded records are gone
    const valuations = valuationRepository.getHistoryForSpecimen(specimen.id);
    expect(valuations.length).toBe(0);

    // BUT CoinType is preserved!
    const preservedCoinType = coinTypeRepository.getById(coinType.id);
    expect(preservedCoinType).not.toBeNull();
    expect(preservedCoinType?.country).toBe('France');
  });

  test('Tag assignment and retrieval on specimen', () => {
    const tags = tagRepository.listAll();
    expect(tags.length).toBeGreaterThan(0);

    const silverTag = tags.find((t) => t.name.toLowerCase().includes('silver')) || tags[0];

    const coinType = coinTypeRepository.listAll()[0];
    const specimen = specimenRepository.create({
      coin_type_id: coinType.id,
      user_grade: 'VF30',
      tag_ids: [silverTag.id],
    });

    const fetched = specimenRepository.getById(specimen.id);
    expect(fetched?.tags?.some((t) => t.id === silverTag.id)).toBe(true);
  });

  test('Collection statistics derive accurately from real stored data', () => {
    const ct1 = coinTypeRepository.create({ country: 'India', denomination: '1 Rupee', metal: 'Nickel' });
    const ct2 = coinTypeRepository.create({ country: 'United States', denomination: '1 Dollar', metal: 'Silver' });

    // Specimen 1
    const s1 = specimenRepository.create({
      coin_type_id: ct1.id,
      acquisition_price: 50.0,
    });
    valuationRepository.create({
      specimen_id: s1.id,
      estimated_value_min: 60,
      estimated_value_max: 80,
      source: 'Valuation Test',
      confidence: 0.8,
    });

    // Specimen 2
    const s2 = specimenRepository.create({
      coin_type_id: ct2.id,
      acquisition_price: 35.0,
    });
    valuationRepository.create({
      specimen_id: s2.id,
      estimated_value_min: 40,
      estimated_value_max: 50,
      source: 'Valuation Test',
      confidence: 0.8,
    });

    const stats = specimenRepository.getCollectionStatistics();

    expect(stats.totalSpecimens).toBe(2);
    expect(stats.uniqueCoinTypes).toBe(2);
    expect(stats.totalAcquisitionCost).toBe(85.0); // 50 + 35
    expect(stats.totalEstimatedValue).toBe(115.0); // ((60+80)/2) + ((40+50)/2) = 70 + 45 = 115
    expect(stats.countriesRepresented).toBe(2);
  });
});
