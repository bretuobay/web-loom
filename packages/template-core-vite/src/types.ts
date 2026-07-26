export interface TemplateCorePrecompilePluginOptions {
  /** Files to scan for `compile(...)` call sites. Default: `[/\.tsx?$/]`. */
  include?: string | RegExp | (string | RegExp)[];
  /**
   * Files to skip even if they match `include`. Default excludes test/spec files,
   * `__tests__`/`__fixtures__` directories, `benchmarks`, and `node_modules` — this is
   * defense-in-depth on top of `apply: 'build'`, since a template's `compile()`
   * error-path unit tests must keep exercising the real runtime parser.
   */
  exclude?: string | RegExp | (string | RegExp)[];
  /**
   * Module specifiers whose named `compile` export is a precompile target. Default:
   * `['@web-loom/template-core', '@web-loom/template-core/ssr']`.
   */
  specifiers?: string[];
}
