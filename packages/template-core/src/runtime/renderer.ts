import { parseTemplate } from '../compiler/parser.js';
import { collectStaticDiagnostics } from '../compiler/static-diagnostics.js';
import { syntaxErrorToDiagnostic } from '../compiler/syntax-diagnostic.js';
import { applyBindings, instantiate } from './bindings.js';
import { DisposalBag } from './disposal.js';
import { createTemplateRegistry } from './registry.js';
import { deserializeRootTemplate } from '../compiler/plan.js';
import { reportDiagnostic } from './diagnostics.js';
import type {
  AnalyzeOptions,
  Disposable,
  RenderContext,
  RootTemplate,
  Scope,
  Template,
  TemplateDiagnostic,
  TemplateOptions,
  TemplateRegistry,
} from '../types.js';

/**
 * Browser-only default partial registry, used when `compile()` (this module's
 * export, the `.` package entry) isn't given an explicit `registry` option.
 *
 * This is never consulted by `@web-loom/template-core/ssr` — `ServerTemplate`
 * builds a fresh `RenderContext` per call with `registry: options.registry`
 * and no fallback to this singleton (see `ssr/server.ts`'s
 * `renderNodesFromContext`). Registering a partial here from server code has
 * no effect on SSR output; SSR request isolation does not depend on this
 * registry ever being empty or unused.
 */
const globalRegistry = createTemplateRegistry();

class TemplateImpl<TVm extends object> implements Template<TVm> {
  isolated?: boolean;
  createContext?: Template['createContext'];
  partials?: Template['partials'];
  props?: readonly string[];

  constructor(
    readonly root: RootTemplate,
    private readonly options: TemplateOptions,
  ) {
    this.isolated = options.isolated;
    this.createContext = options.createContext;
    this.partials = options.partials;
    this.props = options.props;
  }

  collectDiagnostics(options: AnalyzeOptions = {}): TemplateDiagnostic[] {
    return collectStaticDiagnostics(this.root, this.options.sourceMap, {
      name: options.name ?? this.options.name,
      sourcePath: options.sourcePath ?? this.options.sourcePath,
      partials: options.partials ?? this.partials,
      partialProps: options.partialProps,
      strictPartials: options.strictPartials ?? this.options.strictPartials,
      contextKeys: options.contextKeys,
    });
  }

  private makeContext(): RenderContext {
    return {
      helpers: this.options.helpers ?? {},
      escape: this.options.escape ?? true,
      partials: this.partials,
      registry: this.options.registry ?? globalRegistry,
      templateName: this.options.name,
      strictPartials: this.options.strictPartials ?? false,
      diagnostics: {
        report: this.options.diagnostics?.report,
        warn: this.options.diagnostics?.warn ?? ((message) => console.warn(message)),
        error: this.options.diagnostics?.error ?? ((message) => console.error(message)),
      },
      sourcePath: this.options.sourcePath,
      sourceMap: this.options.sourceMap,
      partialDepth: 0,
      partialStack: [],
      hydrating: false,
    };
  }

  private resolveMountModel(viewModel: TVm, bag: DisposalBag): TVm {
    const created = this.createContext?.(asPropsObject(viewModel));
    if (created?.dispose) bag.add(created.dispose);
    return (created?.context ?? viewModel) as TVm;
  }

  private makeRootScope(viewModel: TVm, ctx: RenderContext): Scope {
    const scope: Scope = { parent: null, self: viewModel, locals: {} };
    if (this.options.dev) {
      const seen = new Set<string>();
      scope.onUnresolved = (rootSegment) => {
        if (seen.has(rootSegment)) return;
        seen.add(rootSegment);
        reportDiagnostic(ctx, {
          code: 'UNRESOLVED_CONTEXT_PATH',
          severity: 'warning',
          message: `Template path root "${rootSegment}" does not exist on the scope it resolves against — a typo or missing context key renders as empty output.`,
          template: this.options.name,
          sourcePath: this.options.sourcePath,
          details: { kind: 'unresolved-context-path', rootSegment },
        });
      };
    }
    return scope;
  }

  mount(container: Element, viewModel: TVm): Disposable {
    const bag = new DisposalBag();
    const ctx = this.makeContext();
    const scope = this.makeRootScope(this.resolveMountModel(viewModel, bag), ctx);
    const { roots, fragment } = instantiate(this.root, scope, ctx, bag);
    container.append(fragment);
    bag.add(() => {
      for (const node of roots) node.remove();
    });
    return { dispose: () => bag.dispose() };
  }

  render(viewModel: TVm): { node: DocumentFragment; dispose(): void } {
    const bag = new DisposalBag();
    const ctx = this.makeContext();
    const scope = this.makeRootScope(this.resolveMountModel(viewModel, bag), ctx);
    const { roots, fragment } = instantiate(this.root, scope, ctx, bag);
    bag.add(() => {
      for (const node of roots) node.remove();
    });
    return { node: fragment, dispose: () => bag.dispose() };
  }

  renderToString(viewModel: TVm): string {
    const rendered = this.render(viewModel);
    const template = document.createElement('template');
    template.content.append(rendered.node);
    const html = template.innerHTML;
    rendered.dispose();
    return html;
  }

