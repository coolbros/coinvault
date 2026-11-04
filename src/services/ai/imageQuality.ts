import * as FileSystem from 'expo-file-system/legacy';
import { QualityAssessment } from '../../components/QualityIndicator';
import { ImageQualityProvider } from './providerInterface';

export class LocalImageQualityProvider implements ImageQualityProvider {
  async assessQuality(imageUri: string): Promise<QualityAssessment> {
    const issues: string[] = [];
    let blurScore = 0.88;
    let lightingScore = 0.85;
    let framingScore = 0.90;

    try {
      if (imageUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists && typeof fileInfo.size === 'number') {
          // If file size is tiny, likely heavily compressed or blurry
          if (fileInfo.size < 40 * 1024) {
            blurScore = 0.45;
            issues.push('Resolution is low; inscriptions and mint marks may be illegible.');
          } else if (fileInfo.size < 120 * 1024) {
            blurScore = 0.72;
          } else {
            blurScore = 0.92;
          }
        }
      }
    } catch {
      // Fallback to reasonable estimates
      blurScore = 0.85;
    }

    // Heuristics for coin photography guidance
    if (blurScore < 0.65) {
      issues.push('Coin photograph is slightly blurry. Consider retaking under direct diffused light.');
    }

    const isAcceptable = blurScore >= 0.50 && lightingScore >= 0.50;

    return {
      blurScore,
      lightingScore,
      framingScore,
      isAcceptable,
      issues,
    };
  }
}

export const imageQualityService = new LocalImageQualityProvider();
