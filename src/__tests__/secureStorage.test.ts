import { secureStorage } from '../services/security/secureStorage';
import { useSettingsStore } from '../stores/settingsStore';

describe('Secure Storage & Settings Integration', () => {
  beforeEach(async () => {
    await secureStorage.deleteItem('gemini_api_key');
  });

  it('stores, retrieves, and deletes values securely', async () => {
    expect(await secureStorage.getItem('gemini_api_key')).toBeNull();

    await secureStorage.setItem('gemini_api_key', 'AIzaSySecretApiKey123');
    expect(await secureStorage.getItem('gemini_api_key')).toBe('AIzaSySecretApiKey123');

    await secureStorage.deleteItem('gemini_api_key');
    expect(await secureStorage.getItem('gemini_api_key')).toBeNull();
  });

  it('synchronizes geminiApiKey in settingsStore with secure storage', async () => {
    const store = useSettingsStore.getState();

    await store.setGeminiApiKey('AIzaSyTestKey456');
    expect(useSettingsStore.getState().geminiApiKey).toBe('AIzaSyTestKey456');
    expect(await secureStorage.getItem('gemini_api_key')).toBe('AIzaSyTestKey456');

    // Test loading when store initializes
    useSettingsStore.setState({ geminiApiKey: '' });
    await useSettingsStore.getState().loadSecureSettings();
    expect(useSettingsStore.getState().geminiApiKey).toBe('AIzaSyTestKey456');
  });
});
