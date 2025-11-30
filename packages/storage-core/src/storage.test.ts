import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorage } from './storage';
import type { Storage } from './types';

describe('Storage', () => {
  let storage: Storage;

  beforeEach(async () => {
    storage = await createStorage({
      backend: 'memory',
      name: 'test-storage',
    });
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await storage.set('key1', 'value1');
      const value = await storage.get('key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent key', async () => {
      const value = await storage.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete a value', async () => {
      await storage.set('key1', 'value1');
      await storage.delete('key1');
      const value = await storage.get('key1');
      expect(value).toBeNull();
    });

    it('should check if key exists', async () => {
      await storage.set('key1', 'value1');
      expect(await storage.has('key1')).toBe(true);
      expect(await storage.has('non-existent')).toBe(false);
    });

    it('should get all keys', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      const keys = await storage.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should clear all values', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();
      const keys = await storage.keys();
      expect(keys).toHaveLength(0);
    });

    it('should get all entries', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      const entries = await storage.entries();
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
    });
  });

  describe('Complex Types', () => {
    it('should handle objects', async () => {
      const obj = { name: 'Alice', age: 30 };
      await storage.set('user', obj);
      const value = await storage.get('user');
      expect(value).toEqual(obj);
    });

    it('should handle arrays', async () => {
      const arr = [1, 2, 3, 4, 5];
      await storage.set('numbers', arr);
      const value = await storage.get('numbers');
      expect(value).toEqual(arr);
    });

    it('should handle nested structures', async () => {
      const data = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        meta: { count: 2 },
      };
      await storage.set('data', data);
      const value = await storage.get('data');
      expect(value).toEqual(data);
    });
  });

  describe('TTL Support', () => {
    it('should expire items after TTL', async () => {
      await storage.set('temp', 'value', { ttl: 100 });
      expect(await storage.get('temp')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await storage.get('temp')).toBeNull();
    });

    it('should not expire items without TTL', async () => {
      await storage.set('permanent', 'value');
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(await storage.get('permanent')).toBe('value');
    });

    it('should use default TTL from config', async () => {
      const storageWithTTL = await createStorage({
        backend: 'memory',
        name: 'test-ttl',
        defaultTTL: 100,
      });

      await storageWithTTL.set('temp', 'value');
      expect(await storageWithTTL.get('temp')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(await storageWithTTL.get('temp')).toBeNull();
    });
  });

  describe('Namespace Support', () => {
    it('should isolate keys by namespace', async () => {
      const storage1 = await createStorage({
        backend: 'memory',
        name: 'app',
        namespace: 'ns1',
      });

      const storage2 = await createStorage({
        backend: 'memory',
        name: 'app',
        namespace: 'ns2',
      });

      await storage1.set('key', 'value1');
      await storage2.set('key', 'value2');

      expect(await storage1.get('key')).toBe('value1');
      expect(await storage2.get('key')).toBe('value2');
    });
  });

  describe('Change Events', () => {
    it('should emit events on set', async () => {
      const callback = vi.fn();
      storage.subscribe('*', callback);

      await storage.set('key', 'value');

      expect(callback).toHaveBeenCalledWith({
        key: 'key',
        oldValue: null,
        newValue: 'value',
      });
    });

    it('should emit events on delete', async () => {
      await storage.set('key', 'value');

      const callback = vi.fn();
      storage.subscribe('*', callback);

      await storage.delete('key');

      expect(callback).toHaveBeenCalledWith({
        key: 'key',
        oldValue: 'value',
        newValue: null,
      });
    });

    it('should support pattern matching', async () => {
      const callback = vi.fn();
      storage.subscribe('user:*', callback);

      await storage.set('user:123', { name: 'Alice' });
      await storage.set('post:456', { title: 'Hello' });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ key: 'user:123' }));
    });

    it('should unsubscribe correctly', async () => {
      const callback = vi.fn();
      const unsubscribe = storage.subscribe('*', callback);

      await storage.set('key', 'value');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      await storage.set('key2', 'value2');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backend Fallback', () => {
    it('should use first available backend', async () => {
      const storage = await createStorage({
        backend: ['memory', 'localstorage'],
        name: 'test',
      });

      expect(storage.activeBackend).toBe('memory');
    });

    it('should call onFallback when falling back', async () => {
      const onFallback = vi.fn();

      // IndexedDB not implemented yet, should fall back to memory
      const storage = await createStorage({
        backend: ['indexeddb', 'memory'],
        name: 'test',
        onFallback,
      });

      expect(storage.activeBackend).toBe('memory');
      expect(onFallback).toHaveBeenCalledWith('indexeddb', 'memory', expect.stringContaining('IndexedDB'));
    });
  });

  describe('Features', () => {
    it('should report correct features for memory backend', async () => {
      const storage = await createStorage({
        backend: 'memory',
        name: 'test',
      });

      expect(storage.features).toEqual({
        encryption: false,
        quota: false,
        crossTab: false,
        persistence: false,
        migrations: false,
      });
    });
  });

  describe('Quota Usage', () => {
    it('should return quota info for memory backend', async () => {
      const usage = await storage.getQuotaUsage();
      expect(usage).toEqual({
        used: 0,
        available: Infinity,
        percent: 0,
      });
    });
  });
});
