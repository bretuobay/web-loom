import type { SourceLinkedDiagnostic } from '@web-loom/template-core-tooling';
import { formatSourceLinkedDiagnostic } from '@web-loom/template-core-tooling';

export type ReportableDiagnostic = SourceLinkedDiagnostic;

export function formatDiagnostic(_sourcePath: string, diagnostic: ReportableDiagnostic): string {
  return formatSourceLinkedDiagnostic(diagnostic);
}

export interface DiagnosticReporter {
  warn(message: string): void;
  error(message: string): never;
}

export function reportDiagnostics(
  reporter: DiagnosticReporter,
  _sourcePath: string,
  diagnostics: ReportableDiagnostic[],
): void {
  for (const diagnostic of diagnostics) {
    const message = formatSourceLinkedDiagnostic(diagnostic);
    if (diagnostic.severity === 'error') {
      reporter.error(message);
    } else {
      reporter.warn(message);
    }
  }
}
