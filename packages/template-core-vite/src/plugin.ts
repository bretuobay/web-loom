import { createFilter, type Plugin } from 'vite';
import { DEFAULT_SPECIFIERS, findCompileCalls } from '@web-loom/template-core-tooling';
import { AnalyzeCache } from './analyze-cache.js';
import { DEFAULT_EXCLUDE, DEFAULT_INCLUDE } from './constants.js';
import { runDevAnalyze } from './dev-analyze.js';
import { runDevPrecompile } from './dev-precompile.js';
import { PrecompileCache } from './precompile-cache.js';
import { transformPrecompile } from './precompile-transform.js';
import type { TemplateCorePrecompilePluginOptions } from './types.js';

/**
 * Vite plugin for `@web-loom/template-core`:
 *
 * - **Build** (`vite build`): rewrites static `compile(\`...\`)` call sites to
 *   `fromPrecompiled(plan)` via `precompileNode()`.
 * - **Dev analyze** (`dev: 'analyze'`): runs `analyzeTemplate()` on changed files,
 *   reports diagnostics to the terminal, and leaves source unchanged.
 * - **Dev precompile** (`dev: 'precompile'`): same rewrite as build during `vite dev`,
 *   with an in-memory cache for stable HMR output.
 */
export function templateCorePrecompile(options: TemplateCorePrecompilePluginOptions = {}): Plugin {
  const include = options.include ?? DEFAULT_INCLUDE;
  const exclude = options.exclude ?? DEFAULT_EXCLUDE;
  const specifiers = options.specifiers ?? DEFAULT_SPECIFIERS;
  const filter = createFilter(include, exclude);
  const analyzeCache = new AnalyzeCache();
  const precompileCache = new PrecompileCache();

  let devAnalyze = false;
  let devPrecompile = false;
  let buildMode = false;

  return {
    name: 'template-core-vite',
    apply(_config, env) {
      return env.command === 'build' || options.dev === 'analyze' || options.dev === 'precompile';
    },
    configResolved(config) {
      devAnalyze = config.command === 'serve' && options.dev === 'analyze';
      devPrecompile = config.command === 'serve' && options.dev === 'precompile';
      buildMode = config.command === 'build';
    },
    transform(code, id) {
      if (!filter(id)) return null;
      if (!specifiers.some((specifier) => code.includes(specifier))) return null;

      const found = findCompileCalls(code, id, specifiers);
      if (found.matches.length === 0) return null;

      if (devAnalyze) {
        runDevAnalyze(this, { cache: analyzeCache, sourcePath: id, code, matches: found.matches });
        return null;
      }

      if (devPrecompile) {
        return runDevPrecompile(this, { cache: precompileCache, sourcePath: id, code, found });
      }

      if (buildMode) {
        return transformPrecompile(this, code, id, found);
      }

      return null;
    },
  };
}
