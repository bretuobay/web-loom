import { analyzeCompileMatches, type SourceLinkedDiagnostic } from '@web-loom/template-core-tooling';
import type { CompileCallMatch } from '@web-loom/template-core-tooling';

export type ReportableDiagnostic = SourceLinkedDiagnostic;

export interface FileAnalyzeResult {
  ok: boolean;
  diagnostics: ReportableDiagnostic[];
}

/** Runs Node-safe analysis for every static `compile(\`...\`)` call site in a file. */
export function analyzeCompileCalls(
  hostSource: string,
  matches: CompileCallMatch[],
  sourcePath: string,
): FileAnalyzeResult {
  const diagnostics = analyzeCompileMatches(sourcePath, hostSource, matches);
  const ok = !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return { ok, diagnostics };
}
