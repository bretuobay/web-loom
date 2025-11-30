import { useState, useEffect, useRef } from 'react';
import type { FormInstance, FormState } from '../../../forms-core/src';

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
      const newSelected = selectorRef.current(state); // Check if value has changed
      const hasChanged = equalityRef.current
        ? !equalityRef.current(currentSelected, newSelected)
        : currentSelected !== newSelected;

      if (hasChanged) {
        currentSelected = newSelected;
        setSelectedState(newSelected);
      }
    });

    return unsubscribe;
  }, [form]);

  return selectedState;
}
