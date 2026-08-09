import { preprocess } from './preprocess.js';
import { parseTemplate } from './parser.js';
import { createSourceMap, serializeRootTemplate } from './plan.js';
import { runWithDom } from './dom-env.js';
import { collectStaticDiagnostics } from './static-diagnostics.js';
import { syntaxErrorToDiagnostic } from './syntax-diagnostic.js';
import type { AnalyzeOptions, AnalyzeResult, SerializableTemplatePlan } from '../types.js';

/**
 * Node-safe full template analysis: parses directives, expressions, and blocks
 * via the same browser compiler path (jsdom-backed), emits structured diagnostics,
 * and returns a `compiled: true` serializable render plan.
 *
 * Does not throw on syntax errors — inspect {@link AnalyzeResult.ok} and
 * `diagnostics` instead. {@link precompileNode} wraps this and throws on failure.
 */
export function analyzeTemplate(source: string, options: AnalyzeOptions = {}): AnalyzeResult {
  const preprocessed = preprocess(source);
  const basePlan: SerializableTemplatePlan = {
    version: 2,
    source,
    preprocessed,
    name: options.name,
    sourcePath: options.sourcePath,
  };

  try {
    return runWithDom(() => {
      const root = parseTemplate(source);
      const sourceMap = createSourceMap(root, source);
      const diagnostics = collectStaticDiagnostics(root, sourceMap, options);
      const plan: SerializableTemplatePlan = {
        ...basePlan,
        sourceMap,
        root: serializeRootTemplate(root),
      };
      const ok = !diagnostics.some((diagnostic) => diagnostic.severity === 'error');
      return { ok, diagnostics, plan };
    });
  } catch (error) {
    const diagnostics = [syntaxErrorToDiagnostic(error, source, options)];
    return { ok: false, diagnostics, plan: basePlan };
  }
}
