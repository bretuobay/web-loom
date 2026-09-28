import { analyzeCompiledTemplate, type Template } from '@web-loom/template-core';

const PROP_CODES = new Set(['MISSING_PARTIAL_PROP', 'UNKNOWN_PARTIAL_PROP']);

/** Warn (or throw under `strictPartials`) when child call sites do not match `props`. */
export function warnPartialPropDiagnostics(template: Template, name?: string): void {
  if (!template.partials) return;
  for (const diagnostic of analyzeCompiledTemplate(template, { name, partials: template.partials })) {
    if (!PROP_CODES.has(diagnostic.code)) continue;
    const message = `[${diagnostic.code}] ${diagnostic.message}`;
    if (diagnostic.severity === 'error') throw new Error(message);
    console.warn(message);
  }
}
