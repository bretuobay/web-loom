import { onCleanup } from 'solid-js';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import { useSignalValue } from './hooks/useObservable';

export default function App() {
  const vm = new CounterViewModel();
  onCleanup(() => vm.dispose());

  const count = useSignalValue(vm.count);
  const doubled = useSignalValue(vm.doubled);

  return (
    <main style={{ 'font-family': 'system-ui, sans-serif', margin: '2rem auto', 'max-width': '680px' }}>
      <p>Web Loom starter (Solid + JavaScript)</p>
      <h1>Counter MVVM</h1>
      <p>Count: <strong>{count()}</strong></p>
      <p>Doubled: <strong>{doubled()}</strong></p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => vm.decrement()}>-</button>
        <button onClick={() => vm.reset()}>Reset</button>
        <button onClick={() => vm.increment()}>+</button>
      </div>
    </main>
  );
}
