import type { FormatTemplateOptions } from '@web-loom/template-core/compiler-node';
import { formatTemplate } from '@web-loom/template-core/compiler-node';
import type { SourceLinkedDiagnostic } from './source-linked-diagnostic.js';
import { linkTemplateDiagnosticToFile } from './source-linked-diagnostic.js';
import { DEFAULT_SPECIFIERS } from './constants.js';
import { findCompileCalls } from './find-compile-calls.js';

export interface FormatCompileCallsOptions extends Omit<FormatTemplateOptions, 'name' | 'sourcePath'> {
  filePath: string;
  specifiers?: string[];
}

export interface FormatCompileCallsResult {
  filePath: string;
  /** True when any template literal was reformatted. */
  changed: boolean;
  source: string;
  diagnostics: SourceLinkedDiagnostic[];
}

/** Encode decoded template text for insertion inside a backtick literal. */
export function encodeTemplateLiteralContent(content: string): string {
  return content.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Pretty-print static `compile(\`...\`)` and `context.compile(\`...\`)` literals in a source file.
 * Uses {@link formatTemplate} for each match (analyze-first, no second parser).
 */
export function formatCompileCallsInSource(
  source: string,
  options: FormatCompileCallsOptions,
): FormatCompileCallsResult {
  const specifiers = options.specifiers ?? DEFAULT_SPECIFIERS;
  const { matches } = findCompileCalls(source, options.filePath, specifiers);
  const diagnostics: SourceLinkedDiagnostic[] = [];

  if (matches.length === 0) {
    return { filePath: options.filePath, changed: false, source, diagnostics };
  }

  let next = source;
  let changed = false;

  for (const match of [...matches].reverse()) {
    const result = formatTemplate(match.templateSource, {
      ...options,
      name: match.name,
      sourcePath: options.filePath,
    });

    if (!result.ok) {
      for (const diagnostic of result.diagnostics) {
        if (diagnostic.severity !== 'error') continue;
        diagnostics.push(
          linkTemplateDiagnosticToFile({
            filePath: options.filePath,
            hostSource: source,
            match,
            diagnostic,
          }),
        );
      }
      continue;
    }

    if (result.unchanged || !result.formatted) continue;

    const encoded = encodeTemplateLiteralContent(result.formatted);
    next = next.slice(0, match.templateContentStart) + encoded + next.slice(match.templateContentEnd);
    changed = true;
  }

  return { filePath: options.filePath, changed, source: next, diagnostics };
}
