import { describe, it, expect } from 'vitest';
import { signal } from './signal.js';
import { computed } from './computed.js';
import { isSignal, isWritableSignal } from './guards.js';

describe('isSignal', () => {
  it('returns true for a writable signal', () => {
    expect(isSignal(signal(0))).toBe(true);
  });

  it('returns true for a computed signal', () => {
    const s = signal(1);
    expect(isSignal(computed(() => s.get()))).toBe(true);
  });

  it('returns true for an asReadonly() view', () => {
    expect(isSignal(signal(0).asReadonly())).toBe(true);
  });

  it('returns false for primitives', () => {
    expect(isSignal(42)).toBe(false);
    expect(isSignal('hello')).toBe(false);
    expect(isSignal(null)).toBe(false);
    expect(isSignal(undefined)).toBe(false);
  });

  it('returns false for plain objects without the signal interface', () => {
    expect(isSignal({ value: 0 })).toBe(false);
  });
});

describe('isWritableSignal', () => {
  it('returns true for a writable signal', () => {
    expect(isWritableSignal(signal(0))).toBe(true);
  });

  it('returns false for a computed signal', () => {
    const s = signal(1);
    expect(isWritableSignal(computed(() => s.get()))).toBe(false);
  });

  it('returns false for an asReadonly() view', () => {
    expect(isWritableSignal(signal(0).asReadonly())).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isWritableSignal(0)).toBe(false);
    expect(isWritableSignal(null)).toBe(false);
  });
});
