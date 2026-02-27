import { useEffect, useState } from 'react';

export function useSignal(signal) {
  const [value, setValue] = useState(() => signal.get());

  useEffect(() => {
    const sync = () => {
      setValue(signal.get());
    };

    sync();
    return signal.subscribe(sync);
  }, [signal]);

  return value;
}
