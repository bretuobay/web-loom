import MagicString from 'magic-string';
import { precompileNode } from '@web-loom/template-core/compiler-node';
import { escapeJsonForEmbedding } from './escape-json.js';
import type { FindCompileCallsResult } from '@web-loom/template-core-tooling';

export interface PrecompileTransformContext {
  error(message: string): never;
}

export type PrecompileTransformResult = {
  code: string;
  map: ReturnType<MagicString['generateMap']> | null;
};

export function transformPrecompile(
  ctx: PrecompileTransformContext,
  code: string,
  id: string,
  found: FindCompileCallsResult,
): PrecompileTransformResult {
  const magicString = new MagicString(code);

  for (const match of found.matches) {
    let plan: unknown;
    try {
      plan = precompileNode(match.templateSource, { name: match.name, sourcePath: id }).plan;
    } catch (error) {
      ctx.error(
        `template-core-precompile: failed to precompile template${match.name ? ` "${match.name}"` : ''} in ${id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const planText = escapeJsonForEmbedding(JSON.stringify({ plan }));
    const replacement = match.optionsText
      ? `fromPrecompiled(${planText}, ${match.optionsText})`
      : `fromPrecompiled(${planText})`;

    magicString.overwrite(match.start, match.end, replacement);
  }

  for (const [specifier, { afterPos }] of found.specifiersNeedingImport) {
    magicString.appendLeft(afterPos, `\nimport { fromPrecompiled } from '${specifier}';`);
  }

  return {
    code: magicString.toString(),
    map: magicString.generateMap({ hires: true, source: id, includeContent: true }),
  };
}
