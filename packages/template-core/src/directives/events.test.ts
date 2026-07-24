import { describe, expect, it, vi } from 'vitest';
import { signal, effect } from '@web-loom/signals-core';
import { DisposalBag } from '../runtime/disposal.js';
import { parseExpression } from '../compiler/expression.js';
import { bindEvent } from './events.js';
import type { RenderContext, Scope } from '../types.js';

function ctx(): RenderContext {
  return { helpers: {}, escape: true };
}

describe('bindEvent: bare-path form', () => {
  it('invokes the resolved function with the DOM event', () => {
    const handler = vi.fn();
    const scope: Scope = { parent: null, self: { increment: handler }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();

    bindEvent({ kind: 'event', path: [0], event: 'click', handler: parseExpression('increment') }, el, scope, ctx(), bag);
    const evt = new Event('click');
    el.dispatchEvent(evt);
    expect(handler).toHaveBeenCalledExactlyOnceWith(evt);
    bag.dispose();
  });

  it('invokes a resolved method with its owning object as this', () => {
    let calledWithCorrectThis = false;
    const owner = {
      execute() {
        calledWithCorrectThis = this === owner;
      },
    };
    const scope: Scope = { parent: null, self: { fetchCommand: owner }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();

    bindEvent(
      { kind: 'event', path: [0], event: 'click', handler: parseExpression('fetchCommand.execute') },
      el,
      scope,
      ctx(),
      bag,
    );
    el.dispatchEvent(new Event('click'));
    expect(calledWithCorrectThis).toBe(true);
    bag.dispose();
  });

  it('throws a TypeError when the bare path does not resolve to a function', () => {
    // dispatchEvent() does not propagate a listener's synchronous throw back
    // to the caller (DOM spec) — capture the registered listener directly.
    const scope: Scope = { parent: null, self: { notAFunction: 5 }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();
    let captured: EventListener | undefined;
    vi.spyOn(el, 'addEventListener').mockImplementation((_type, listener) => {
      captured = listener as EventListener;
    });
    bindEvent(
      { kind: 'event', path: [0], event: 'click', handler: parseExpression('notAFunction') },
      el,
      scope,
      ctx(),
      bag,
    );
    expect(() => captured!(new Event('click'))).toThrow(TypeError);
    vi.restoreAllMocks();
  });

  it('resolves a bare-path handler from an ancestor scope when not on the item', () => {
    const handler = vi.fn();
    const scope: Scope = {
      parent: { parent: null, self: { increment: handler }, locals: {} },
      self: { id: 1 },
      locals: {},
    };
    const el = document.createElement('button');
    const bag = new DisposalBag();
    bindEvent({ kind: 'event', path: [0], event: 'click', handler: parseExpression('increment') }, el, scope, ctx(), bag);
    el.dispatchEvent(new Event('click'));
    expect(handler).toHaveBeenCalledOnce();
    bag.dispose();
  });

  it('removes the listener on dispose', () => {
    const handler = vi.fn();
    const scope: Scope = { parent: null, self: { increment: handler }, locals: {} };
    const el = document.createElement('button');
    const bag = new DisposalBag();
    bindEvent({ kind: 'event', path: [0], event: 'click', handler: parseExpression('increment') }, el, scope, ctx(), bag);
    bag.dispose();
    el.dispatchEvent(new Event('click'));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('bindEvent: call form', () => {
  it('resolves the callee by walking up the scope chain — actions live on the root ViewModel, not the item', () => {
    const removed: unknown[] = [];
    const item = { id: 1 };
    const scope: Scope = {
      parent: { parent: null, self: { remove: (x: unknown) => removed.push(x) }, locals: {} },
      self: item,
      locals: { '@index': 0 },
    };
    const el = document.createElement('button');
    const bag = new DisposalBag();

    // No "../" needed — matches the PRD §8 todo example (`remove(this)`
    // inside {{#each}}), and staying reachable without hop-counting means
    // the handler keeps working if the each block is later nested deeper.
    bindEvent(
      { kind: 'event', path: [0], event: 'click', handler: parseExpression('remove(this)') },
      el,
      scope,
      ctx(),
      bag,
    );
    el.dispatchEvent(new Event('click'));
    expect(removed).toEqual([item]);
    bag.dispose();
  });

  it('makes $event available to call-form arguments', () => {
    let capturedType: string | undefined;
    const scope: Scope = {
      parent: null,
      self: { log: (evt: Event) => (capturedType = evt.type) },
      locals: {},
    };
    const el = document.createElement('button');
    const bag = new DisposalBag();
    bindEvent({ kind: 'event', path: [0], event: 'click', handler: parseExpression('log($event)') }, el, scope, ctx(), bag);
    el.dispatchEvent(new Event('click'));
    expect(capturedType).toBe('click');
    bag.dispose();
  });
});

describe('bindEvent: batching', () => {
  it('wraps handler execution in batch() so a multi-write handler notifies dependents once', () => {
    const a$ = signal(0);
    const b$ = signal(0);
    let runs = 0;
    const dep = effect(() => {
      a$.get();
      b$.get();
      runs++;
    });
    expect(runs).toBe(1);

    const scope: Scope = {
      parent: null,
      self: {
        bump: () => {
          a$.set(a$.peek() + 1);
          b$.set(b$.peek() + 1);
        },
      },
      locals: {},
    };
    const el = document.createElement('button');
    const bag = new DisposalBag();
    bindEvent({ kind: 'event', path: [0], event: 'click', handler: parseExpression('bump') }, el, scope, ctx(), bag);
    el.dispatchEvent(new Event('click'));
    expect(runs).toBe(2); // one combined re-run, not two
    dep.dispose();
    bag.dispose();
  });
});
