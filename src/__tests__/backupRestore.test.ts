import { resetDatabaseForTesting } from '../db/nodeAdapter';
import { coinTypeRepository } from '../db/repositories/coinTypeRepository';
import { specimenRepository } from '../db/repositories/specimenRepository';
import { jsonBackupService } from '../services/export/jsonBackup';

describe('JSON Backup and Relational Restore', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  test('Export collection and restore roundtrip preserves relational data', () => {
    const ct = coinTypeRepository.create({
      country: 'Ancient Greece',
      denomination: 'Tetradrachm',
      metal: 'Silver',
      year_start: -450,
      ruler: 'Athenian Democracy',
    });

    specimenRepository.create({
      coin_type_id: ct.id,
      custom_name: 'Classical Athens Owl Choice XF',
      user_grade: 'XF45',
      acquisition_price: 950.0,
      notes: 'Test backup notes',
    });

    // Generate Backup
    const backup = jsonBackupService.createBackup();
    expect(backup.specimens.length).toBeGreaterThan(0);
    expect(backup.coin_types.length).toBeGreaterThan(0);

    const jsonString = JSON.stringify(backup);

    // Validate backup
    const validation = jsonBackupService.validateBackup(jsonString);
    expect(validation.valid).toBe(true);
    expect(validation.data).toBeDefined();

    // Reset DB and restore
    resetDatabaseForTesting();
    const restoreResult = jsonBackupService.restoreBackup(validation.data!, true);
    expect(restoreResult.success).toBe(true);

    const restoredSpecimens = specimenRepository.list();
    expect(restoredSpecimens.length).toBe(1);
    expect(restoredSpecimens[0].custom_name).toBe('Classical Athens Owl Choice XF');
    expect(restoredSpecimens[0].coin_type?.country).toBe('Ancient Greece');
  });

  test('Rejects malformed backup JSON with validation error', () => {
    const malformed = '{"version": "1.0", "specimens": "not an array"}';
    const validation = jsonBackupService.validateBackup(malformed);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBeDefined();
  });
});
