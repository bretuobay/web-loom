import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { effect } from './effect.js';
import { batch, flush } from './batch.js';

describe('batch', () => {
  it('defers notifications until the batch completes', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn(() => {
      a.get();
      b.get();
    });
    const handle = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      a.set(1);
      b.set(2);
    });

    // One rerun after the batch — not two separate reruns
    expect(fn).toHaveBeenCalledTimes(2);
    handle.dispose();
  });

  it('runs synchronously when not batched', () => {
    const s = signal(0);
    const fn = vi.fn(() => {
      s.get();
    });
    const handle = effect(fn);
    s.set(1);
    s.set(2);
    expect(fn).toHaveBeenCalledTimes(3);
    handle.dispose();
  });

  it('returns the value from the callback', () => {
    const result = batch(() => 42);
    expect(result).toBe(42);
  });

  it('supports nested batches — flushes only at outermost end', () => {
    const s = signal(0);
    const fn = vi.fn(() => {
      s.get();
    });
    const handle = effect(fn);

    batch(() => {
      batch(() => {
        s.set(1);
        s.set(2);
      });
      s.set(3);
    });

    // All three writes coalesce into one rerun
    expect(fn).toHaveBeenCalledTimes(2);
    handle.dispose();
  });

  it('flush() is a no-op when nothing is pending', () => {
    expect(() => flush()).not.toThrow();
  });
});
