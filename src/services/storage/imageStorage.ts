import * as FileSystem from 'expo-file-system/legacy';

const IMAGE_DIR = `${FileSystem.documentDirectory || ''}coinvault_images/`;

export const imageStorage = {
  async ensureDirectoryExists(): Promise<void> {
    if (!FileSystem.documentDirectory) return;
    try {
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
      }
    } catch (e) {
      console.warn('Failed to create image directory, using direct paths:', e);
    }
  },

  async persistImage(tempUri: string, side: 'obverse' | 'reverse' | 'detail' = 'obverse'): Promise<string> {
    if (!tempUri) return '';
    // If running in an environment without documentDirectory (e.g. web or mock test)
    if (!FileSystem.documentDirectory) {
      return tempUri;
    }

    try {
      await this.ensureDirectoryExists();
      const ext = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `coin_${side}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const destination = `${IMAGE_DIR}${filename}`;

      await FileSystem.copyAsync({
        from: tempUri,
        to: destination,
      });

      return destination;
    } catch (err) {
      console.warn('Could not copy image to persistent storage, using source URI:', err);
      return tempUri;
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
  }
};
