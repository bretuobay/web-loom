import { TemplateSyntaxError } from '../errors.js';
import type { TemplateDiagnostic } from '../types.js';

export interface SyntaxDiagnosticContext {
  name?: string;
  sourcePath?: string;
}

function locationAtOffset(source: string, offset: number): Pick<TemplateDiagnostic, 'line' | 'column' | 'details'> {
  const before = source.slice(0, offset);
  return {
    line: before.split('\n').length,
    column: offset - before.lastIndexOf('\n'),
    details: { offset },
  };
}

function diagnosticCodeForMessage(message: string): string {
  if (/expression/i.test(message)) return 'INVALID_EXPRESSION';
  if (/event modifier|modifiers \./i.test(message)) return 'MODIFIER_CONFLICT';
  if (/Unsupported bind target|bind:set|use:|on:/i.test(message)) return 'UNSUPPORTED_DIRECTIVE';
  return 'INVALID_TEMPLATE';
}

/**
 * Converts a compiler {@link TemplateSyntaxError} (or generic `Error`) into a
 * normalized {@link TemplateDiagnostic} with source coordinates when available.
 */
export function syntaxErrorToDiagnostic(
  error: unknown,
  source: string,
  context: SyntaxDiagnosticContext = {},
): TemplateDiagnostic {
  const message = error instanceof Error ? error.message : String(error);
  const position = /position (\d+)/.exec(message)?.[1];
  const offset = position ? Number(position) : undefined;

  return {
    code: diagnosticCodeForMessage(message),
    severity: 'error',
    message,
    template: context.name,
    sourcePath: context.sourcePath,
    ...(offset === undefined ? {} : locationAtOffset(source, offset)),
  };
}

export function isTemplateSyntaxError(error: unknown): error is TemplateSyntaxError {
  return error instanceof TemplateSyntaxError;
}
