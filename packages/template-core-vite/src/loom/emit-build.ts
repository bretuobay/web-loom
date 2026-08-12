import { precompileNode } from '@web-loom/template-core/compiler-node';
import { escapeJsonForEmbedding } from '../escape-json.js';
import type { LoomEmitMetadata } from './constants.js';

/**
 * Build-mode virtual module: `fromPrecompiled(plan)` with no runtime parser in the bundle.
 */
export function emitLoomBuildModule(source: string, meta: LoomEmitMetadata): string {
  const plan = precompileNode(source, { name: meta.name, sourcePath: meta.sourcePath }).plan;
  const planText = escapeJsonForEmbedding(JSON.stringify({ plan }));
  return [
    `import { fromPrecompiled } from '${meta.specifier}';`,
    `export default fromPrecompiled(${planText});`,
    '',
  ].join('\n');
}
