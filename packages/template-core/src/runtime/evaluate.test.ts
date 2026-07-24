import { describe, expect, it, vi } from 'vitest';
import { signal, computed, effect } from '@web-loom/signals-core';
import { parseExpression } from '../compiler/expression.js';
import { evaluate, resolveScopeValue, truthy } from './evaluate.js';
import type { Scope } from '../types.js';

function scopeOf(self: unknown, parent: Scope | null = null, locals: Record<string, unknown> = {}): Scope {
  return { parent, self, locals };
}

describe('evaluate: literals and paths', () => {
  it('evaluates literals', () => {
    expect(evaluate(parseExpression('42'), scopeOf({}), {})).toBe(42);
    expect(evaluate(parseExpression('"hi"'), scopeOf({}), {})).toBe('hi');
    expect(evaluate(parseExpression('true'), scopeOf({}), {})).toBe(true);
    expect(evaluate(parseExpression('null'), scopeOf({}), {})).toBe(null);
  });

  it('resolves a plain-value path from scope.self', () => {
    const scope = scopeOf({ title: 'Todos' });
    expect(evaluate(parseExpression('title'), scope, {})).toBe('Todos');
  });

  it('resolves a nested path', () => {
    const scope = scopeOf({ user: { profile: { name: 'Ada' } } });
    expect(evaluate(parseExpression('user.profile.name'), scope, {})).toBe('Ada');
  });

  it('returns undefined for a missing property without throwing', () => {
    const scope = scopeOf({ user: {} });
    expect(evaluate(parseExpression('user.profile.name'), scope, {})).toBeUndefined();
  });

  it('resolves "this" to scope.self', () => {
    const scope = scopeOf({ id: 1 });
    expect(evaluate(parseExpression('this'), scope, {})).toEqual({ id: 1 });
  });

  it('does not fall back to the parent scope for a plain identifier', () => {
    const parent = scopeOf({ title: 'Outer' });
    const child = scopeOf({ text: 'Item' }, parent);
    expect(evaluate(parseExpression('title'), child, {})).toBeUndefined();
    expect(evaluate(parseExpression('../title'), child, {})).toBe('Outer');
  });

  it('resolves locals (@index, $event)', () => {
    const scope = scopeOf({}, null, { '@index': 3, $event: { type: 'click' } });
    expect(evaluate(parseExpression('@index'), scope, {})).toBe(3);
    expect(evaluate(parseExpression('$event.type'), scope, {})).toBe('click');
  });
});

describe('evaluate: signal unwrapping', () => {
  it('unwraps a signal at the head of a path', () => {
    const count$ = signal(5);
    const scope = scopeOf({ count$ });
    expect(evaluate(parseExpression('count$'), scope, {})).toBe(5);
  });

  it('unwraps signals at any depth along a nested path', () => {
    const name$ = signal('Ada');
    const user$ = signal({ profile: { name$ } });
    const scope = scopeOf({ user$ });
    expect(evaluate(parseExpression('user$.profile.name$'), scope, {})).toBe('Ada');
  });

  it('does not determine reactivity by name — a non-$-suffixed prop can still be a signal', () => {
    const count = signal(7);
    const scope = scopeOf({ count });
    expect(evaluate(parseExpression('count'), scope, {})).toBe(7);
  });

  it('tracks every signal on a path as an effect dependency', () => {
    const a$ = signal({ b$: signal(1) });
    const scope = scopeOf({ a$ });
    const seen: unknown[] = [];
    const handle = effect(() => {
      seen.push(evaluate(parseExpression('a$.b$'), scope, {}));
    });
    expect(seen).toEqual([1]);
    (a$.peek().b$ as ReturnType<typeof signal<number>>).set(2);
    expect(seen).toEqual([1, 2]);
    a$.set({ b$: signal(99) });
    expect(seen).toEqual([1, 2, 99]);
    handle.dispose();
  });

  it('renders a non-signal value once and never re-evaluates on later mutation', () => {
    const plain = { count: 1 };
    const scope = scopeOf(plain);
    let runs = 0;
    const handle = effect(() => {
      evaluate(parseExpression('count'), scope, {});
      runs++;
    });
    plain.count = 2; // mutating a plain object triggers nothing — no signal was touched
    expect(runs).toBe(1);
    handle.dispose();
  });
});

