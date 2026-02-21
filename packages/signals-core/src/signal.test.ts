import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';

describe('Signal', () => {
  it('returns the initial value', () => {
    const s = signal(42);
    expect(s.value).toBe(42);
  });

  it('updates when value is set', () => {
    const s = signal(0);
    s.value = 10;
    expect(s.value).toBe(10);
  });

  it('does not notify when value is set to the same reference', () => {
    const s = signal(1);
    const subscriber = vi.fn();
    s.subscribe(subscriber);
    s.value = 1;
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('notifies subscribers on change', () => {
    const s = signal('hello');
    const subscriber = vi.fn();
    s.subscribe(subscriber);
    s.value = 'world';
    expect(subscriber).toHaveBeenCalledWith('world');
  });

  it('unsubscribes cleanly', () => {
    const s = signal(0);
    const subscriber = vi.fn();
    const unsub = s.subscribe(subscriber);
    unsub();
    s.value = 99;
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('peek() reads without tracking', () => {
    const s = signal(7);
    expect(s.peek()).toBe(7);
  });

  it('notifies multiple subscribers', () => {
    const s = signal(0);
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.value = 5;
    expect(a).toHaveBeenCalledWith(5);
    expect(b).toHaveBeenCalledWith(5);
  });
});
