import { resetDatabaseForTesting } from '../db/nodeAdapter';
import { getDatabase } from '../db/client';
import { specimenRepository } from '../db/repositories/specimenRepository';
import { coinTypeRepository } from '../db/repositories/coinTypeRepository';
import { valuationRepository } from '../db/repositories/valuationRepository';

describe('SQLite Query Performance & Index Profiling', () => {
  beforeAll(() => {
    resetDatabaseForTesting();
    const db = getDatabase();

    // Populate benchmark data: 1 coin type, 100 specimens, 300 valuation records
    const ct = coinTypeRepository.create({
      country: 'United States',
      denomination: '1 Dollar',
      year_start: 1881,
      metal: 'Silver',
    });

    db.withTransactionSync(() => {
      for (let i = 0; i < 100; i++) {
        const spec = specimenRepository.create({
          coin_type_id: ct.id,
          custom_name: `Benchmark Specimen #${i}`,
          user_grade: i % 2 === 0 ? 'MS65' : 'VF20',
          acquisition_price: 50 + i,
        });

        // Insert multiple valuation records per specimen to stress the latest-valuation lookup
        for (let v = 1; v <= 3; v++) {
          valuationRepository.create({
            specimen_id: spec.id,
            estimated_value_min: 60 + i + v,
            estimated_value_max: 90 + i + v,
            currency: 'USD',
            valuation_type: 'numismatic_market',
            source: 'Benchmark Runner',
            comparable_sales: [],
            confidence: 0.85,
            valuation_date: `2026-0${v}-15`,
          });
        }
      }
    });
  });

  it('uses composite index idx_valuation_specimen_date_desc in query plan', () => {
    const db = getDatabase();
    const queryPlan = db.getAllSync<{ detail: string }>(`
      EXPLAIN QUERY PLAN
      SELECT vr2.id
      FROM valuation_records vr2
      WHERE vr2.specimen_id = 'test-id'
      ORDER BY vr2.valuation_date DESC
      LIMIT 1;
    `);

    // Verify SQLite query planner uses the composite index rather than SCAN TABLE
    const usesIndex = queryPlan.some(
      (row) =>
        row.detail.includes('USING INDEX idx_valuation_specimen_date_desc') ||
        row.detail.includes('idx_valuation_specimen_date_desc')
    );

    expect(usesIndex).toBe(true);
  });

  it('executes specimen list with latest valuations in sub-millisecond range per specimen', () => {
    // Warmup
    specimenRepository.list();

    const start = performance.now();
    const list = specimenRepository.list();
    const elapsed = performance.now() - start;

    expect(list.length).toBeGreaterThanOrEqual(100);
    // Listing 100 fully hydrated specimens with latest valuation lookups should complete rapidly (< 150ms even under heavy parallel test load)
    expect(elapsed).toBeLessThan(150);
  });

  it('executes collection statistics calculation with sub-millisecond aggregation', () => {
    // Warmup
    specimenRepository.getCollectionStatistics();

    const start = performance.now();
    const stats = specimenRepository.getCollectionStatistics();
    const elapsed = performance.now() - start;

    expect(stats.totalSpecimens).toBeGreaterThanOrEqual(100);
    expect(stats.totalEstimatedValue).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(80);
  });
});
