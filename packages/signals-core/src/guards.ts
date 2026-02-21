import type { ReadonlySignal, WritableSignal } from './signal.js';

function hasMethod(value: unknown, name: string): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)[name] === 'function'
  );
}

/** Returns true if value is any kind of signal (readable or writable). */
export function isSignal(value: unknown): value is ReadonlySignal<unknown> {
  return hasMethod(value, 'get') && hasMethod(value, 'peek') && hasMethod(value, 'subscribe');
}

/** Returns true if value is a WritableSignal (exposes set/update/asReadonly). */
export function isWritableSignal(value: unknown): value is WritableSignal<unknown> {
  return isSignal(value) && hasMethod(value, 'set') && hasMethod(value, 'update');
}
