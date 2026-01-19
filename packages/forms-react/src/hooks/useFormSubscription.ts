import { useState, useEffect, useRef } from 'react';
import type { FormInstance, FormState } from '../../../forms-core/src';

function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }

  const aKeys = Object.keys(a as Record<PropertyKey, unknown>);
  const bKeys = Object.keys(b as Record<PropertyKey, unknown>);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if ((a as Record<string, unknown>)[key] !== (b as Record<string, unknown>)[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Hook to subscribe to specific parts of form state
 */
export function useFormSubscription<TValues extends Record<string, unknown>, TSelected>(
  form: FormInstance<TValues>,
  selector: (state: FormState<TValues>) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean,
): TSelected {
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);

  // Update refs
  selectorRef.current = selector;
  equalityRef.current = equalityFn;

  const [selectedState, setSelectedState] = useState<TSelected>(() => selector(form.getState()));

  useEffect(() => {
    let currentSelected = selectorRef.current(form.getState());
    setSelectedState(currentSelected);

    const unsubscribe = form.subscribe('stateChange', (state: FormState<TValues>) => {
      const newSelected = selectorRef.current(state);
      const hasChanged = equalityRef.current
        ? !equalityRef.current(currentSelected, newSelected)
        : !shallowEqual(currentSelected, newSelected);

      if (hasChanged) {
        currentSelected = newSelected;
        setSelectedState(newSelected);
      }
    });

    return unsubscribe;
  }, [form]);

  return selectedState;
}
