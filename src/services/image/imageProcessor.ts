import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { imageStorage } from '../storage/imageStorage';

export interface ProcessedCoinImages {
  originalPath: string;
  inferencePath: string;
  thumbnailPath: string;
  width: number;
  height: number;
}

export const imageProcessor = {
  /**
   * Resizes an image for AI model inference (max 1024px dimension, 80% JPEG quality)
   * Drastically reduces network payload from ~10MB+ down to ~200-300KB.
   */
  async prepareForInference(sourceUri: string): Promise<string> {
    if (!sourceUri) return '';
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: 1024 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulated.uri;
    } catch (err) {
      console.warn('[imageProcessor] Inference downscaling failed, using original source:', err);
      return sourceUri;
    }
  },

  /**
   * Generates a 300px thumbnail optimized for inventory lists and grid rendering.
   */
  async generateThumbnail(sourceUri: string): Promise<string> {
    if (!sourceUri) return '';
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: 300 } }],
        {
          compress: 0.75,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return manipulated.uri;
    } catch (err) {
      console.warn('[imageProcessor] Thumbnail generation failed, using original source:', err);
      return sourceUri;
    }
  },

  /**
   * Inspects image dimensions and aspect ratio.
   */
  async getImageMetadata(sourceUri: string): Promise<{ width: number; height: number; fileSize: number }> {
    let width = 1000;
    let height = 1000;
    let fileSize = 0;

    try {
      if (sourceUri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(sourceUri);
        if (fileInfo.exists && typeof fileInfo.size === 'number') {
          fileSize = fileInfo.size;
        }
      }

      // Read image dimensions via lightweight manipulation probe
      const probed = await ImageManipulator.manipulateAsync(sourceUri, [], {});
      if (probed.width && probed.height) {
        width = probed.width;
        height = probed.height;
      }
    } catch (err) {
      console.warn('[imageProcessor] Could not inspect image metadata:', err);
    }

    return { width, height, fileSize };
  },

  /**
   * Preserves full-resolution original coin photo while generating and persisting
   * both compressed inference copy and thumbnail.
   */
  async processAndPersist(
    sourceUri: string,
    side: 'obverse' | 'reverse' | 'detail' = 'obverse'
  ): Promise<ProcessedCoinImages> {
    // 1. Persist uncompressed original photograph
    const originalPath = await imageStorage.persistImage(sourceUri, side);

    // 2. Generate and persist thumbnail
    const thumbTemp = await this.generateThumbnail(sourceUri);
    const thumbnailPath = await imageStorage.persistImage(thumbTemp, 'thumb');

    // 3. Generate and persist optimized inference image
    const inferenceTemp = await this.prepareForInference(sourceUri);
    const inferencePath = await imageStorage.persistImage(inferenceTemp, side);

    // 4. Inspect dimensions
    const meta = await this.getImageMetadata(sourceUri);

    return {
      originalPath,
      inferencePath,
      thumbnailPath,
      width: meta.width,
      height: meta.height,
    };
  },
};
