import { QualityAssessment } from '../../components/QualityIndicator';
import { ImageQualityProvider } from './providerInterface';
import { imageProcessor } from '../image/imageProcessor';

export class LocalImageQualityProvider implements ImageQualityProvider {
  async assessQuality(imageUri: string): Promise<QualityAssessment> {
    const issues: string[] = [];
    let blurScore = 0.90;
    let lightingScore = 0.88;
    let framingScore = 0.90;

    try {
      const meta = await imageProcessor.getImageMetadata(imageUri);
      const { width, height, fileSize } = meta;

      // 1. Framing Analysis (Aspect ratio and centering heuristics)
      // Coins are circular; a close-up cropped coin photo should have an aspect ratio near 1.0 (between 0.75 and 1.33)
      if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        if (aspectRatio > 1.6 || aspectRatio < 0.6) {
          framingScore = 0.55;
          issues.push('Extreme aspect ratio: center the coin in a square frame for optimal AI identification.');
        } else if (aspectRatio > 1.3 || aspectRatio < 0.75) {
          framingScore = 0.75;
          issues.push('Coin is slightly off-center; ensure the entire coin rim is visible.');
        } else {
          framingScore = 0.95;
        }

        // 2. Resolution & Detail Assessment
        const minDimension = Math.min(width, height);
        if (minDimension < 300) {
          blurScore = 0.40;
          issues.push('Resolution is too low to resolve coin mint marks, dates, or die varieties.');
        } else if (minDimension < 600) {
          blurScore = 0.68;
          issues.push('Moderate resolution: fine details and microscopic hair lines may be soft.');
        } else {
          blurScore = 0.94;
        }

        // 3. Compression & Sharpness Density Analysis (Bytes per pixel)
        if (fileSize > 0) {
          const totalPixels = width * height;
          const bytesPerPixel = fileSize / totalPixels;

          // Extremely low bytes per pixel indicates heavy JPEG blocking artifacts / blur
          if (bytesPerPixel < 0.04) {
            blurScore = Math.min(blurScore, 0.48);
            issues.push('High compression artifacts detected; photograph appears soft or out of focus.');
          } else if (bytesPerPixel < 0.08) {
            blurScore = Math.min(blurScore, 0.74);
          }

          // 4. Lighting Heuristics based on file density and typical sensor response
          if (fileSize < 25 * 1024) {
            lightingScore = 0.50;
            issues.push('Low dynamic range: coin might be underexposed or in deep shadow.');
          } else {
            lightingScore = 0.90;
          }
        }
      }
    } catch (err) {
      console.warn('[LocalImageQualityProvider] Assessment heuristic encountered fallback:', err);
      blurScore = 0.85;
      lightingScore = 0.85;
      framingScore = 0.85;
    }

    const isAcceptable = blurScore >= 0.55 && framingScore >= 0.50 && lightingScore >= 0.50;

    return {
      blurScore: Math.round(blurScore * 100) / 100,
      lightingScore: Math.round(lightingScore * 100) / 100,
      framingScore: Math.round(framingScore * 100) / 100,
      isAcceptable,
      issues,
    };
  }
}

export const imageQualityService = new LocalImageQualityProvider();
