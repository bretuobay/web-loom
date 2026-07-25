import { effect } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import { getExistingNodes, instantiate, applyBindings } from '../runtime/bindings.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { BlockRecord, RenderContext, Scope } from '../types.js';
export function bindSwitch(
  block: Extract<BlockRecord, { kind: 'switch' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let active = -1,
    child: DisposalBag | null = null,
    nodes: ChildNode[] = [];
  let hydrateNext = ctx.hydrating === true;
  const handle = effect(() => {
    const value = evaluate(block.source, scope, ctx.helpers);
    const idx = block.branches.findIndex((b) => b.value === null || evaluate(b.value, scope, ctx.helpers) === value);
    if (idx === active) return;
    child?.dispose();
    nodes.forEach((n) => n.remove());
    child = null;
    nodes = [];
    active = idx;
    if (idx >= 0) {
      child = bag.createChild();
      const template = block.branches[idx]!.template;
      const existing = hydrateNext ? getExistingNodes(anchor, template.blueprint.childNodes.length) : [];
      hydrateNext = false;
      if (existing.length === template.blueprint.childNodes.length) {
        applyBindings(template, existing, scope, ctx, child);
        nodes = existing;
      } else {
        const x = instantiate(template, scope, ctx, child);
        nodes = x.roots;
        anchor.after(x.fragment);
      }
    }
  });
  bag.add(() => {
    handle.dispose();
    child?.dispose();
    nodes.forEach((n) => n.remove());
  });
}
