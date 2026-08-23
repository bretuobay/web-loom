import { collectSourceLinkedDiagnostics, type SourceLinkedDiagnostic } from '@web-loom/template-core-tooling';
import type { TemplateCoreLintSettings } from './settings.js';

export type TemplateLintIssue = SourceLinkedDiagnostic & {
  /** @deprecated Use `code` — kept for rule internals during transition. */
  diagnosticCode: string;
};

export function collectTemplateLintIssues(
  filename: string,
  sourceText: string,
  settings: TemplateCoreLintSettings,
): TemplateLintIssue[] {
  return collectSourceLinkedDiagnostics(filename, sourceText, {
    specifiers: settings.specifiers,
    partials: settings.partials,
    partialProps: settings.partialProps,
    strictPartials: settings.strictPartials,
    contextKeys: settings.contextKeys,
  }).map((diagnostic) => ({
    ...diagnostic,
    diagnosticCode: diagnostic.code,
  }));
}
