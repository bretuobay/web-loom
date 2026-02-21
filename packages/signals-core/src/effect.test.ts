import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { effect } from './effect.js';

describe('effect', () => {
  it('runs immediately on creation', () => {
    const fn = vi.fn();
    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('reruns when a dependency changes', () => {
    const count = signal(0);
    const fn = vi.fn(() => { count.value; });
    const dispose = effect(fn);
    count.value = 1;
    expect(fn).toHaveBeenCalledTimes(2);
    dispose();
  });

  it('calls cleanup before each rerun', () => {
    const s = signal(0);
    const cleanup = vi.fn();
    const dispose = effect(() => {
      s.value;
      return cleanup;
    });
    s.value = 1;
    expect(cleanup).toHaveBeenCalledTimes(1);
    dispose();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('stops reacting after dispose', () => {
    const s = signal(0);
    const fn = vi.fn(() => { s.value; });
    const dispose = effect(fn);
    dispose();
    s.value = 99;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('tracks multiple signals', () => {
    const a = signal(1);
    const b = signal(2);
    const fn = vi.fn(() => { a.value; b.value; });
    const dispose = effect(fn);
    a.value = 10;
    b.value = 20;
    expect(fn).toHaveBeenCalledTimes(3);
    dispose();
  });
});
