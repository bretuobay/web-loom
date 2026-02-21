import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';

describe('computed', () => {
  it('derives a value from a signal', () => {
    const count = signal(2);
    const doubled = computed(() => count.get() * 2);
    expect(doubled.get()).toBe(4);
  });

  it('updates when a dependency changes', () => {
    const name = signal('Alice');
    const greeting = computed(() => `Hello, ${name.get()}!`);
    name.set('Bob');
    expect(greeting.get()).toBe('Hello, Bob!');
  });

  it('is lazy — does not compute until get() is called', () => {
    const compute = vi.fn(() => 0);
    const s = signal(1);
    const c = computed(() => {
      s.get();
      return compute();
    });
    expect(compute).not.toHaveBeenCalled();
    c.get();
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not recompute when deps have not changed (memoized)', () => {
    const compute = vi.fn((x: number) => x * 2);
    const s = signal(3);
    const c = computed(() => compute(s.get()));
    c.get();
    c.get();
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('does not recompute eagerly when a dependency changes', () => {
    const compute = vi.fn(() => 0);
    const s = signal(1);
    const c = computed(() => {
      s.get();
      return compute();
    });
    c.get(); // initial compute
    s.set(2); // invalidates — must NOT trigger recompute yet
    expect(compute).toHaveBeenCalledTimes(1);
    c.get(); // recomputes here
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('notifies subscribers when dependency changes', () => {
    const s = signal(1);
    const c = computed(() => s.get() + 10);
    const fn = vi.fn();
    c.subscribe(fn);
    s.set(5);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('chains computed signals', () => {
    const x = signal(2);
    const y = computed(() => x.get() * 3);
    const z = computed(() => y.get() + 1);
    expect(z.get()).toBe(7);
    x.set(4);
    expect(z.get()).toBe(13);
  });

  it('peek() returns the value without tracking or recomputing in outer context', () => {
    const s = signal(10);
    const c = computed(() => s.get() * 2);
    expect(c.peek()).toBe(20);
  });

  it('respects custom equals — keeps old reference when derived value is equal', () => {
    const s = signal(1);
    // Always reports equal — the cached value should never be replaced.
    const c = computed(() => ({ v: s.get() }), { equals: () => true });
    const first = c.get();
    s.set(2);
    expect(c.get()).toBe(first); // same reference — equals suppressed the update
  });

  it('removes stale dynamic dependencies', () => {
    const flag = signal(true);
    const a = signal('a');
    const b = signal('b');
    const compute = vi.fn(() => (flag.get() ? a.get() : b.get()));
    const c = computed(compute);

    c.get(); // reads flag + a
    const callsAfterInit = compute.mock.calls.length;

    flag.set(false);
    c.get(); // reads flag + b; a is no longer a dep

    b.set('B');
    c.get(); // recomputes due to b
    const callsAfterBChange = compute.mock.calls.length;

    a.set('A'); // a is no longer a dep — must NOT trigger recompute
    c.get();
    expect(compute.mock.calls.length).toBe(callsAfterBChange);
    expect(callsAfterInit).toBeGreaterThan(0); // guard
  });

  it('double-invalidation is a no-op (guard against re-notification)', () => {
    const s = signal(0);
    const c = computed(() => s.get());
    const fn = vi.fn();
    c.subscribe(fn);

    s.set(1); // marks dirty, notifies once
    s.set(2); // computed is already dirty — guard fires, no duplicate notification
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
