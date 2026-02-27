import { onUnmounted, ref } from 'vue';

type SignalLike<T> = {
  get: () => T;
  subscribe: (fn: () => void) => () => void;
};

export function useSignal<T>(signal: SignalLike<T>) {
  const value = ref<T>(signal.get());

  const sync = () => {
    value.value = signal.get();
  };

  sync();
  const unsubscribe = signal.subscribe(sync);
  onUnmounted(unsubscribe);

  return value;
}
