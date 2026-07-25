import type { RenderContext, TemplateDiagnostic } from '../types.js';

export function reportDiagnostic(ctx: RenderContext, diagnostic: TemplateDiagnostic): void {
  const location =
    diagnostic.line === undefined && diagnostic.nodePath ? ctx.sourceMap?.[diagnostic.nodePath.join('.')] : undefined;
  const normalized = location ? { ...diagnostic, ...location } : diagnostic;
  ctx.reportDiagnostic?.(normalized);
  ctx.diagnostics?.report?.(normalized);

  const details = {
    code: normalized.code,
    severity: normalized.severity,
    template: normalized.template,
    sourcePath: normalized.sourcePath,
    line: normalized.line,
    column: normalized.column,
    expression: normalized.expression,
    nodePath: normalized.nodePath,
    ...((normalized.details as Record<string, unknown> | undefined) ?? {}),
  };
  if (normalized.severity === 'error') {
    ctx.diagnostics?.error?.(normalized.message, details);
  } else {
    ctx.diagnostics?.warn?.(normalized.message, details);
  }
}
