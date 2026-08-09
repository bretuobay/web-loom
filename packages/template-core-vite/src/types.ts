export interface TemplateCorePrecompilePluginOptions {
  /** Files to scan for `compile(...)` call sites. Default: `[/\.tsx?$/]`. */
  include?: string | RegExp | (string | RegExp)[];
  /**
   * Files to skip even if they match `include`. Default excludes test/spec files,
   * `__tests__`/`__fixtures__` directories, `benchmarks`, and `node_modules`.
   */
  exclude?: string | RegExp | (string | RegExp)[];
  /**
   * Module specifiers whose named `compile` export is a precompile/analyze target. Default:
   * `['@web-loom/template-core', '@web-loom/template-core/ssr']`.
   */
  specifiers?: string[];
  /**
   * Dev-server behavior. Default: plugin inactive during `vite dev`.
   *
   * - `'analyze'`: run `analyzeTemplate()` on static `compile(\`...\`)` call sites,
   *   emit diagnostics (errors fail the transform), leave source unchanged.
   * - `'precompile'`: rewrite to `fromPrecompiled(plan)` like `vite build`, with an
   *   in-memory cache so unchanged files skip re-precompilation on HMR.
   */
  dev?: 'analyze' | 'precompile';
}
