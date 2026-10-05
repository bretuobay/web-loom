type PendingFn = () => void;

/** @internal A derived node that must be marked dirty before any effect or listener runs. */
export interface Invalidatable {
  _invalidate(): void;
}

let batchDepth = 0;
let flushing = false;
// Set deduplicates by reference — same effect scheduled twice only runs once.
const pendingCalls = new Set<PendingFn>();

export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) flush();
  }
}

/**
 * Force-flush all pending scheduled calls. Useful in adapters and tests.
 * Calls scheduled while flushing run in the same flush. If a call throws, the
 * rest still run and the first error is rethrown afterwards.
 */
export function flush(): void {
  if (flushing || pendingCalls.size === 0) return;
  flushing = true;
  let failed = false;
  let firstError: unknown;
  try {
    for (const call of pendingCalls) {
      pendingCalls.delete(call);
      try {
        call();
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
      }
    }
  } finally {
    flushing = false;
  }
  if (failed) throw firstError;
}

/**
 * @internal Propagate a change from a node to its dependents and subscribers, in two phases:
 * dependent computeds are invalidated first (recursively), and only then do effects and
 * listeners run, deduplicated. That keeps reads glitch-free: an effect never observes a
 * computed that hasn't caught up with its sources, and runs once per change.
 */
export function propagate(dependents: ReadonlySet<Invalidatable>, subs: ReadonlySet<PendingFn>): void {
  // Fast path: nothing derived can be stale, so notify directly (snapshot, so
  // listeners added or removed during notification don't affect this round).
  if (dependents.size === 0 && batchDepth === 0 && !flushing) {
    let failed = false;
    let firstError: unknown;
    for (const sub of [...subs]) {
      try {
        sub();
      } catch (error) {
        if (!failed) {
          failed = true;
          firstError = error;
        }
      }
    }
    if (failed) throw firstError;
    return;
  }

  batchDepth++;
  try {
    for (const dependent of dependents) dependent._invalidate();
    for (const sub of subs) pendingCalls.add(sub);
  } finally {
    batchDepth--;
    if (batchDepth === 0) flush();
  }
}
