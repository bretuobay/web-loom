// tests/mocks/mockLocalStorage.ts

let originalLocalStorage: Storage | null = null;
let mockStorage: Record<string, string> = {};

export function setupMockLocalStorage() {
  if (!originalLocalStorage) {
    originalLocalStorage = window.localStorage;
  }
  mockStorage = {}; // Reset for each setup

  const mockLocalStorageImplementation: Storage = {
    getItem: (key: string): string | null => {
      return mockStorage[key] || null;
    },
    setItem: (key: string, value: string): void => {
      mockStorage[key] = value;
    },
    removeItem: (key: string): void => {
      delete mockStorage[key];
    },
    clear: (): void => {
      mockStorage = {};
    },
    get length(): number {
      return Object.keys(mockStorage).length;
    },
    key: (index: number): string | null => {
      return Object.keys(mockStorage)[index] || null;
    },
  };

  // Override window.localStorage
  // Need to use Object.defineProperty because localStorage is a read-only property
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorageImplementation,
    writable: true, // Allow it to be restored
    configurable: true,
  });
}

export function resetMockLocalStorage() {
  if (originalLocalStorage) {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: false, // Assuming original is not writable like this
      configurable: true,
    });
  }
  mockStorage = {};
  originalLocalStorage = null; // So it can be re-mocked if needed
}

export function getMockLocalStorageData(): Readonly<Record<string, string>> {
  return { ...mockStorage };
}