describe('evaluate: helper calls and this-binding', () => {
  it('resolves a helper from options.helpers before the scope chain', () => {
    const helpers = { formatDate: vi.fn((d: unknown) => `formatted:${d}`) };
    const scope = scopeOf({ createdAt: '2024-01-01' });
    expect(evaluate(parseExpression('formatDate(createdAt)'), scope, helpers)).toBe('formatted:2024-01-01');
  });

  it('falls back to the scope chain when the callee is not a helper', () => {
    const vm = { remove: vi.fn(() => 'removed') };
    const scope = scopeOf(vm);
    expect(evaluate(parseExpression('remove()'), scope, {})).toBe('removed');
  });

  it('invokes a scope-resolved function with its owning object as this', () => {
    const owner = {
      value: 42,
      getValue(this: { value: number }) {
        return this.value;
      },
    };
    const scope = scopeOf(owner);
    expect(evaluate(parseExpression('getValue()'), scope, {})).toBe(42);
  });

  it('throws a TypeError when the callee does not resolve to a function', () => {
    const scope = scopeOf({ notAFunction: 5 });
    expect(() => evaluate(parseExpression('notAFunction()'), scope, {})).toThrow(TypeError);
  });
});

describe('evaluate: unary, comparisons, logical', () => {
  it('evaluates unary not', () => {
    expect(evaluate(parseExpression('!isDone'), scopeOf({ isDone: false }), {})).toBe(true);
  });

  it('evaluates comparisons', () => {
    const scope = scopeOf({ a: 1, b: 2 });
    expect(evaluate(parseExpression('a < b'), scope, {})).toBe(true);
    expect(evaluate(parseExpression('a === b'), scope, {})).toBe(false);
    expect(evaluate(parseExpression('a !== b'), scope, {})).toBe(true);
  });

  it('short-circuits && and ||', () => {
    const helpers = { boom: vi.fn(() => true) };
    expect(evaluate(parseExpression('false && boom()'), scopeOf({}), helpers)).toBe(false);
    expect(helpers.boom).not.toHaveBeenCalled();
    expect(evaluate(parseExpression('true || boom()'), scopeOf({}), helpers)).toBe(true);
    expect(helpers.boom).not.toHaveBeenCalled();
  });

  it('evaluates nullish coalescing only when the left side is null/undefined', () => {
    expect(evaluate(parseExpression('a ?? "fallback"'), scopeOf({ a: 0 }), {})).toBe(0);
    expect(evaluate(parseExpression('a ?? "fallback"'), scopeOf({}), {})).toBe('fallback');
  });
});

describe('evaluate: computed signals', () => {
  it('evaluates a computed signal reactively', () => {
    const count$ = signal(1);
    const doubled$ = computed(() => count$.get() * 2);
    const scope = scopeOf({ doubled$ });
    const seen: unknown[] = [];
    const handle = effect(() => {
      seen.push(evaluate(parseExpression('doubled$'), scope, {}));
    });
    expect(seen).toEqual([2]);
    count$.set(5);
    expect(seen).toEqual([2, 10]);
    handle.dispose();
  });
});

describe('truthy', () => {
  it('matches standard JS truthiness', () => {
    expect(truthy(0)).toBe(false);
    expect(truthy('')).toBe(false);
    expect(truthy(null)).toBe(false);
    expect(truthy(undefined)).toBe(false);
    expect(truthy('x')).toBe(true);
    expect(truthy(1)).toBe(true);
  });
});

describe('resolveScopeValue', () => {
  it('returns the owner alongside the value for a nested path', () => {
    const owner = { fn: () => {} };
    const scope = scopeOf({ owner });
    const { owner: resolvedOwner, value } = resolveScopeValue(['owner', 'fn'], 0, scope);
    expect(resolvedOwner).toBe(owner);
    expect(value).toBe(owner.fn);
  });
});
