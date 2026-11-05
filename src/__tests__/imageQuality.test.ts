import { imageQualityService } from '../services/ai/imageQuality';

describe('Image Quality Heuristics Service', () => {
  it('assesses standard image with valid scores and acceptable flag', async () => {
    const assessment = await imageQualityService.assessQuality('file:///mock/coin_standard.jpg');
    expect(assessment).toBeDefined();
    expect(assessment.blurScore).toBeGreaterThanOrEqual(0);
    expect(assessment.blurScore).toBeLessThanOrEqual(1);
    expect(assessment.framingScore).toBeGreaterThanOrEqual(0);
    expect(assessment.lightingScore).toBeGreaterThanOrEqual(0);
    expect(typeof assessment.isAcceptable).toBe('boolean');
    expect(Array.isArray(assessment.issues)).toBe(true);
  });
});
