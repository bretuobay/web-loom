import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';
import { observe } from './observe.js';

describe('observe', () => {
  it('invokes the listener immediately with the current value', () => {
    const s = signal(42);
    const fn = vi.fn();
    observe(s, fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('delivers subsequent changes with the new value', () => {
    const s = signal('a');
    const fn = vi.fn();
    observe(s, fn);
    s.set('b');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('b');
  });

  it('stops delivering after unsubscribe', () => {
    const s = signal(0);
    const fn = vi.fn();
    const unsubscribe = observe(s, fn);
    unsubscribe();
    s.set(1);
    expect(fn).toHaveBeenCalledTimes(1); // only the immediate call
  });

  it('works with computed signals', () => {
    const s = signal(2);
    const double = computed(() => s.get() * 2);
    const fn = vi.fn();
    observe(double, fn);
    expect(fn).toHaveBeenCalledWith(4);
    s.set(5);
    expect(fn).toHaveBeenLastCalledWith(10);
  });

  it('does not establish a tracked dependency for the immediate read', () => {
    const outer = signal(1);
    const inner = signal(10);
    const fn = vi.fn();
    // observe inside a computed must not make the computed depend on `inner`
    const c = computed(() => {
      const value = outer.get();
      observe(inner, () => {});
      return value;
    });
    c.subscribe(fn);
    inner.set(20);
    expect(fn).not.toHaveBeenCalled();
  });
});
