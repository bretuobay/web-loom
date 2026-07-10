import { useEffect, useState } from 'preact/hooks';
import { observe } from '@web-loom/signals-core';

export function useSignal(source) {
  const [value, setValue] = useState(() => source.peek());

  useEffect(() => {
    return observe(source, setValue);
  }, [source]);

  return value;
}
