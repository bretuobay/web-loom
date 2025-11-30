import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IndexedDBBackend } from './indexeddb';

const hasIndexedDB = typeof indexedDB !== 'undefined';

describe.skipIf(!hasIndexedDB)('IndexedDBBackend', () => {
  let backend: IndexedDBBackend;
  const dbName = 'test-db';

  beforeEach(async () => {
    backend = new IndexedDBBackend(dbName, 'test-namespace');
    await backend.init();
  });

  afterEach(async () => {
    await backend.dispose();
    // Clean up database
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase(dbName);
    }
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await backend.set('key1', 'value1');
      const value = await backend.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', async () => {
      const value = await backend.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete a value', async () => {
      await backend.set('key1', 'value1');
      await backend.delete('key1');
      const value = await backend.get('key1');
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await backend.set('key1', 'value1');
      expect(await backend.has('key1')).toBe(true);
      expect(await backend.has('non-existent')).toBe(false);
    });

    it('should get all keys', async () => {
      await backend.set('key1', 'value1');
      await backend.set('key2', 'value2');
      const keys = await backend.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear all values', async () => {
      await backend.set('key1', 'value1');
      await backend.set('key2', 'value2');
      await backend.clear();
      const keys = await backend.keys();
      expect(keys).toHaveLength(0);
    });

    it('should get all entries', async () => {
      await backend.set('key1', 'value1');
      await backend.set('key2', 'value2');
      const entries = await backend.entries();
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
    });
  });

  describe('Complex Types', () => {
    it('should handle objects', async () => {
      const obj = { name: 'Alice', age: 30 };
      await backend.set('user', obj);
      const value = await backend.get('user');
      expect(value).toEqual(obj);
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, 4, 5];
      await backend.set('numbers', arr);
      const value = await backend.get('numbers');
      expect(value).toEqual(arr);
    });
  });

  describe('TTL Support', () => {
    it('should expire items after TTL', async () => {
      await backend.set('temp', 'value', { ttl: 100 });
      expect(await backend.get('temp')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await backend.get('temp')).toBeNull();
    });

    it('should not expire items without TTL', async () => {
      await backend.set('permanent', 'value');
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(await backend.get('permanent')).toBe('value');
    });
  });

  describe('Namespace Isolation', () => {
    it('should isolate keys by namespace', async () => {
      const backend1 = new IndexedDBBackend(dbName, 'ns1');
      const backend2 = new IndexedDBBackend(dbName, 'ns2');

      await backend1.init();
      await backend2.init();

      await backend1.set('key', 'value1');
      await backend2.set('key', 'value2');

      expect(await backend1.get('key')).toBe('value1');
      expect(await backend2.get('key')).toBe('value2');

      await backend1.dispose();
      await backend2.dispose();
    });
  });
});
