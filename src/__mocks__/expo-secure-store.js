const store = new Map();

module.exports = {
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn().mockImplementation(async (key) => store.get(key) || null),
  setItemAsync: jest.fn().mockImplementation(async (key, value) => { store.set(key, value); }),
  deleteItemAsync: jest.fn().mockImplementation(async (key) => { store.delete(key); }),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  __clearStore: () => store.clear(),
};
