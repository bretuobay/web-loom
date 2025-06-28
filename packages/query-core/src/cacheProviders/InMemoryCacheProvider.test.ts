import { InMemoryCacheProvider } from './InMemoryCacheProvider';
import { CachedItem } from './CacheProvider';

describe('InMemoryCacheProvider', () => {
  let provider: InMemoryCacheProvider;

  beforeEach(() => {
    provider = new InMemoryCacheProvider();
  });

  test('should set and get an item', async () => {
    const key = 'testKey';
    const item: CachedItem<string> = { data: 'testData', lastUpdated: Date.now() };
    await provider.set(key, item);
    const retrieved = await provider.get<string>(key);
    expect(retrieved).toEqual(item);
  });

  test('should return undefined for a non-existent key', async () => {
    const retrieved = await provider.get<string>('nonExistentKey');
    expect(retrieved).toBeUndefined();
  });

  test('should remove an item', async () => {
    const key = 'testKey';
    const item: CachedItem<string> = { data: 'testData', lastUpdated: Date.now() };
    await provider.set(key, item);
    await provider.remove(key);
    const retrieved = await provider.get<string>(key);
    expect(retrieved).toBeUndefined();
  });

  test('should clear all items', async () => {
    const item1: CachedItem<string> = { data: 'testData1', lastUpdated: Date.now() };
    const item2: CachedItem<number> = { data: 123, lastUpdated: Date.now() };
    await provider.set('key1', item1);
    await provider.set('key2', item2);
    await provider.clearAll();
    const retrieved1 = await provider.get<string>('key1');
    const retrieved2 = await provider.get<number>('key2');
    expect(retrieved1).toBeUndefined();
    expect(retrieved2).toBeUndefined();
  });

  test('get should return a structured clone of the item', async () => {
    const key = 'testKey';
    const originalItem: CachedItem<{ a: number }> = { data: { a: 1 }, lastUpdated: Date.now() };
    await provider.set(key, originalItem);

    const retrievedItem = await provider.get<{ a: number }>(key);
    expect(retrievedItem).toEqual(originalItem);
    expect(retrievedItem).not.toBe(originalItem); // Ensure it's a clone

    if (retrievedItem) {
      retrievedItem.data.a = 2;
      retrievedItem.lastUpdated = 0;
    }

    const retrievedAgain = await provider.get<{ a: number }>(key);
    expect(retrievedAgain?.data.a).toBe(1); // Original data in cache should be unchanged
    expect(retrievedAgain?.lastUpdated).toBe(originalItem.lastUpdated);
  });

  test('set should store a structured clone of the item', async () => {
    const key = 'testKey';
    const originalItem: CachedItem<{ a: number }> = { data: { a: 1 }, lastUpdated: Date.now() };

    await provider.set(key, originalItem);

    // Modify originalItem after setting it
    originalItem.data.a = 2;
    originalItem.lastUpdated = 0;

    const retrievedItem = await provider.get<{ a: number }>(key);
    expect(retrievedItem?.data.a).toBe(1); // Data in cache should be the original cloned value
    expect(retrievedItem?.lastUpdated).not.toBe(0);
  });

  test('clearAll should work on an empty cache', async () => {
    await provider.clearAll(); // Should not throw
    const retrieved = await provider.get<string>('anyKey');
    expect(retrieved).toBeUndefined();
  });

  test('remove should not throw for a non-existent key', async () => {
    await provider.remove('nonExistentKey'); // Should not throw
    expect(true).toBe(true); // Indicate test passed if no error
  });
});
