import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';

describe('Computed', () => {
  it('derives a value from a signal', () => {
    const count = signal(2);
    const doubled = computed(() => count.value * 2);
    expect(doubled.value).toBe(4);
  });

  it('updates when a dependency changes', () => {
    const name = signal('Alice');
    const greeting = computed(() => `Hello, ${name.value}!`);
    expect(greeting.value).toBe('Hello, Alice!');
    name.value = 'Bob';
    expect(greeting.value).toBe('Hello, Bob!');
  });

  it('is lazy — does not recompute until read', () => {
    const compute = vi.fn(() => 0);
    const s = signal(1);
    const c = computed(() => {
      s.value; // track dep
      return compute();
    });
    expect(compute).not.toHaveBeenCalled();
    c.value;
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('caches the value between reads when deps have not changed', () => {
    const compute = vi.fn((x: number) => x * 2);
    const s = signal(3);
    const c = computed(() => compute(s.value));
    c.value;
    c.value;
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers when value changes', () => {
    const s = signal(1);
    const c = computed(() => s.value + 10);
    const subscriber = vi.fn();
    c.subscribe(subscriber);
    s.value = 5;
    expect(subscriber).toHaveBeenCalledWith(15);
  });

  it('chains computed signals', () => {
    const x = signal(2);
    const y = computed(() => x.value * 3);
    const z = computed(() => y.value + 1);
    expect(z.value).toBe(7);
    x.value = 4;
    expect(z.value).toBe(13);
  });

  it('peek() returns the computed value without re-tracking', () => {
    const s = signal(10);
    const c = computed(() => s.value * 2);
    expect(c.peek()).toBe(20);
  });
});
