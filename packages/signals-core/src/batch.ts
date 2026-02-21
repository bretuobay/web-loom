type AnyFn = (value: unknown) => void;

let batchDepth = 0;
// Map preserves insertion order and deduplicates by fn reference (last value wins)
const pendingCalls = new Map<AnyFn, unknown>();

export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const calls = [...pendingCalls];
      pendingCalls.clear();
      for (const [call, value] of calls) {
        call(value);
      }
    }
  }
}

export function isBatching(): boolean {
  return batchDepth > 0;
}

export function scheduleBatchedCall(fn: AnyFn, value: unknown): void {
  pendingCalls.set(fn, value);
}
