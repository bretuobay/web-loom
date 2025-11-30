import { ref, onUnmounted } from 'vue';
import type { FormInstance, FormState } from '../../../forms-core/src';

/**
 * Composable to subscribe to specific parts of form state
 */
export function useFormSubscription<TValues extends Record<string, unknown>, TSelected>(
  form: FormInstance<TValues>,
  selector: (state: FormState<TValues>) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean,
) {
  const selectedState = ref<TSelected>(selector(form.getState()));

  let currentSelected = selectedState.value;

  const unsubscribe = form.subscribe('stateChange', (state) => {
    const newSelected = selector(state);

    // Check if value has changed
    const hasChanged = equalityFn ? !equalityFn(currentSelected, newSelected) : currentSelected !== newSelected;

    if (hasChanged) {
      currentSelected = newSelected;
      selectedState.value = newSelected;
    }
  });

  // Cleanup subscription on unmount
  onUnmounted(() => {
    unsubscribe();
  });

  return selectedState;
}
