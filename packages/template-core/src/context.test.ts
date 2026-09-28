import { describe, expect, it } from 'vitest';
import { signal } from '@web-loom/signals-core';
import { anyLoading, composeContext, firstError } from './context.js';

describe('composeContext', () => {
  it('merges parts while preserving values', () => {
    const list = { items$: signal<string[]>([]) };
    const helpers = { formatTimestamp: (v: unknown) => String(v) };
    const context = composeContext({ list }, helpers, { currentYear: 2026 });

    expect(context.list).toBe(list);
    expect(context.formatTimestamp('x')).toBe('x');
    expect(context.currentYear).toBe(2026);
  });

  it('throws on duplicate keys across parts', () => {
    expect(() => composeContext({ nav: 1 }, { other: 2, nav: 3 })).toThrow(/duplicate context key "nav"/);
  });
});

describe('anyLoading', () => {
  it('is true while any ViewModel is loading and false once all settle', () => {
    const a = { isLoading$: signal(false) };
    const b = { isLoading$: signal(true) };
    const loading$ = anyLoading(a, b);

    expect(loading$.get()).toBe(true);
    b.isLoading$.set(false);
    expect(loading$.get()).toBe(false);
    a.isLoading$.set(true);
    expect(loading$.get()).toBe(true);
  });
});

describe('firstError', () => {
  it('surfaces the first truthy error and clears when errors reset', () => {
    const a = { error$: signal<unknown>(null) };
    const b = { error$: signal<unknown>(null) };
    const error$ = firstError(a, b);

    expect(error$.get()).toBeNull();
    b.error$.set(new Error('b failed'));
    expect((error$.get() as Error).message).toBe('b failed');
    a.error$.set(new Error('a failed'));
    expect((error$.get() as Error).message).toBe('a failed');
    a.error$.set(null);
    b.error$.set(null);
    expect(error$.get()).toBeNull();
  });
});
