import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from './signal.js';
import { debouncedSignal } from './debounced-signal.js';

describe('debouncedSignal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at the source current value', () => {
    const s = signal('initial');
    const d = debouncedSignal(s, 100);
    expect(d.get()).toBe('initial');
  });

  it('does not update before the quiet period elapses', () => {
    const s = signal(0);
    const d = debouncedSignal(s, 100);
    s.set(1);
    vi.advanceTimersByTime(99);
    expect(d.get()).toBe(0);
  });

  it('updates after the quiet period', () => {
    const s = signal(0);
    const d = debouncedSignal(s, 100);
    s.set(1);
    vi.advanceTimersByTime(100);
    expect(d.get()).toBe(1);
  });

  it('coalesces rapid updates — trailing value wins', () => {
    const s = signal(0);
    const d = debouncedSignal(s, 100);
    const fn = vi.fn();
    d.subscribe(fn);

    s.set(1);
    vi.advanceTimersByTime(50);
    s.set(2);
    vi.advanceTimersByTime(50);
    s.set(3);
    vi.advanceTimersByTime(100);

    expect(d.get()).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('dispose cancels the pending update and detaches from the source', () => {
    const s = signal(0);
    const d = debouncedSignal(s, 100);
    s.set(1);
    d.dispose();
    vi.advanceTimersByTime(200);
    expect(d.peek()).toBe(0);
    s.set(2);
    vi.advanceTimersByTime(200);
    expect(d.peek()).toBe(0);
  });
});
