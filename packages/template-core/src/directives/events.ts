import { batch } from '@web-loom/signals-core';
import { evaluate, resolveInChain } from '../runtime/evaluate.js';
import type { DisposalBag } from '../runtime/disposal.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';

function hopScope(scope: Scope, hops: number): Scope | null {
  let s: Scope | null = scope;
  for (let i = 0; i < hops; i++) s = s?.parent ?? null;
  return s;
}

/**
 * `on:event="expr"`. Two forms (PRD §6.4):
 * - bare path (`on:click="increment"`) — resolved through the Scope Chain
 *   and invoked as `fn(event)`, with its owning object as `this`.
 * - call form (`on:click="remove(this)"`) — evaluated per the expression
 *   grammar with `this`, `$event`, and iteration helpers in scope.
 *
 * Every handler runs inside `batch()` so multiple synchronous Signal writes
 * notify dependents once (Requirement 7.4).
 */
export function bindEvent(
  record: Extract<BindingRecord, { kind: 'event' }>,
  el: Element,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const listener = (domEvent: Event) => {
    batch(() => {
      if (record.handler.kind === 'path') {
        const startScope = hopScope(scope, record.handler.parentHops);
        const { value: fn, owner } = startScope
          ? resolveInChain(record.handler.segments, startScope)
          : { value: undefined, owner: undefined };
        if (typeof fn !== 'function') {
          throw new TypeError(`"${record.handler.segments.join('.')}" is not a function (on:${record.event})`);
        }
        (fn as (...args: unknown[]) => unknown).call(owner, domEvent);
      } else {
        const callScope: Scope = {
          parent: scope.parent,
          self: scope.self,
          locals: { ...scope.locals, $event: domEvent },
        };
        evaluate(record.handler, callScope, ctx.helpers);
      }
    });
  };

  el.addEventListener(record.event, listener);
  bag.add(() => el.removeEventListener(record.event, listener));
}
