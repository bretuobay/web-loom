import { useEffect, useState } from 'react';

type SignalLike<T> = {
  get: () => T;
  subscribe: (fn: () => void) => () => void;
};

export function useSignal<T>(signal: SignalLike<T>): T {
  const [value, setValue] = useState<T>(() => signal.get());

  useEffect(() => {
    const sync = () => {
      setValue(signal.get());
    };

    sync();
    return signal.subscribe(sync);
  }, [signal]);

  return value;
}
