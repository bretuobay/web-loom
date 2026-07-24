import { effect } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import type { DisposalBag } from '../runtime/disposal.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';

/** `class:name="expr"` — toggles a single class on truthiness. */
export function bindClass(
  record: Extract<BindingRecord, { kind: 'class' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const handle = effect(() => {
    el.classList.toggle(record.name, Boolean(evaluate(record.expr, scope, ctx.helpers)));
  });
  bag.add(handle.dispose);
}
