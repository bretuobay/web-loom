import type { AnalyzeCache } from './analyze-cache.js';
import { analyzeCompileCalls } from './analyze-file.js';
import type { CompileCallMatch } from '@web-loom/template-core-tooling';
import { reportDiagnostics, type DiagnosticReporter } from './format-diagnostic.js';

export interface DevAnalyzeParams {
  cache: AnalyzeCache;
  sourcePath: string;
  code: string;
  matches: CompileCallMatch[];
}

/**
 * Dev-only path: analyze static templates, report diagnostics, leave module source
 * unchanged. Cached by file content hash so unchanged files are not re-analyzed.
 */
export function runDevAnalyze(reporter: DiagnosticReporter, params: DevAnalyzeParams): void {
  const contentHash = params.cache.hash(params.code);
  const cached = params.cache.get(params.sourcePath, contentHash);
  if (cached) {
    if (!cached.ok) {
      reportDiagnostics(reporter, params.sourcePath, cached.diagnostics);
    }
    return;
  }

  const result = analyzeCompileCalls(params.code, params.matches, params.sourcePath);
  params.cache.set(params.sourcePath, {
    contentHash,
    ok: result.ok,
    diagnostics: result.diagnostics,
  });

  if (result.diagnostics.length > 0) {
    reportDiagnostics(reporter, params.sourcePath, result.diagnostics);
  }
}
