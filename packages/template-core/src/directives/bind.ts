import { batch, isWritableSignal } from '@web-loom/signals-core';
import { effect } from '@web-loom/signals-core';
import { evaluate, resolveWritableTarget } from '../runtime/evaluate.js';
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
    const target = resolve();
    if (!isWritableSignal(target))
      throw new TypeError(`bind:${record.name} target must resolve to a writable signal exposing set().`);
    (el as unknown as Record<string, unknown>)[record.name] = target.get();
  });
  const event =
    record.name === 'value' && el.tagName.toLowerCase() !== 'select' && el.type !== 'checkbox' && el.type !== 'radio'
      ? 'input'
      : 'change';
  const listener = () =>
    batch(() => {
      const target = resolve();
      if (!isWritableSignal(target))
        throw new TypeError(`bind:${record.name} target must resolve to a writable signal exposing set().`);
      target.set((el as unknown as Record<string, unknown>)[record.name]);
    });
  el.addEventListener(event, listener);
  bag.add(() => {
    render.dispose();
    el.removeEventListener(event, listener);
  });
}
