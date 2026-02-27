import { createSignal, onCleanup } from 'solid-js';

export function useSignalValue(signal) {
  const [value, setValue] = createSignal(signal.get());

  const sync = () => {
    setValue(signal.get());
  };

  sync();
  const unsubscribe = signal.subscribe(sync);
  onCleanup(unsubscribe);

  return value;
}
