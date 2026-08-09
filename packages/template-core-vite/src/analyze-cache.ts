import { createHash } from 'node:crypto';
import type { ReportableDiagnostic } from './format-diagnostic.js';

export interface AnalyzeCacheEntry {
  contentHash: string;
  ok: boolean;
  diagnostics: ReportableDiagnostic[];
}

/** In-memory analyze cache keyed by absolute file path and content hash. */
export class AnalyzeCache {
  private readonly entries = new Map<string, AnalyzeCacheEntry>();

  hash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  get(filePath: string, contentHash: string): AnalyzeCacheEntry | undefined {
    const entry = this.entries.get(filePath);
    return entry?.contentHash === contentHash ? entry : undefined;
  }

  set(filePath: string, entry: AnalyzeCacheEntry): void {
    this.entries.set(filePath, entry);
  }

  delete(filePath: string): void {
    this.entries.delete(filePath);
  }

  clear(): void {
    this.entries.clear();
  }
}
