export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {},
): ((...args: Parameters<T>) => void) & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
} {
  const { leading = false, trailing = true, maxWait } = options;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let result: ReturnType<T>;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    lastArgs = undefined;
    lastInvokeTime = time;
    result = func(...args);
    return result;
  }

  function leadingEdge(time: number): ReturnType<T> {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): ReturnType<T> | void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): ReturnType<T> {
    timeout = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    return result;
  }

  function cancel(): void {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    lastInvokeTime = 0;
    lastArgs = undefined;
    lastCallTime = undefined;
    timeout = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    return timeout === undefined ? result : trailingEdge(Date.now());
  }

  function pending(): boolean {
    return timeout !== undefined;
  }

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        timeout = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeout === undefined) {
      timeout = setTimeout(timerExpired, wait);
    }
  } as ((...args: Parameters<T>) => void) & {
    cancel: () => void;
    flush: () => ReturnType<T> | undefined;
    pending: () => boolean;
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {},
): ((...args: Parameters<T>) => void) & {
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
} {
  const { leading = true, trailing = true } = options;

  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  });
}

export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options?: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  },
): {
  execute: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => ReturnType<T> | undefined;
  pending: () => boolean;
} {
  const debouncedFunc = debounce(func, delay, options);

  return {
    execute: debouncedFunc,
    cancel: debouncedFunc.cancel,
    flush: debouncedFunc.flush,
    pending: debouncedFunc.pending,
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number, errorMessage?: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

export function batchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  options: {
    batchSize: number;
    delay: number;
    maxWait?: number;
  },
): {
  add: (item: T) => Promise<R>;
  flush: () => Promise<void>;
  destroy: () => void;
} {
  const { batchSize, delay, maxWait = delay * 10 } = options;

  let queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let maxWaitTimeout: ReturnType<typeof setTimeout> | undefined;
  let isProcessing = false;
  let destroyed = false;

  async function processBatch(): Promise<void> {
    if (isProcessing || queue.length === 0 || destroyed) {
      return;
    }

    isProcessing = true;

    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }

    if (maxWaitTimeout) {
      clearTimeout(maxWaitTimeout);
      maxWaitTimeout = undefined;
    }

    const batch = queue.splice(0, batchSize);
    const items = batch.map((entry) => entry.item);

    try {
      const results = await processor(items);

      batch.forEach((entry, index) => {
        entry.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach((entry) => {
        entry.reject(error as Error);
      });
    } finally {
      isProcessing = false;

      // Process any remaining items
      if (queue.length > 0 && !destroyed) {
        scheduleNextProcess();
      }
    }
  }

  function scheduleNextProcess(): void {
    if (timeout || destroyed) return;

    timeout = setTimeout(processBatch, delay);

    if (!maxWaitTimeout) {
      maxWaitTimeout = setTimeout(processBatch, maxWait);
    }
  }

  return {
    add(item: T): Promise<R> {
      return new Promise((resolve, reject) => {
        if (destroyed) {
          reject(new Error('Batch processor has been destroyed'));
          return;
        }

        queue.push({ item, resolve, reject });

        if (queue.length >= batchSize) {
          processBatch();
        } else {
          scheduleNextProcess();
        }
      });
    },

    async flush(): Promise<void> {
      while (queue.length > 0 && !destroyed) {
        await processBatch();
      }
    },

    destroy(): void {
      destroyed = true;

      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      if (maxWaitTimeout) {
        clearTimeout(maxWaitTimeout);
        maxWaitTimeout = undefined;
      }

      // Reject all pending items
      queue.forEach((entry) => {
        entry.reject(new Error('Batch processor has been destroyed'));
      });
      queue = [];
    },
  };
}
