import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import './app.css';

const STACK = ['Vite', 'TypeScript', 'Qwik', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `export class CounterViewModel {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

const counterViewModel = new CounterViewModel();

export const App = component$(() => {
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
    <main class="starter-root">
      <section class="hero">
        <p class="kicker">Web Loom starter (Qwik + TypeScript)</p>
        <h1>MVVM Starter Kit</h1>
        <p class="lead">Resumable Qwik UI powered by a framework-agnostic ViewModel and signal layer.</p>
        <div class="stack" role="list" aria-label="Starter technologies">
          {STACK.map((item) => (
            <span key={item} role="listitem" class="chip">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section class="grid">
        <article class="card counter-card">
          <h2>Live Counter Demo</h2>
          <p class="meta">CounterViewModel + Qwik task synchronization</p>
          <div class="metrics">
            <div>
              <span>Count</span>
              <strong>{count.value}</strong>
            </div>
            <div>
              <span>Doubled</span>
              <strong>{doubled.value}</strong>
            </div>
          </div>
          <div class="controls">
            <button onClick$={decrement}>-</button>
            <button onClick$={reset}>Reset</button>
            <button onClick$={increment}>+</button>
          </div>
        </article>

        <article class="card code-card">
          <h2>MVVM Wiring</h2>
          <p class="meta">Generated starter files in src/</p>
          <h3>src/viewmodels/CounterViewModel.ts</h3>
          <pre>
            <code>{vmSnippet}</code>
          </pre>
        </article>
      </section>
    </main>
  );
});
