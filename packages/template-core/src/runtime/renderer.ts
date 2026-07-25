import { parseTemplate } from '../compiler/parser.js';
import { applyBindings, instantiate } from './bindings.js';
import { DisposalBag } from './disposal.js';
import { createTemplateRegistry } from './registry.js';
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
        warn: this.options.diagnostics?.warn ?? ((message) => console.warn(message)),
        error: this.options.diagnostics?.error ?? ((message) => console.error(message)),
      },
      partialDepth: 0,
      partialStack: [],
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
    const expected = this.renderToString(viewModel);
    const reportMismatch = (message: string): void => {
      (this.options.diagnostics?.warn ?? console.warn)(
        `${this.options.name ? `[${this.options.name}] ` : ''}${message}`,
        { kind: 'hydration-mismatch', template: this.options.name },
      );
    };
    if (this.root.blocks.length > 0 || container.innerHTML !== expected) {
      if (container.innerHTML !== expected) reportMismatch('Hydration markup mismatch; remounting the template.');
      else reportMismatch('Hydration encountered dynamic blocks; remounting the template region.');
      container.replaceChildren();
      return this.mount(container, viewModel);
    }
    const bag = new DisposalBag();
    const scope: Scope = { parent: null, self: viewModel, locals: {} };
    const roots = Array.from(container.childNodes);
    applyBindings(this.root, roots, scope, this.makeContext(), bag);
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
  const root = parseTemplate(source);
  return new TemplateImpl<TVm>(root, options);
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
