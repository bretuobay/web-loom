export const useObservableTemplate = `import { useState, useEffect } from 'react';
import type { Signal } from '@web-loom/signals-core';

export function useSignal<T>(signal: Signal<T>): T {
  const [value, setValue] = useState<T>(() => signal.get());

  useEffect(() => {
    return signal.subscribe((next) => setValue(next));
  }, [signal]);

  return value;
}
`;

export const counterComponentTemplate = `import { useMemo, useEffect } from 'react';
import { useSignal } from '../hooks/useObservable';
import { CounterViewModel } from '../viewmodels/CounterViewModel';

export function Counter() {
  const vm = useMemo(() => new CounterViewModel(), []);

  useEffect(() => {
    return () => vm.dispose();
  }, [vm]);

  const count = useSignal(vm.count);
  const doubled = useSignal(vm.doubled);

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '2rem' }}>
      <h2>Web Loom Counter</h2>
      <p>Count: <strong>{count}</strong></p>
      <p>Doubled: <strong>{doubled}</strong></p>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button onClick={() => vm.decrement()}>-</button>
        <button onClick={() => vm.reset()}>Reset</button>
        <button onClick={() => vm.increment()}>+</button>
      </div>
    </div>
  );
}
`;
