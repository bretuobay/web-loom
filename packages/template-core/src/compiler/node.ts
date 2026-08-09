import { TemplateSyntaxError } from '../errors.js';
import type { PrecompileOptions, PrecompiledTemplateModule } from '../types.js';
import { analyzeTemplate } from './analyze.js';

export { analyzeTemplate } from './analyze.js';
export { formatTemplate } from './format.js';
export type { AnalyzeOptions, AnalyzeResult, FormatTemplateOptions, FormatTemplateResult } from '../types.js';

/**
 * Node-only precompiler: runs full template analysis and returns a complete,
 * `compiled: true` serializable render plan (bindings, blocks, expression ASTs).
 *
 * Throws {@link TemplateSyntaxError} when analysis reports error-severity diagnostics.
 */
export function precompileNode(source: string, options: PrecompileOptions = {}): PrecompiledTemplateModule {
  const result = analyzeTemplate(source, options);
  if (!result.ok) {
    const firstError = result.diagnostics.find((diagnostic) => diagnostic.severity === 'error');
    throw new TemplateSyntaxError(firstError?.message ?? 'Template analysis failed.');
  }
  return { plan: result.plan };
}
