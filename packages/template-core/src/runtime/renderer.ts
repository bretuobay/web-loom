import { parseTemplate } from '../compiler/parser.js';
import { applyBindings, instantiate } from './bindings.js';
import { DisposalBag } from './disposal.js';
import { createTemplateRegistry } from './registry.js';
import { deserializeRootTemplate } from '../compiler/plan.js';
import { reportDiagnostic } from './diagnostics.js';
import type {
  Disposable,
  RenderContext,
  RootTemplate,
  Scope,
  Template,
  TemplateOptions,
  TemplateRegistry,
} from '../types.js';

const globalRegistry = createTemplateRegistry();

class TemplateImpl<TVm extends object> implements Template<TVm> {
  constructor(
    readonly root: RootTemplate,
    private readonly options: TemplateOptions,
  ) {}

  private makeContext(): RenderContext {
    return {
      helpers: this.options.helpers ?? {},
      escape: this.options.escape ?? true,
      partials: this.options.partials,
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

  mount(container: Element, viewModel: TVm): Disposable {
    const bag = new DisposalBag();
    const scope: Scope = { parent: null, self: viewModel, locals: {} };
    const { roots, fragment } = instantiate(this.root, scope, this.makeContext(), bag);
    container.append(fragment);
    bag.add(() => {
      for (const node of roots) node.remove();
    });
    return { dispose: () => bag.dispose() };
  }

  render(viewModel: TVm): { node: DocumentFragment; dispose(): void } {
    const bag = new DisposalBag();
    const scope: Scope = { parent: null, self: viewModel, locals: {} };
    const { roots, fragment } = instantiate(this.root, scope, this.makeContext(), bag);
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
    const scope: Scope = { parent: null, self: viewModel, locals: {} };
    const roots = Array.from(container.childNodes);
    const context = this.makeContext();
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
 * `TVm` documents the intended ViewModel shape at the call site; template
 * expressions are not statically checked against it (a known limitation of
 * string templates — see PRD §7).
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
    const message = error instanceof Error ? error.message : String(error);
    const position = /position (\d+)/.exec(message)?.[1];
    const offset = position ? Number(position) : undefined;
    const before = offset === undefined ? '' : source.slice(0, offset);
    const diagnostic = {
      code: message.includes('expression') ? 'INVALID_EXPRESSION' : 'INVALID_TEMPLATE',
      severity: 'error' as const,
      message,
      template: options.name,
      sourcePath: options.sourcePath,
      ...(offset === undefined
        ? {}
        : { line: before.split('\n').length, column: offset - before.lastIndexOf('\n'), details: { offset } }),
    };
    options.diagnostics?.report?.(diagnostic);
    options.diagnostics?.error?.(message, diagnostic);
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

export function registerPartial(name: string, source: string | Template): void {
  globalRegistry.set(name, source);
}
export function unregisterPartial(name: string): void {
  globalRegistry.delete(name);
}

export function getGlobalTemplateRegistry(): TemplateRegistry {
  return globalRegistry;
}
