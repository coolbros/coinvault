import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIR = `${FileSystem.documentDirectory || ''}coinvault_images/`;

export class StorageError extends Error {
  constructor(message: string, public readonly originalError?: any) {
    super(message);
    this.name = 'StorageError';
  }
}

export const imageStorage = {
  async ensureDirectoryExists(): Promise<void> {
    if (!FileSystem.documentDirectory) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      }
    } catch (e) {
      throw new StorageError('Failed to create persistent image directory in device storage.', e);
    }
  },

  async persistImage(
    tempUri: string,
    side: 'obverse' | 'reverse' | 'detail' | 'thumb' = 'obverse'
  ): Promise<string> {
    if (!tempUri) return '';

    // If running in an environment without documentDirectory (e.g. Node tests or web mock)
    if (!FileSystem.documentDirectory) {
      return tempUri;
    }

    try {
      await this.ensureDirectoryExists();
      const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `coin_${side}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const destination = `${IMAGE_DIR}${filename}`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: destination,
      });

      // Verify the destination actually exists and has size
      const destInfo = await FileSystem.getInfoAsync(destination);
      if (!destInfo.exists) {
        throw new StorageError(`File copy reported success but destination does not exist: ${destination}`);
      }

      return destination;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError(
        `Failed to persist ${side} image from ${tempUri} into permanent storage: ${(err as any)?.message || String(err)}`,
        err
      );
    }
  },

  async deleteImage(uri: string): Promise<boolean> {
    if (!uri || !uri.startsWith('file://')) return false;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        return true;
      }
    } catch (err) {
      console.warn('Could not delete image file:', err);
    }
    return false;
  },

  getImageDirectory(): string {
    return IMAGE_DIR;
  },
};
