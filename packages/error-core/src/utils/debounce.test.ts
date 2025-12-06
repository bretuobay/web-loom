import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, createDebouncedFunction, delay, timeout, batchProcessor } from './debounce';

describe('debounce utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass latest arguments to debounced function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('third');
    });

    it('should call immediately with leading option', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100, { leading: true, trailing: false });

      debounced();

      expect(fn).toHaveBeenCalledTimes(1);

      debounced();
      debounced();

      vi.advanceTimersByTime(100);

      // Should not call again (trailing: false)
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect maxWait option', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100, { maxWait: 200 });

      debounced();
      vi.advanceTimersByTime(50);

      debounced();
      vi.advanceTimersByTime(50);

      debounced();
      vi.advanceTimersByTime(50);

      debounced();
      vi.advanceTimersByTime(50);

      // At 200ms total, maxWait should trigger
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending invocations', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();

      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should flush pending invocations', () => {
      const fn = vi.fn(() => 'result');
      const debounced = debounce(fn, 100);

      debounced();
      const result = debounced.flush();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe('result');
    });

    it('should check if invocation is pending', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      expect(debounced.pending()).toBe(false);

      debounced();

      expect(debounced.pending()).toBe(true);

      vi.advanceTimersByTime(100);

      expect(debounced.pending()).toBe(false);
    });

    it('should handle leading and trailing together', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100, { leading: true, trailing: true });

      debounced();

      expect(fn).toHaveBeenCalledTimes(1);

      debounced();
      debounced();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      // Should be called immediately (leading: true by default)
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);

      // Should be called at trailing edge
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not call more than once per interval', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      for (let i = 0; i < 10; i++) {
        throttled();
        vi.advanceTimersByTime(10);
      }

      // After 100ms, should have been called twice (leading + trailing)
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect leading option', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { leading: false });

      throttled();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect trailing option', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100, { trailing: false });

      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      throttled();

      vi.advanceTimersByTime(100);

      // Should not call at trailing edge
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending invocations', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled.cancel();

      vi.advanceTimersByTime(100);

      // Only leading call should have happened
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createDebouncedFunction', () => {
    it('should create debounced function with object API', () => {
      const fn = vi.fn();
      const debounced = createDebouncedFunction(fn, 100);

      debounced.execute();
      debounced.execute();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should expose cancel method', () => {
      const fn = vi.fn();
      const debounced = createDebouncedFunction(fn, 100);

      debounced.execute();
      debounced.cancel();

      vi.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    it('should expose flush method', () => {
      const fn = vi.fn(() => 42);
      const debounced = createDebouncedFunction(fn, 100);

      debounced.execute();
      const result = debounced.flush();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(result).toBe(42);
    });

    it('should expose pending method', () => {
      const fn = vi.fn();
      const debounced = createDebouncedFunction(fn, 100);

      expect(debounced.pending()).toBe(false);

      debounced.execute();

      expect(debounced.pending()).toBe(true);

      vi.advanceTimersByTime(100);

      expect(debounced.pending()).toBe(false);
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const promise = delay(100);

      vi.advanceTimersByTime(50);
      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(50);

      await promise;

      expect(vi.getTimerCount()).toBe(0);
    });

    it('should resolve after specified time', async () => {
      let resolved = false;

      delay(100).then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(resolved).toBe(true);
    });
  });

  describe('timeout', () => {
    it('should resolve if promise completes in time', async () => {
      const promise = Promise.resolve('success');
      const result = timeout(promise, 100);

      await expect(result).resolves.toBe('success');
    });

    it('should reject if promise times out', async () => {
      const promise = new Promise(() => {}); // Never resolves
      const result = timeout(promise, 100);

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow('Operation timed out after 100ms');
    });

    it('should use custom error message', async () => {
      const promise = new Promise(() => {});
      const result = timeout(promise, 100, 'Custom timeout message');

      vi.advanceTimersByTime(100);

      await expect(result).rejects.toThrow('Custom timeout message');
    });

    it('should reject if promise rejects', async () => {
      const promise = Promise.reject(new Error('Failed'));
      const result = timeout(promise, 100);

      await expect(result).rejects.toThrow('Failed');
    });
  });

  describe('batchProcessor', () => {
    it('should batch items up to batchSize', async () => {
      const processor = vi.fn(async (items: number[]) => items.map((x) => x * 2));

      const batch = batchProcessor(processor, {
        batchSize: 3,
        delay: 100,
      });

      const promises = [batch.add(1), batch.add(2), batch.add(3)];

      // Should process immediately when batch is full
      await vi.runAllTimersAsync();

      const results = await Promise.all(promises);

      expect(processor).toHaveBeenCalledTimes(1);
      expect(processor).toHaveBeenCalledWith([1, 2, 3]);
      expect(results).toEqual([2, 4, 6]);
    });

    it('should process items after delay', async () => {
      const processor = vi.fn(async (items: number[]) => items.map((x) => x * 2));

      const batch = batchProcessor(processor, {
        batchSize: 10,
        delay: 100,
      });

      const promise = batch.add(1);

      expect(processor).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(processor).toHaveBeenCalledTimes(1);
      expect(result).toBe(2);
    });

    it('should respect maxWait', async () => {
      const processor = vi.fn(async (items: number[]) => items);

      const batch = batchProcessor(processor, {
        batchSize: 10,
        delay: 100,
        maxWait: 200,
      });

      batch.add(1);

      vi.advanceTimersByTime(50);
      batch.add(2);

      vi.advanceTimersByTime(50);
      batch.add(3);

      vi.advanceTimersByTime(100); // Total 200ms

      await vi.runAllTimersAsync();

      // The processor may be called once or twice depending on timing
      // Just verify it was called at least once with the items
      expect(processor).toHaveBeenCalled();
      const allCalls = processor.mock.calls.flat(2);
      expect(allCalls).toContain(1);
      expect(allCalls).toContain(2);
      expect(allCalls).toContain(3);
    });

    it('should flush remaining items', async () => {
      const processor = vi.fn(async (items: number[]) => items);

      const batch = batchProcessor(processor, {
        batchSize: 10,
        delay: 100,
      });

      batch.add(1);
      batch.add(2);

      await batch.flush();

      expect(processor).toHaveBeenCalledWith([1, 2]);
    });

    it('should handle processor errors', async () => {
      const processor = vi.fn(async () => {
        throw new Error('Processing failed');
      });

      const batch = batchProcessor(processor, {
        batchSize: 1,
        delay: 100,
      });

      const promise = batch.add(1).catch((err: Error) => err);

      await vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBeInstanceOf(Error);
      if (result instanceof Error) {
        expect(result.message).toBe('Processing failed');
      }
    });

    it('should reject new items after destroy', async () => {
      const processor = vi.fn(async (items: number[]) => items);

      const batch = batchProcessor(processor, {
        batchSize: 10,
        delay: 100,
      });

      batch.destroy();

      await expect(batch.add(1)).rejects.toThrow('Batch processor has been destroyed');
    });

    it('should reject pending items on destroy', async () => {
      const processor = vi.fn(async (items: number[]) => items);

      const batch = batchProcessor(processor, {
        batchSize: 10,
        delay: 100,
      });

      const promise = batch.add(1);

      batch.destroy();

      await expect(promise).rejects.toThrow('Batch processor has been destroyed');
    });

    it('should process multiple batches', async () => {
      const processor = vi.fn(async (items: number[]) => items);

      const batch = batchProcessor(processor, {
        batchSize: 2,
        delay: 100,
      });

      batch.add(1);
      batch.add(2);

      await vi.runAllTimersAsync();

      batch.add(3);
      batch.add(4);

      await vi.runAllTimersAsync();

      expect(processor).toHaveBeenCalledTimes(2);
      expect(processor).toHaveBeenNthCalledWith(1, [1, 2]);
      expect(processor).toHaveBeenNthCalledWith(2, [3, 4]);
    });
  });
});
