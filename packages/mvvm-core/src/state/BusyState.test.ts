import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { BusyState } from './BusyState';

describe('BusyState', () => {
  let busyState: BusyState;

  beforeEach(() => {
    busyState = new BusyState();
  });

  describe('setBusy', () => {
    it('should return a cleanup function', () => {
      const clearBusy = busyState.setBusy('Test');
      expect(typeof clearBusy).toBe('function');
      clearBusy();
    });

    it('should set isBusy to true', async () => {
      busyState.setBusy('Test');
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(true);
    });

    it('should clear busy state when cleanup is called', async () => {
      const clearBusy = busyState.setBusy('Test');
      clearBusy();
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(false);
    });

    it('should handle multiple concurrent operations', async () => {
      const clear1 = busyState.setBusy('Op 1');
      const clear2 = busyState.setBusy('Op 2');

      expect(busyState.operationCount).toBe(2);

      clear1();
      expect(busyState.operationCount).toBe(1);
      expect(busyState.isBusy).toBe(true);

      clear2();
      expect(busyState.operationCount).toBe(0);
      expect(busyState.isBusy).toBe(false);
    });

    it('should not double-clear', () => {
      const clearBusy = busyState.setBusy('Test');
      clearBusy();
      clearBusy(); // Second call should be no-op
      expect(busyState.operationCount).toBe(0);
    });

    it('should use default reason when not provided', async () => {
      busyState.setBusy();
      const reasons = await firstValueFrom(busyState.busyReasons$);
      expect(reasons).toContain('Loading');
    });
  });

  describe('executeBusy', () => {
    it('should set busy during operation', async () => {
      let wasBusy = false;

      await busyState.executeBusy(async () => {
        wasBusy = busyState.isBusy;
      }, 'Test');

      expect(wasBusy).toBe(true);
      expect(busyState.isBusy).toBe(false);
    });

    it('should return operation result', async () => {
      const result = await busyState.executeBusy(
        async () => 'result',
        'Test'
      );
      expect(result).toBe('result');
    });

    it('should clear busy even on error', async () => {
      await expect(
        busyState.executeBusy(async () => {
          throw new Error('Test error');
        }, 'Test')
      ).rejects.toThrow('Test error');

      expect(busyState.isBusy).toBe(false);
    });

    it('should use default reason when not provided', async () => {
      let capturedReason: string | null = null;

      await busyState.executeBusy(async () => {
        capturedReason = await firstValueFrom(busyState.currentReason$);
      });

      expect(capturedReason).toBe('Loading');
    });

    it('should handle multiple concurrent executeBusy calls', async () => {
      const results = await Promise.all([
        busyState.executeBusy(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result1';
        }, 'Op 1'),
        busyState.executeBusy(async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return 'result2';
        }, 'Op 2'),
      ]);

      expect(results).toEqual(['result1', 'result2']);
      expect(busyState.isBusy).toBe(false);
    });
  });

  describe('isBusy$', () => {
    it('should emit false initially', async () => {
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(false);
    });

    it('should emit true when busy', async () => {
      busyState.setBusy('Test');
      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(true);
    });

    it('should emit distinct values only', async () => {
      const values: boolean[] = [];
      const subscription = busyState.isBusy$.subscribe(val => values.push(val));

      const clear1 = busyState.setBusy('Op 1');
      const clear2 = busyState.setBusy('Op 2');
      clear1();
      clear2();

      subscription.unsubscribe();

      // Should only emit: false (initial), true (first busy), false (all cleared)
      expect(values).toEqual([false, true, false]);
    });
  });

  describe('operations$', () => {
    it('should emit operation details', async () => {
      busyState.setBusy('Loading users');
      const operations = await firstValueFrom(busyState.operations$);

      expect(operations).toHaveLength(1);
      expect(operations[0].reason).toBe('Loading users');
      expect(operations[0].startTime).toBeInstanceOf(Date);
      expect(operations[0].id).toMatch(/^op_\d+_\d+$/);
    });

    it('should emit empty array initially', async () => {
      const operations = await firstValueFrom(busyState.operations$);
      expect(operations).toEqual([]);
    });

    it('should track multiple operations', async () => {
      busyState.setBusy('Op 1');
      busyState.setBusy('Op 2');
      busyState.setBusy('Op 3');

      const operations = await firstValueFrom(busyState.operations$);
      expect(operations).toHaveLength(3);
      expect(operations.map(op => op.reason)).toEqual(['Op 1', 'Op 2', 'Op 3']);
    });
  });

  describe('busyReasons$', () => {
    it('should emit array of reasons', async () => {
      busyState.setBusy('Op 1');
      busyState.setBusy('Op 2');

      const reasons = await firstValueFrom(busyState.busyReasons$);
      expect(reasons).toEqual(['Op 1', 'Op 2']);
    });

    it('should emit empty array when not busy', async () => {
      const reasons = await firstValueFrom(busyState.busyReasons$);
      expect(reasons).toEqual([]);
    });
  });

  describe('currentReason$', () => {
    it('should emit most recent reason', async () => {
      busyState.setBusy('First');
      busyState.setBusy('Second');

      const reason = await firstValueFrom(busyState.currentReason$);
      expect(reason).toBe('Second');
    });

    it('should emit null when not busy', async () => {
      const reason = await firstValueFrom(busyState.currentReason$);
      expect(reason).toBeNull();
    });

    it('should update when operations complete', async () => {
      const clear1 = busyState.setBusy('First');
      busyState.setBusy('Second');

      clear1();

      const reason = await firstValueFrom(busyState.currentReason$);
      expect(reason).toBe('Second');
    });
  });

  describe('isBusy (synchronous)', () => {
    it('should return false initially', () => {
      expect(busyState.isBusy).toBe(false);
    });

    it('should return true when busy', () => {
      busyState.setBusy('Test');
      expect(busyState.isBusy).toBe(true);
    });

    it('should return false after clearing', () => {
      const clearBusy = busyState.setBusy('Test');
      clearBusy();
      expect(busyState.isBusy).toBe(false);
    });
  });

  describe('operationCount', () => {
    it('should return 0 initially', () => {
      expect(busyState.operationCount).toBe(0);
    });

    it('should track operation count', () => {
      const clear1 = busyState.setBusy('Op 1');
      expect(busyState.operationCount).toBe(1);

      const clear2 = busyState.setBusy('Op 2');
      expect(busyState.operationCount).toBe(2);

      clear1();
      expect(busyState.operationCount).toBe(1);

      clear2();
      expect(busyState.operationCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all operations', () => {
      busyState.setBusy('Op 1');
      busyState.setBusy('Op 2');

      busyState.clearAll();

      expect(busyState.isBusy).toBe(false);
      expect(busyState.operationCount).toBe(0);
    });

    it('should emit updates after clearing', async () => {
      busyState.setBusy('Op 1');
      busyState.clearAll();

      const isBusy = await firstValueFrom(busyState.isBusy$);
      expect(isBusy).toBe(false);
    });
  });

  describe('dispose', () => {
    it('should complete observables', async () => {
      const completeSpy = vi.fn();
      busyState.isBusy$.subscribe({ complete: completeSpy });

      busyState.dispose();

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should clear operations', () => {
      busyState.setBusy('Test');
      busyState.dispose();

      expect(busyState.operationCount).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid setBusy/clear cycles', () => {
      for (let i = 0; i < 100; i++) {
        const clear = busyState.setBusy(`Op ${i}`);
        clear();
      }

      expect(busyState.isBusy).toBe(false);
      expect(busyState.operationCount).toBe(0);
    });

    it('should generate unique operation IDs', () => {
      const clear1 = busyState.setBusy('Op 1');
      const clear2 = busyState.setBusy('Op 2');

      const operations = Array.from((busyState as any).operations.values());
      const ids = operations.map((op: any) => op.id);

      expect(new Set(ids).size).toBe(2); // All IDs should be unique

      clear1();
      clear2();
    });

    it('should handle empty reason string', async () => {
      busyState.setBusy('');
      const reasons = await firstValueFrom(busyState.busyReasons$);
      expect(reasons).toEqual(['']);
    });
  });
});
