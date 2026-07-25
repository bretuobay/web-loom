import { batch, isWritableSignal } from '@web-loom/signals-core';
import { effect } from '@web-loom/signals-core';
import { evaluate, resolveScopeValue, resolveWritableTarget } from '../runtime/evaluate.js';
import type { BindingRecord, RenderContext, Scope } from '../types.js';
import type { DisposalBag } from '../runtime/disposal.js';

export function bindInput(
  record: Extract<BindingRecord, { kind: 'bind' }>,
  el: HTMLInputElement,
  scope: Scope,
  ctx: RenderContext,
  bag: DisposalBag,
): void {
  const resolve = () =>
    record.target.kind === 'path'
      ? resolveWritableTarget(record.target.segments, record.target.parentHops, scope)
      : evaluate(record.target, scope, ctx.helpers);
  const render = effect(() => {
    const target = record.setter ? evaluate(record.target, scope, ctx.helpers) : resolve();
    if (!record.setter && !isWritableSignal(target))
      throw new TypeError(`bind:${record.name} target must resolve to a writable signal exposing set().`);
    (el as unknown as Record<string, unknown>)[record.name] = record.setter
      ? target
      : (target as { get(): unknown }).get();
  });
  const event =
    record.name === 'value' && el.tagName.toLowerCase() !== 'select' && el.type !== 'checkbox' && el.type !== 'radio'
      ? 'input'
      : 'change';
  const listener = (domEvent: Event) =>
    batch(() => {
      const value = (el as unknown as Record<string, unknown>)[record.name];
      if (record.setter) {
        const resolved =
          record.setter.kind === 'path'
            ? resolveScopeValue(record.setter.segments, record.setter.parentHops, scope)
            : { value: evaluate(record.setter, scope, ctx.helpers), owner: undefined };
        if (typeof resolved.value !== 'function')
          throw new TypeError(`bind:set for ${record.name} must resolve to a function.`);
        (resolved.value as (nextValue: unknown, event: Event) => unknown).call(resolved.owner, value, domEvent);
        return;
      }
      const target = resolve();
      if (!isWritableSignal(target))
        throw new TypeError(`bind:${record.name} target must resolve to a writable signal exposing set().`);
      target.set(value);
    });
  el.addEventListener(event, listener);
  bag.add(() => {
    render.dispose();
    el.removeEventListener(event, listener);
  });
}
