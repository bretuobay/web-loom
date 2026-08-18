import { createHash } from 'node:crypto';
import type { PrecompileTransformResult } from './precompile-transform.js';

export interface PrecompileCacheEntry extends PrecompileTransformResult {
  contentHash: string;
}

/** In-memory precompile transform cache keyed by file path and source content hash. */
export class PrecompileCache {
  private readonly entries = new Map<string, PrecompileCacheEntry>();

  hash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  get(filePath: string, contentHash: string): PrecompileCacheEntry | undefined {
    const entry = this.entries.get(filePath);
    return entry?.contentHash === contentHash ? entry : undefined;
  }

  set(filePath: string, entry: PrecompileCacheEntry): void {
    this.entries.set(filePath, entry);
  }

  delete(filePath: string): void {
    this.entries.delete(filePath);
  }

  clear(): void {
    this.entries.clear();
  }
}
