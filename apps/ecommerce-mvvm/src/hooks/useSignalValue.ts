import { useEffect, useState } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

export function useSignalValue<T>(signalValue: ReadonlySignal<T>): T {
  const [value, setValue] = useState<T>(() => signalValue.get());

  useEffect(() => {
    const unsubscribe = signalValue.subscribe(() => {
      setValue(signalValue.get());
    });

    return unsubscribe;
  }, [signalValue]);

  return value;
}
