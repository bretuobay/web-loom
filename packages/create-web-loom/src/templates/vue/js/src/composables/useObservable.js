import { onUnmounted, ref } from 'vue';

export function useSignal(signal) {
  const value = ref(signal.get());

  const sync = () => {
    value.value = signal.get();
  };

  sync();
  const unsubscribe = signal.subscribe(sync);
  onUnmounted(unsubscribe);

  return value;
}
