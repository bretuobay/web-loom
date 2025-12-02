import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';
import { useObservable } from './useObservable';

describe('useObservable', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial value on mount', () => {
    const observable = new BehaviorSubject<number>(42);
    const { result } = renderHook(() => useObservable(observable, 0));

    expect(result.current).toBe(42);
  });

  it('should use provided initial value when observable has no initial value', () => {
    const observable = new Subject<number>();
    const { result } = renderHook(() => useObservable(observable, 100));

    expect(result.current).toBe(100);
  });

  it('should update value when observable emits', async () => {
    const observable = new BehaviorSubject<number>(1);
    const { result } = renderHook(() => useObservable(observable, 0));

    expect(result.current).toBe(1);

    observable.next(2);

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
  });

  it('should handle multiple emissions', async () => {
    const observable = new BehaviorSubject<string>('first');
    const { result } = renderHook(() => useObservable(observable, ''));

    expect(result.current).toBe('first');

    observable.next('second');
    await waitFor(() => {
      expect(result.current).toBe('second');
    });

    observable.next('third');
    await waitFor(() => {
      expect(result.current).toBe('third');
    });
  });

  it('should handle complex object values', async () => {
    interface TestData {
      id: number;
      name: string;
    }

    const observable = new BehaviorSubject<TestData>({ id: 1, name: 'Test' });
    const { result } = renderHook(() => useObservable(observable, { id: 0, name: '' }));

    expect(result.current).toEqual({ id: 1, name: 'Test' });

    observable.next({ id: 2, name: 'Updated' });

    await waitFor(() => {
      expect(result.current).toEqual({ id: 2, name: 'Updated' });
    });
  });

  it('should handle array values', async () => {
    const observable = new BehaviorSubject<number[]>([1, 2, 3]);
    const { result } = renderHook(() => useObservable(observable, []));

    expect(result.current).toEqual([1, 2, 3]);

    observable.next([4, 5, 6]);

    await waitFor(() => {
      expect(result.current).toEqual([4, 5, 6]);
    });
  });

  it('should unsubscribe on unmount', () => {
    const observable = new BehaviorSubject<number>(1);
    const unsubscribeSpy = vi.fn();
    const originalUnsubscribe = observable.subscribe(vi.fn()).unsubscribe;

    // Spy on the unsubscribe method
    vi.spyOn(observable, 'subscribe').mockImplementation((observer: any) => {
      const subscription = {
        unsubscribe: () => {
          unsubscribeSpy();
          originalUnsubscribe.call(subscription);
        },
        closed: false,
      };
      observable.next = (value: any) => {
        if (typeof observer === 'function') {
          observer(value);
        } else if (observer && typeof observer.next === 'function') {
          observer.next(value);
        }
      };
      return subscription as any;
    });

    const { unmount } = renderHook(() => useObservable(observable, 0));

    unmount();

    // Verify unsubscribe was called
    expect(unsubscribeSpy).toHaveBeenCalled();
  });

  it('should handle observable changes', async () => {
    const observable1 = new BehaviorSubject<number>(1);
    const observable2 = new BehaviorSubject<number>(100);

    const { result, rerender } = renderHook(({ obs }) => useObservable(obs, 0), {
      initialProps: { obs: observable1 },
    });

    expect(result.current).toBe(1);

    // Change observable
    rerender({ obs: observable2 });

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });

  it('should handle boolean values', async () => {
    const observable = new BehaviorSubject<boolean>(false);
    const { result } = renderHook(() => useObservable(observable, true));

    expect(result.current).toBe(false);

    observable.next(true);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should handle null and undefined values', async () => {
    const observable = new BehaviorSubject<string | null>(null);
    const { result } = renderHook(() => useObservable(observable, 'default'));

    expect(result.current).toBe(null);

    observable.next('value');

    await waitFor(() => {
      expect(result.current).toBe('value');
    });

    observable.next(null);

    await waitFor(() => {
      expect(result.current).toBe(null);
    });
  });

  it('should not cause memory leaks with rapid updates', async () => {
    const observable = new BehaviorSubject<number>(0);
    const { result } = renderHook(() => useObservable(observable, 0));

    // Emit many values rapidly
    for (let i = 1; i <= 100; i++) {
      observable.next(i);
    }

    await waitFor(() => {
      expect(result.current).toBe(100);
    });
  });
});
