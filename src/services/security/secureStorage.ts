import * as SecureStore from 'expo-secure-store';

const memoryFallback = new Map<string, string>();

let isNativeSecureStoreAvailable: boolean | null = null;

async function checkAvailability(): Promise<boolean> {
  if (isNativeSecureStoreAvailable !== null) {
    return isNativeSecureStoreAvailable;
  }
  try {
    if (typeof SecureStore?.isAvailableAsync === 'function') {
      isNativeSecureStoreAvailable = await SecureStore.isAvailableAsync();
    } else {
      isNativeSecureStoreAvailable = false;
    }
  } catch {
    isNativeSecureStoreAvailable = false;
  }
  return isNativeSecureStoreAvailable;
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const isAvailable = await checkAvailability();
    if (isAvailable) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (err) {
        console.warn(`[secureStorage] Failed to read ${key} from SecureStore, checking fallback:`, err);
        return memoryFallback.get(key) || null;
      }
    }
    return memoryFallback.get(key) || null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const isAvailable = await checkAvailability();
    if (isAvailable) {
      try {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
        memoryFallback.set(key, value);
        return;
      } catch (err) {
        console.warn(`[secureStorage] Failed to write ${key} to SecureStore, writing to fallback:`, err);
        memoryFallback.set(key, value);
        return;
      }
    }
    memoryFallback.set(key, value);
  },

  async deleteItem(key: string): Promise<void> {
    const isAvailable = await checkAvailability();
    if (isAvailable) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.warn(`[secureStorage] Failed to delete ${key} from SecureStore:`, err);
      }
    }
    memoryFallback.delete(key);
  },

  // Synchronous peek for memory fallback (useful for initial test renders)
  getFallbackSync(key: string): string | null {
    return memoryFallback.get(key) || null;
  },
};
