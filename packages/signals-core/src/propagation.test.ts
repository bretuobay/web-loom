import { describe, expect, it, vi } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';
import { effect } from './effect.js';

describe('glitch-free propagation', () => {
  it('an effect reading a signal and a computed of it sees a consistent state, once per change', () => {
    const count = signal(0);
    const doubled = computed(() => count.get() * 2);
    const seen: Array<[number, number]> = [];

    effect(() => {
      seen.push([count.get(), doubled.get()]);
    });
    count.set(5);

    expect(seen).toEqual([
      [0, 0],
      [5, 10],
    ]);
  });

  it('runs a diamond-shaped effect once with consistent values', () => {
    const a = signal(1);
    const b = computed(() => a.get() + 1);
    const c = computed(() => a.get() * 10);
    const seen: string[] = [];

    effect(() => {
      seen.push(`${b.get()}/${c.get()}`);
    });
    a.set(2);

    expect(seen).toEqual(['2/10', '3/20']);
  });

  it('a signal subscriber reading a derived value sees the fresh value', () => {
    const count = signal(1);
    const listener = vi.fn();
    // Subscribe to the signal before anything depends on the computed.
    count.subscribe(() => listener(doubled.get()));
    const doubled = computed(() => count.get() * 2);
    doubled.subscribe(() => undefined);

    count.set(4);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(8);
  });

  it('propagates writes made inside an effect', () => {
    const source = signal(1);
    const mirror = signal(0);
    const seen: number[] = [];

    effect(() => mirror.set(source.get() * 100));
    effect(() => {
      seen.push(mirror.get());
    });
    source.set(2);

    expect(mirror.peek()).toBe(200);
    expect(seen).toEqual([100, 200]);
  });

  it('still notifies other subscribers when one throws, then rethrows to the writer', () => {
    const count = signal(0);
    const after = vi.fn();
    count.subscribe(() => {
      throw new Error('boom');
    });
    count.subscribe(after);

    expect(() => count.set(1)).toThrow('boom');
    expect(after).toHaveBeenCalledWith(1);
  });
});
