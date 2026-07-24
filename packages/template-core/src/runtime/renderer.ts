import { parseTemplate } from '../compiler/parser.js';
import { instantiate } from './bindings.js';
import { DisposalBag } from './disposal.js';
import type { Disposable, RenderContext, RootTemplate, Scope, Template, TemplateOptions } from '../types.js';

class TemplateImpl<TVm extends object> implements Template<TVm> {
  constructor(
    private readonly root: RootTemplate,
    private readonly options: TemplateOptions,
  ) {}

  private makeContext(): RenderContext {
    return { helpers: this.options.helpers ?? {}, escape: this.options.escape ?? true };
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
