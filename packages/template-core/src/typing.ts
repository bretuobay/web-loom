import { compile, fromPrecompiled } from './runtime/renderer.js';
import type { PrecompiledTemplateModule, Template, TemplateOptions } from './types.js';

/** Named helper functions available to template expressions via `options.helpers`. */
export type HelperMap = Record<string, (...args: unknown[]) => unknown>;

/**
 * Maps partial names to templates or source strings. When used with
 * {@link TemplateContextFactory.compile}, each value may be typed as
 * `Template<TPartials[K]> | string`.
 */
export type TypedPartialsMap<TPartials extends Record<string, object>> = {
  [K in keyof TPartials]: Template<TPartials[K]> | string;
};

export type TypedTemplateCompileOptions<TPartials extends Record<string, object> = Record<string, never>> = Omit<
  TemplateOptions,
  'partials' | 'helpers'
> & {
  partials?: TypedPartialsMap<TPartials>;
  helpers?: HelperMap;
};

/**
 * Maps each partial name to the context type that partial expects.
 * Pass as the `TPartials` generic to {@link TemplateContextFactory.compile} — TypeScript
 * then checks `options.partials` via {@link TypedPartialsMap}.
 *
 * @example
 * ```ts
 * type ShellPartials = PartialContexts<{
 *   header: TemplateAppBindings;
 *   'product-card': CatalogProductDto;
 * }>;
 *
 * const shell = declareContext<TemplateAppBindings>();
 * export const appShell = shell.compile<ShellPartials>(source, {
 *   partials: { header: headerTemplate, 'product-card': productCardTemplate },
 * });
 * ```
 */
export type PartialContexts<TPartials extends Record<string, object>> = TPartials;

/** @deprecated Use {@link PartialContexts} — partial contracts are type-only, not runtime values. */
export type PartialContextSchema<TPartials extends Record<string, object>> = PartialContexts<TPartials>;

/**
 * Factory returned by {@link declareContext}. Associates a compiled template with
 * a context type at the TypeScript layer — zero runtime cost.
 */
export interface TemplateContextFactory<TContext extends object> {
  compile<TPartials extends Record<string, object> = Record<string, never>>(
    source: string,
    options?: TypedTemplateCompileOptions<TPartials>,
  ): Template<TContext>;
  fromPrecompiled(module: PrecompiledTemplateModule, options?: TemplateOptions): Template<TContext>;
}

/**
 * Declares the ViewModel / bindings object shape for a template module.
 *
 * @example
 * ```ts
 * interface PageBindings { catalog: CatalogViewModel; formatMoney: (n: number) => string }
 * const page = declareContext<PageBindings>();
 * export const storefrontTemplate = page.compile(`<h1>{{ catalog.title$ }}</h1>`);
 * // mount/hydrate/outlet.show now require PageBindings at call sites
 * ```
 *
 * Expression paths inside the template (`{{ cart.items }}`) are **not** checked —
 * only the object passed to `mount()` / `hydrate()` / `outlet.show()`.
 */
export function declareContext<TContext extends object>(): TemplateContextFactory<TContext> {
  return {
    compile(source, options) {
      return compile<TContext>(source, options);
    },
    fromPrecompiled(module, options) {
      return fromPrecompiled<TContext>(module, options);
    },
  };
}

/** Shorthand for `declareContext<T>().compile(source, options)`. */
export function typedCompile<TContext extends object>(source: string, options?: TemplateOptions): Template<TContext> {
  return compile<TContext>(source, options);
}

/** Shorthand for `declareContext<T>().fromPrecompiled(module, options)`. */
export function typedFromPrecompiled<TContext extends object>(
  module: PrecompiledTemplateModule,
  options?: TemplateOptions,
): Template<TContext> {
  return fromPrecompiled<TContext>(module, options);
}
