import { effect } from '@web-loom/signals-core';
import { instantiate } from '../runtime/bindings.js';
import { compile, getTemplateRoot } from '../runtime/renderer.js';
import { evaluate } from '../runtime/evaluate.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { BlockRecord, RenderContext, Scope, Template } from '../types.js';
const cache = new Map<string, Template>();
export function bindPartial(
  block: Extract<BlockRecord, { kind: 'partial' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let child: DisposalBag | null = null,
    nodes: ChildNode[] = [];
  const handle = effect(() => {
    const source = ctx.partials?.[block.name] ?? ctx.registry?.get(block.name);
    if (!source) {
      const message = `${ctx.templateName ? `[${ctx.templateName}] ` : ''}Missing partial "${block.name}".`;
      if (ctx.strictPartials) throw new Error(message);
      (ctx.diagnostics?.warn ?? console.warn)(message, { partial: block.name, template: ctx.templateName });
      return;
    }
    let template: Template;
    if (typeof source === 'string') {
      template =
        cache.get(source) ??
        compile(source, {
          helpers: ctx.helpers,
          partials: ctx.partials,
          registry: ctx.registry,
          strictPartials: ctx.strictPartials,
          diagnostics: ctx.diagnostics,
          name: ctx.templateName ? `${ctx.templateName} > ${block.name}` : block.name,
        });
      cache.set(source, template);
    } else template = source;
    const context = block.context ? evaluate(block.context, scope, ctx.helpers) : scope.self;
    const partialStack = (ctx.partialStack ??= []);
    if (partialStack.includes(block.name))
      throw new Error(`Recursive partial expansion: ${[...partialStack, block.name].join(' → ')}`);
    if ((ctx.partialDepth ?? 0) >= 32)
      throw new Error(`Partial expansion depth exceeded while rendering "${block.name}".`);
    child?.dispose();
    nodes.forEach((n) => n.remove());
    child = bag.createChild();
    const partialScope: Scope = { parent: scope, self: context, locals: {} };
    ctx.partialDepth = (ctx.partialDepth ?? 0) + 1;
    partialStack.push(block.name);
    try {
      const x = instantiate(getTemplateRoot(template), partialScope, ctx, child);
      nodes = x.roots;
      anchor.after(x.fragment);
    } finally {
      partialStack.pop();
      ctx.partialDepth!--;
    }
  });
  bag.add(() => {
    handle.dispose();
    child?.dispose();
    nodes.forEach((n) => n.remove());
  });
}
