import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { effect } from './effect.js';
import { batch } from './batch.js';

describe('batch', () => {
  it('defers notifications until the batch completes', () => {
    const a = signal(0);
    const b = signal(0);
    const fn = vi.fn(() => { a.value; b.value; });

    const dispose = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      a.value = 1;
      b.value = 2;
    });

    // Should have re-run once after the batch, not twice
    expect(fn).toHaveBeenCalledTimes(2);
    dispose();
  });

  it('runs synchronously when not batched', () => {
    const s = signal(0);
    const fn = vi.fn(() => { s.value; });
    const dispose = effect(fn);
    s.value = 1;
    s.value = 2;
    expect(fn).toHaveBeenCalledTimes(3);
    dispose();
  });
});