  hydrate(container: Element, viewModel: TVm): Disposable {
    const existingRoots = Array.from(container.childNodes);
    const expectedRoots = this.root.blueprint.childNodes;
    const sameShape =
      existingRoots.length === expectedRoots.length &&
      existingRoots.every((node, index) => {
        const expected = expectedRoots[index]!;
        return (
          node.nodeType === expected.nodeType &&
          (node.nodeType !== Node.ELEMENT_NODE || (node as Element).tagName === (expected as Element).tagName)
        );
      });
    if (!sameShape) {
      reportDiagnostic(this.makeContext(), {
        code: 'HYDRATION_ROOT_MISMATCH',
        severity: 'warning',
        message: 'Hydration markup mismatch; remounting the template. Rebuilding the root region only.',
        template: this.options.name,
        sourcePath: this.options.sourcePath,
        details: { kind: 'hydration-mismatch' },
      });
      existingRoots.forEach((node) => node.remove());
      return this.mount(container, viewModel);
    }
    const bag = new DisposalBag();
    const context = this.makeContext();
    const scope = this.makeRootScope(this.resolveMountModel(viewModel, bag), context);
    const roots = Array.from(container.childNodes);
    context.hydrating = true;
    try {
      applyBindings(this.root, roots, scope, context, bag);
    } catch (error) {
      bag.dispose();
      reportDiagnostic(context, {
        code: 'HYDRATION_REGION_MISMATCH',
        severity: 'warning',
        message: `Hydration structure mismatch; rebuilding the template root region. ${error instanceof Error ? error.message : String(error)}`,
        template: this.options.name,
        sourcePath: this.options.sourcePath,
        details: { kind: 'hydration-mismatch' },
      });
      roots.forEach((node) => node.remove());
      return this.mount(container, viewModel);
    }
    bag.add(() => roots.forEach((node) => node.remove()));
    return { dispose: () => bag.dispose() };
  }
}

/**
 * Compiles a template source string into a reusable {@link Template}. Pure
 * runtime parsing — no build step, no `eval`/`new Function` (PRD §2, §6.7).
 *
 * ```ts
 * import { signal } from '@web-loom/signals-core';
 * import { compile } from '@web-loom/template-core';
 *
 * const template = compile(`
 *   <button on:click="increment">Count: {{ count$ }}</button>
 * `);
 *
 * const vm = { count$: signal(0), increment: () => vm.count$.update((n) => n + 1) };
 * const view = template.mount(document.getElementById('app')!, vm);
 * // later: view.dispose();
 * ```
 *
 * `TVm` documents the intended ViewModel shape at the call site; use
 * {@link declareContext} for ergonomic typing. Template expression paths are not
 * statically checked — see `docs/typing-spike.md`.
 *
 * `options.delimiters` is accepted for forward compatibility with the PRD's
 * public API but is not yet implemented in Phase 1 — templates always use
 * `{{ }}` / `{{{ }}}`.
 */
export function compile<TVm extends object = object>(source: string, options: TemplateOptions = {}): Template<TVm> {
  let root: RootTemplate;
  try {
    root = parseTemplate(source);
  } catch (error) {
    const diagnostic = syntaxErrorToDiagnostic(error, source, options);
    options.diagnostics?.report?.(diagnostic);
    options.diagnostics?.error?.(diagnostic.message, diagnostic);
    throw error;
  }
  return new TemplateImpl<TVm>(root, options);
}

export function fromPrecompiled<TVm extends object = object>(
  module: {
    plan: {
      version: number;
      root?: import('../types.js').SerializableRootTemplate;
      name?: string;
      source: string;
      sourcePath?: string;
      sourceMap?: Record<string, import('../types.js').SourceLocation>;
    };
  },
  options: TemplateOptions = {},
): Template<TVm> {
  if (module.plan.version !== 2 || !module.plan.root) {
    const message = 'Unsupported or incomplete precompiled template plan; regenerate it with template-core v1.2+.';
    const diagnostic = {
      code: 'PRECOMPILED_PLAN_VERSION',
      severity: 'error' as const,
      message,
      template: options.name,
    };
    options.diagnostics?.report?.(diagnostic);
    options.diagnostics?.error?.(message, diagnostic);
    throw new Error(message);
  }
  return new TemplateImpl<TVm>(deserializeRootTemplate(module.plan.root), {
    ...options,
    name: options.name ?? module.plan.name,
    sourcePath: options.sourcePath ?? module.plan.sourcePath,
    sourceMap: options.sourceMap ?? module.plan.sourceMap,
  });
}

export function getTemplateRoot(template: Template): RootTemplate {
  if (!(template instanceof TemplateImpl))
    throw new TypeError('The supplied Template was not compiled by template-core.');
  return template.root;
}

/**
 * Runs the same static checks as {@link analyzeTemplate} against an already
 * compiled browser template — used when children are attached after compile
 * (`defineComponent({ partials })`, `withPartials`).
 */
export function analyzeCompiledTemplate(template: Template, options: AnalyzeOptions = {}): TemplateDiagnostic[] {
  if (!(template instanceof TemplateImpl)) return [];
  return template.collectDiagnostics(options);
}

/** Browser-only. Mutates the module-level {@link globalRegistry} — has no effect on SSR renders. */
export function registerPartial(name: string, source: string | Template): void {
  globalRegistry.set(name, source);
}
/** Browser-only. Mutates the module-level {@link globalRegistry} — has no effect on SSR renders. */
export function unregisterPartial(name: string): void {
  globalRegistry.delete(name);
}

export function getGlobalTemplateRegistry(): TemplateRegistry {
  return globalRegistry;
}

function asPropsObject(value: unknown): object {
  return value != null && typeof value === 'object' ? value : {};
}
