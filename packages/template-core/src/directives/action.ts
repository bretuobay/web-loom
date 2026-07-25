import { effect } from '@web-loom/signals-core';
import { evaluate, resolveInChain } from '../runtime/evaluate.js';
import type { BindingRecord, ElementAction, RenderContext, Scope } from '../types.js';
import type { DisposalBag } from '../runtime/disposal.js';

export function bindAction(
  record: Extract<BindingRecord, { kind: 'action' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  let currentFactory: ((element: Element) => unknown) | null = null;
  let currentResult: ElementAction | null = null;
  let initialized = false;

  const disposeResult = (): void => {
    currentResult?.dispose?.();
    currentResult = null;
  };

  const handle = effect(() => {
    const action =
      record.expr.kind === 'path'
        ? record.expr.parentHops === 0 && record.expr.segments.length === 1 && ctx.helpers[record.expr.segments[0]!]
          ? ctx.helpers[record.expr.segments[0]!]
          : resolveInChain(record.expr.segments, scope).value
        : evaluate(record.expr, scope, ctx.helpers);

    if (typeof action !== 'function') throw new TypeError('use: action expression must resolve to a function.');
    if (initialized && action === currentFactory) {
      currentResult?.update?.();
      return;
    }

    disposeResult();
    currentFactory = action as (element: Element) => unknown;
    const result = currentFactory(el);
    if (
      result != null &&
      (typeof result !== 'object' ||
        (typeof (result as ElementAction).dispose !== 'function' &&
          typeof (result as ElementAction).update !== 'function'))
    ) {
      throw new TypeError('use: action must return void or an object with update() and/or dispose().');
    }
    currentResult = result as ElementAction | null;
    initialized = true;
  });

  bag.add(() => {
    handle.dispose();
    disposeResult();
  });
}
