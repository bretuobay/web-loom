type PendingFn = () => void;

let batchDepth = 0;
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

/** Force-flush all pending scheduled calls. Useful in adapters and tests. */
export function flush(): void {
  if (pendingCalls.size === 0) return;
  const calls = [...pendingCalls];
  pendingCalls.clear();
  for (const call of calls) call();
}

export function isBatching(): boolean {
  return batchDepth > 0;
}

export function scheduleBatchedCall(fn: PendingFn): void {
  pendingCalls.add(fn);
}
