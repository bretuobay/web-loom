import { useEffect, useState } from 'preact/hooks';
import { observe, type ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): T {
  const [value, setValue] = useState<T>(() => source.peek());

  useEffect(() => {
    return observe(source, setValue);
  }, [source]);

  return value;
}
