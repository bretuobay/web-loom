// Types & interfaces
export type { ReadonlySignal, WritableSignal, SignalOptions, Equals } from './signal.js';
export type { Computed, ComputedOptions } from './computed.js';
export type { EffectHandle, EffectFn, CleanupFn, EffectOptions } from './effect.js';

// Factories
export { signal } from './signal.js';
export { computed } from './computed.js';
export { effect } from './effect.js';

// Utilities
export { batch, flush } from './batch.js';
export { untracked } from './untracked.js';
export { isSignal, isWritableSignal } from './guards.js';
export { observe } from './observe.js';
export { debouncedSignal } from './debounced-signal.js';
export type { DebouncedSignal } from './debounced-signal.js';

// RxJS interop is intentionally NOT exported here — import it from
// '@web-loom/signals-core/rxjs' so the main entry stays zero-dependency.
