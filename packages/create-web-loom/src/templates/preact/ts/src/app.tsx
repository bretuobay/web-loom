import { useEffect, useMemo } from 'preact/hooks';
import { useSignal } from './hooks/useObservable';
import { CounterViewModel } from './viewmodels/CounterViewModel';

export default function App() {
  const vm = useMemo(() => new CounterViewModel(), []);

  useEffect(() => {
    return () => vm.dispose();
  }, [vm]);

  const count = useSignal(vm.count);
  const doubled = useSignal(vm.doubled);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem auto', maxWidth: 680 }}>
      <p>Web Loom starter (Preact + TypeScript)</p>
      <h1>Counter MVVM</h1>
      <p>Count: <strong>{count}</strong></p>
      <p>Doubled: <strong>{doubled}</strong></p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => vm.decrement()}>-</button>
        <button onClick={() => vm.reset()}>Reset</button>
        <button onClick={() => vm.increment()}>+</button>
      </div>
    </main>
  );
}
