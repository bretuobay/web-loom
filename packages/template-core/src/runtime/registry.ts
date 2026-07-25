import type { PartialSource, TemplateRegistry } from '../types.js';

export function createTemplateRegistry(initial: Record<string, PartialSource> = {}): TemplateRegistry {
  const entries = new Map(Object.entries(initial));
  return {
    get: (name) => entries.get(name),
    set: (name, source) => entries.set(name, source),
    delete: (name) => entries.delete(name),
    has: (name) => entries.has(name),
  };
}
