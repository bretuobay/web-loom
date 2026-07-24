import { effect } from '@web-loom/signals-core';
import { evaluate } from '../runtime/evaluate.js';
import type { DisposalBag } from '../runtime/disposal.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';

/** `style:prop="expr"` — sets one CSS property, removing it when the value is nullish. */
export function bindStyle(
  record: Extract<BindingRecord, { kind: 'style' }>,
  el: HTMLElement | SVGElement,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const handle = effect(() => {
    const value = evaluate(record.expr, scope, ctx.helpers);
    if (value == null) {
      el.style.removeProperty(record.prop);
    } else {
      el.style.setProperty(record.prop, String(value));
    }
  });
  bag.add(handle.dispose);
}
