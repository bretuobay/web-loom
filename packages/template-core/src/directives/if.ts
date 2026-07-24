import { effect } from '@web-loom/signals-core';
import { evaluate, truthy } from '../runtime/evaluate.js';
import { instantiate } from '../runtime/bindings.js';
import { DisposalBag } from '../runtime/disposal.js';
import type { BlockRecord, RenderContext, Scope } from '../types.js';

/**
 * `{{#if}}/{{else if}}/{{else}}`. A single outer effect evaluates branch
 * conditions top-down each run (short-circuiting via `findIndex`, so a
 * condition after the winning branch is never read — and therefore never
 * tracked as a dependency, satisfying "inactive branches subscribe to
 * nothing" for anything *inside* an inactive branch's body). Only when the
 * winning branch index actually changes does the mounted content swap: the
 * outgoing branch's DisposalBag is disposed (and its nodes removed) before
 * the incoming branch is instantiated and inserted after `anchor`.
 */
export function bindIf(
  block: Extract<BlockRecord, { kind: 'if' }>,
  anchor: Comment,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let activeIndex = -1;
  let activeBag: DisposalBag | null = null;
  let activeNodes: ChildNode[] = [];

  const handle = effect(() => {
    const idx = block.branches.findIndex(
      (branch) => branch.condition === null || truthy(evaluate(branch.condition, scope, ctx.helpers)),
    );

    if (idx === activeIndex) return;

    if (activeBag) {
      activeBag.dispose();
      for (const node of activeNodes) node.remove();
      activeBag = null;
      activeNodes = [];
    }

    activeIndex = idx;
    if (idx === -1) return;

    const branch = block.branches[idx]!;
    const childBag = bag.createChild();
    const { roots, fragment } = instantiate(branch.template, scope, ctx, childBag);
    activeNodes = roots;
    anchor.after(fragment);
    activeBag = childBag;
  });

  bag.add(() => {
    handle.dispose();
    if (activeBag) {
      activeBag.dispose();
      for (const node of activeNodes) node.remove();
    }
  });
}
