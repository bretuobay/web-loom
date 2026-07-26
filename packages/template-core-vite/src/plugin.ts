import { createFilter, type Plugin } from 'vite';
import MagicString from 'magic-string';
import { precompileNode } from '@web-loom/template-core/compiler-node';
import { findCompileCalls } from './find-compile-calls.js';
import type { TemplateCorePrecompilePluginOptions } from './types.js';

const DEFAULT_INCLUDE = [/\.tsx?$/];
const DEFAULT_EXCLUDE = [/\.(test|spec)\.tsx?$/, /__tests__\//, /__fixtures__\//, /benchmarks\//, /node_modules\//];
const DEFAULT_SPECIFIERS = ['@web-loom/template-core', '@web-loom/template-core/ssr'];

/** U+2028/U+2029 aren't escaped by JSON.stringify; some tooling in the bundle chain still chokes on them raw. */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

function escapeJsonForEmbedding(json: string): string {
  return json.split(LINE_SEPARATOR).join('\\u2028').split(PARAGRAPH_SEPARATOR).join('\\u2029');
}

/**
 * Vite build-time plugin: replaces `compile(\`literal\`, options?)` call sites imported
 * from `@web-loom/template-core`(/ssr) with `fromPrecompiled(plan, options?)`, embedding a
 * plan produced by `precompileNode()` so the runtime HTML parser never runs for that
 * template in the shipped bundle. Only applies during `vite build` (`apply: 'build'`) —
 * dev/serve is untouched, matching `compile()`'s existing runtime behavior. Only
 * `.tsx?` files matching a target specifier and having a literal (no `${}`) first
 * argument are rewritten; anything else (e.g. a source imported from another module) is
 * left as a normal runtime `compile()` call, not an error.
 *
 * Known limitation: `precompileNode()` only parses HTML structure (parse5); it does not
 * validate `{{ }}` expressions, which are still parsed lazily on first render. A
 * malformed expression still won't fail the build — only first render, same as today.
 */
export function templateCorePrecompile(options: TemplateCorePrecompilePluginOptions = {}): Plugin {
  const include = options.include ?? DEFAULT_INCLUDE;
  const exclude = options.exclude ?? DEFAULT_EXCLUDE;
  const specifiers = options.specifiers ?? DEFAULT_SPECIFIERS;
  const filter = createFilter(include, exclude);

  return {
    name: 'template-core-precompile',
    apply: 'build',
    enforce: 'pre',
    transform(code, id) {
      if (!filter(id)) return null;
      if (!specifiers.some((specifier) => code.includes(specifier))) return null;

      const { matches, specifiersNeedingImport } = findCompileCalls(code, id, specifiers);
      if (matches.length === 0) return null;

      const magicString = new MagicString(code);

      for (const match of matches) {
        let plan: unknown;
        try {
          plan = precompileNode(match.templateSource, { name: match.name, sourcePath: id }).plan;
        } catch (error) {
          this.error(
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

      for (const [specifier, { afterPos }] of specifiersNeedingImport) {
        magicString.appendLeft(afterPos, `\nimport { fromPrecompiled } from '${specifier}';`);
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true, source: id, includeContent: true }),
      };
    },
  };
}
