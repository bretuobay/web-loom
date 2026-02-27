import { createSignal, onCleanup } from 'solid-js';

type SignalLike<T> = {
  get: () => T;
  subscribe: (fn: () => void) => () => void;
};

export function useSignalValue<T>(signal: SignalLike<T>) {
  const [value, setValue] = createSignal(signal.get());

  const sync = () => {
    setValue(signal.get());
  };

  sync();
  const unsubscribe = signal.subscribe(sync);
  onCleanup(unsubscribe);

  return value;
}
