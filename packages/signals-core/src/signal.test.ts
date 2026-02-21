import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';

describe('signal', () => {
  it('returns the initial value', () => {
    const s = signal(42);
    expect(s.get()).toBe(42);
  });

  it('updates when set() is called', () => {
    const s = signal(0);
    s.set(10);
    expect(s.get()).toBe(10);
  });

  it('updates via update()', () => {
    const s = signal(3);
    s.update((v) => v * 2);
    expect(s.get()).toBe(6);
  });

  it('does not notify when set to the same value (Object.is)', () => {
    const s = signal(1);
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('respects a custom equals option', () => {
    const s = signal({ x: 1 }, { equals: (a, b) => a.x === b.x });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ x: 1 }); // structurally same — should not notify
    expect(fn).not.toHaveBeenCalled();
    s.set({ x: 2 }); // different — should notify
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers on change', () => {
    const s = signal('hello');
    const fn = vi.fn();
    s.subscribe(fn);
    s.set('world');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('notifies multiple subscribers', () => {
    const s = signal(0);
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.set(5);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes cleanly', () => {
    const s = signal(0);
    const fn = vi.fn();
    const unsub = s.subscribe(fn);
    unsub();
    s.set(99);
    expect(fn).not.toHaveBeenCalled();
  });

  it('peek() returns the value without tracking', () => {
    const s = signal(7);
    expect(s.peek()).toBe(7);
  });

  it('asReadonly() hides set and update', () => {
    const s = signal(10);
    const r = s.asReadonly();
    expect(r.get()).toBe(10);
    expect('set' in r).toBe(false);
    expect('update' in r).toBe(false);
  });

  it('asReadonly() reflects updates made to the underlying signal', () => {
    const s = signal(1);
    const r = s.asReadonly();
    s.set(99);
    expect(r.get()).toBe(99);
  });

  it('asReadonly() subscribe notifies on change', () => {
    const s = signal(0);
    const r = s.asReadonly();
    const fn = vi.fn();
    r.subscribe(fn);
    s.set(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
