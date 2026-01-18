import { useEffect, useRef, useState } from 'react';
import type { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

// Shallow comparison for arrays and objects
const shallowEqual = <T>(a: T, b: T): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;

  // Array comparison - compare by length and item references
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }

  // Object comparison - compare keys and value references
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]);
};

export function useObservable<T>(observable: Observable<T>, initialValue: T) {
  // Track current value to avoid stale closures
  const valueRef = useRef<T>(initialValue);

  const [value, setValue] = useState(() => {
    // Synchronously read the current value from BehaviorSubject
    // This prevents the flash of initialValue when the observable already has a value
    let syncValue = initialValue;
    const sub = observable.subscribe((v) => {
      syncValue = v;
    });
    sub.unsubscribe();
    valueRef.current = syncValue;
    return syncValue;
  });

  useEffect(() => {
    // Use distinctUntilChanged with shallow comparison to prevent redundant updates
    const subscription = observable.pipe(distinctUntilChanged(shallowEqual)).subscribe((newValue) => {
      // Additional guard: only update if value actually changed
      if (!shallowEqual(valueRef.current, newValue)) {
        valueRef.current = newValue;
        setValue(newValue);
      }
    });
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}
