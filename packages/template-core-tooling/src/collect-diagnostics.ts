import { analyzeTemplate } from '@web-loom/template-core/compiler-node';
import { DEFAULT_SPECIFIERS } from './constants.js';
import type { CompileCallMatch } from './find-compile-calls.js';
import { findCompileCalls } from './find-compile-calls.js';
import {
  linkTemplateDiagnosticToFile,
  type SourceLinkedDiagnostic,
} from './source-linked-diagnostic.js';

export interface CollectSourceLinkedDiagnosticsOptions {
  specifiers?: string[];
  /** Partial names available at this call site (keys only — values are documentation paths). */
  partials?: Record<string, string>;
  strictPartials?: boolean;
  /** Top-level context keys templates mount against — enables `UNKNOWN_CONTEXT_PATH` analysis. */
  contextKeys?: string[];
}

function analyzeMatch(
  filePath: string,
  hostSource: string,
  match: CompileCallMatch,
  options: CollectSourceLinkedDiagnosticsOptions,
): SourceLinkedDiagnostic[] {
  const partialKeys = options.partials ? Object.keys(options.partials) : undefined;
  const partials = partialKeys ? Object.fromEntries(partialKeys.map((key) => [key, ''])) : undefined;

  const result = analyzeTemplate(match.templateSource, {
    name: match.name,
    sourcePath: filePath,
    partials,
    strictPartials: options.strictPartials ?? Boolean(partials),
    contextKeys: options.contextKeys,
  });

  return result.diagnostics.map((diagnostic) =>
    linkTemplateDiagnosticToFile({ filePath, hostSource, match, diagnostic }),
  );
}

/** Scans a host file for static `compile()` calls and returns editor-linked diagnostics. */
export function collectSourceLinkedDiagnostics(
  filePath: string,
  hostSource: string,
  options: CollectSourceLinkedDiagnosticsOptions = {},
): SourceLinkedDiagnostic[] {
  const specifiers = options.specifiers ?? DEFAULT_SPECIFIERS;
  const { matches } = findCompileCalls(hostSource, filePath, specifiers);
  return analyzeCompileMatches(filePath, hostSource, matches, options);
}

/** Analyzes pre-scanned `compile()` matches (used by the Vite transform hook). */
export function analyzeCompileMatches(
  filePath: string,
  hostSource: string,
  matches: CompileCallMatch[],
  options: CollectSourceLinkedDiagnosticsOptions = {},
): SourceLinkedDiagnostic[] {
  const diagnostics: SourceLinkedDiagnostic[] = [];
  for (const match of matches) {
    diagnostics.push(...analyzeMatch(filePath, hostSource, match, options));
  }
  return diagnostics;
}
