import { ref, onUnmounted } from 'vue';
import { Observable } from 'rxjs';

export function useObservable<T>(observable: Observable<T>, initialValue: any) {
  const value = ref<T | undefined>(initialValue);
  const subscription = observable.subscribe({
    next: (val) => {
      value.value = val;
    },
  });

  onUnmounted(() => {
    subscription.unsubscribe();
  });

  return value;
}
