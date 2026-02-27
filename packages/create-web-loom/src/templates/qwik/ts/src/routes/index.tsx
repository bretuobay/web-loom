import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { CounterViewModel } from '../viewmodels/CounterViewModel';

const counterViewModel = new CounterViewModel();

export default component$(() => {
  const count = useSignal(0);
  const doubled = useSignal(0);

  useTask$(({ cleanup }) => {
    if (!isBrowser) {
      return;
    }

    const sync = () => {
      count.value = counterViewModel.count.get();
      doubled.value = counterViewModel.doubled.get();
    };

    sync();
    const unsubscribeCount = counterViewModel.count.subscribe(sync);
    const unsubscribeDoubled = counterViewModel.doubled.subscribe(sync);

    cleanup(() => {
      unsubscribeCount();
      unsubscribeDoubled();
    });
  });

  const increment = $(() => counterViewModel.increment());
  const decrement = $(() => counterViewModel.decrement());
  const reset = $(() => counterViewModel.reset());

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem auto', maxWidth: '680px' }}>
      <p>Web Loom starter (Qwik)</p>
      <h1>Counter MVVM</h1>
      <p>Count: <strong>{count.value}</strong></p>
      <p>Doubled: <strong>{doubled.value}</strong></p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick$={decrement}>-</button>
        <button onClick$={reset}>Reset</button>
        <button onClick$={increment}>+</button>
      </div>
    </main>
  );
});
