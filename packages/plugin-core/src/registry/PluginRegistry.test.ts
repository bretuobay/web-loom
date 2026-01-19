import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from './PluginRegistry';
import { PluginManifest } from '../contracts';

const validManifest: PluginManifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  entry: 'remoteEntry.js',
};

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('should register a plugin with a valid manifest', () => {
      registry.register(validManifest);
      const plugin = registry.get('my-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.manifest).toEqual(validManifest);
      expect(plugin?.state).toBe('registered');
    });

    it('should throw an error for a manifest with a missing id', () => {
      const invalidManifest = { ...validManifest, id: undefined };
      // @ts-expect-error
      expect(() => registry.register(invalidManifest)).toThrow(/Invalid plugin manifest/);
    });

    it('should throw an error for a duplicate plugin id', () => {
      registry.register(validManifest);
      expect(() => registry.register(validManifest)).toThrow('Plugin with ID "my-plugin" is already registered.');
    });
  });

  describe('plugin retrieval helpers', () => {
    it('should expose registered plugins via get and getAll', () => {
      const manifestA = { ...validManifest, id: 'a' };
      const manifestB = { ...validManifest, id: 'b' };
      registry.register(manifestA);
      registry.register(manifestB);

      expect(registry.get('a')?.manifest.id).toBe('a');
      expect(registry.get('b')?.manifest.id).toBe('b');

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((def) => def.manifest.id)).toEqual(['a', 'b']);
    });

    it('should remove entries when unregister is called', () => {
      registry.register(validManifest);
      registry.unregister('my-plugin');
      expect(registry.get('my-plugin')).toBeUndefined();
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('resolveLoadOrder', () => {
    it('should correctly sort plugins with no dependencies', () => {
      const manifestA = { ...validManifest, id: 'a' };
      const manifestB = { ...validManifest, id: 'b' };
      registry.register(manifestA);
      registry.register(manifestB);
      const order = registry.resolveLoadOrder();
      expect(order).toHaveLength(2);
      expect(order).toContain('a');
      expect(order).toContain('b');
    });

    it('should correctly sort a simple dependency chain (a -> b)', () => {
      const manifestA = { ...validManifest, id: 'a', dependencies: { b: '1.0.0' } };
      const manifestB = { ...validManifest, id: 'b' };
      registry.register(manifestA);
      registry.register(manifestB);
      const order = registry.resolveLoadOrder();
      expect(order).toEqual(['b', 'a']);
    });

    it('should correctly sort a more complex dependency chain (a -> b, b -> c)', () => {
      const manifestA = { ...validManifest, id: 'a', dependencies: { b: '1.0.0' } };
      const manifestB = { ...validManifest, id: 'b', dependencies: { c: '1.0.0' } };
      const manifestC = { ...validManifest, id: 'c' };
      registry.register(manifestA);
      registry.register(manifestB);
      registry.register(manifestC);
      const order = registry.resolveLoadOrder();
      expect(order).toEqual(['c', 'b', 'a']);
    });

    it('should order plugins with shared dependencies before the dependents', () => {
      const dependent = { ...validManifest, id: 'dependent', dependencies: { base: '1.0.0', util: '1.0.0' } };
      const base = { ...validManifest, id: 'base' };
      const util = { ...validManifest, id: 'util' };
      registry.register(dependent);
      registry.register(base);
      registry.register(util);

      const order = registry.resolveLoadOrder();
      expect(order.indexOf('base')).toBeLessThan(order.indexOf('dependent'));
      expect(order.indexOf('util')).toBeLessThan(order.indexOf('dependent'));
    });

    it('should throw an error for a missing dependency', () => {
      const manifestA = { ...validManifest, id: 'a', dependencies: { b: '1.0.0' } };
      registry.register(manifestA);
      expect(() => registry.resolveLoadOrder()).toThrow(
        'Plugin "a" has an unresolved dependency: "b" is not registered.',
      );
    });

    it('should throw an error for a circular dependency (a -> b, b -> a)', () => {
      const manifestA = { ...validManifest, id: 'a', dependencies: { b: '1.0.0' } };
      const manifestB = { ...validManifest, id: 'b', dependencies: { a: '1.0.0' } };
      registry.register(manifestA);
      registry.register(manifestB);
      expect(() => registry.resolveLoadOrder()).toThrow('Circular dependency detected');
    });
  });
});
