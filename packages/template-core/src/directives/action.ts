import { evaluate, resolveInChain } from '../runtime/evaluate.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';
import type { DisposalBag } from '../runtime/disposal.js';
export function bindAction(
  record: Extract<BindingRecord, { kind: 'action' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const action =
    record.expr.kind === 'path'
      ? record.expr.parentHops === 0 && record.expr.segments.length === 1 && ctx.helpers[record.expr.segments[0]!]
        ? ctx.helpers[record.expr.segments[0]!]
        : resolveInChain(record.expr.segments, scope).value
      : evaluate(record.expr, scope, ctx.helpers);
  if (typeof action !== 'function') throw new TypeError('use: action expression must resolve to a function.');
  const result = (action as (element: Element) => unknown)(el);
  if (result != null && (typeof result !== 'object' || typeof (result as { dispose?: unknown }).dispose !== 'function'))
    throw new TypeError('use: action must return void or an object with dispose().');
  if (result) bag.add(() => (result as { dispose(): void }).dispose());
}
