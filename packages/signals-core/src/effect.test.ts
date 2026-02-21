import { describe, it, expect, vi } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';
import { effect } from './effect.js';
import { untracked } from './untracked.js';

describe('effect', () => {
  it('runs immediately on creation', () => {
    const fn = vi.fn();
    const handle = effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it('reruns when a dependency changes', () => {
    const count = signal(0);
    const fn = vi.fn(() => {
      count.get();
    });
    const handle = effect(fn);
    count.set(1);
    expect(fn).toHaveBeenCalledTimes(2);
    handle.dispose();
  });

  it('calls cleanup before each rerun', () => {
    const s = signal(0);
    const cleanup = vi.fn();
    const handle = effect(() => {
      s.get();
      return cleanup;
    });
    s.set(1);
    expect(cleanup).toHaveBeenCalledTimes(1);
    handle.dispose();
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('stops reacting after dispose()', () => {
    const s = signal(0);
    const fn = vi.fn(() => {
      s.get();
    });
    const handle = effect(fn);
    handle.dispose();
    s.set(99);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('tracks multiple signals', () => {
    const a = signal(1);
    const b = signal(2);
    const fn = vi.fn(() => {
      a.get();
      b.get();
    });
    const handle = effect(fn);
    a.set(10);
    b.set(20);
    expect(fn).toHaveBeenCalledTimes(3);
    handle.dispose();
  });

  it('tracks computed signals as dependencies', () => {
    const s = signal(0);
    const c = computed(() => s.get() * 2);
    const fn = vi.fn(() => {
      c.get();
    });
    const handle = effect(fn);
    s.set(5);
    expect(fn).toHaveBeenCalledTimes(2);
    handle.dispose();
  });

  it('untracked() reads do not establish dependencies', () => {
    const tracked = signal(0);
    const untr = signal(100);
    const fn = vi.fn(() => {
      tracked.get();
      untracked(() => untr.get());
    });
    const handle = effect(fn);

    untr.set(200); // must NOT trigger rerun — was read via untracked
    expect(fn).toHaveBeenCalledTimes(1);

    tracked.set(1); // must trigger rerun
    expect(fn).toHaveBeenCalledTimes(2);
    handle.dispose();
  });

  it('peek() reads do not establish dependencies', () => {
    const s = signal(10);
    const fn = vi.fn(() => {
      s.peek(); // peek — no tracking
    });
    const handle = effect(fn);
    s.set(20); // must NOT trigger rerun
    expect(fn).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it('_run() guard prevents re-entry when cleanup mutates a dep during dispose()', () => {
    // During dispose(): _disposed=true is set BEFORE _unsubscribeAll(), so a signal
    // write inside the cleanup still calls _boundRun — the guard must catch it.
    const s = signal(0);
    const effectFn = vi.fn(() => {
      s.get();
    });
    const handle = effect(() => {
      effectFn();
      return () => {
        s.set(1); // triggers _boundRun while _disposed=true but still subscribed
      };
    });
    handle.dispose();
    expect(effectFn).toHaveBeenCalledTimes(1); // guard prevented a second run
  });

  it('dispose() is idempotent', () => {
    const fn = vi.fn();
    const handle = effect(fn);
    handle.dispose();
    handle.dispose(); // second call must not throw or double-cleanup
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
