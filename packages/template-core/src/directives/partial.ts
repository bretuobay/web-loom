import { effect } from '@web-loom/signals-core';
import { instantiate } from '../runtime/bindings.js';
import { compile } from '../runtime/renderer.js';
import { evaluate } from '../runtime/evaluate.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { BlockRecord, RenderContext, RootTemplate, Scope, Template } from '../types.js';
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
    const source = ctx.partials?.[block.name];
    if (!source) {
      console.warn(`Missing partial "${block.name}".`);
      return;
    }
    let template: Template;
    if (typeof source === 'string') {
      template = cache.get(source) ?? compile(source, { helpers: ctx.helpers, partials: ctx.partials });
      cache.set(source, template);
    } else template = source;
    const context = block.context ? evaluate(block.context, scope, ctx.helpers) : scope.self;
    if ((ctx.partialDepth ?? 0) >= 32)
      throw new Error(`Partial expansion depth exceeded while rendering "${block.name}".`);
    child?.dispose();
    nodes.forEach((n) => n.remove());
    child = bag.createChild();
    const partialScope: Scope = { parent: scope, self: context, locals: {} };
    ctx.partialDepth = (ctx.partialDepth ?? 0) + 1;
    try {
      const x = instantiate((template as Template & { root: RootTemplate }).root, partialScope, ctx, child);
      nodes = x.roots;
      anchor.after(x.fragment);
    } finally {
      ctx.partialDepth!--;
    }
  });
  bag.add(() => {
    handle.dispose();
    child?.dispose();
    nodes.forEach((n) => n.remove());
  });
}
