import { $, component$, useSignal, useTask$ } from '@builder.io/qwik';
import { isBrowser } from '@builder.io/qwik/build';
import { observe } from '@web-loom/signals-core';
import { CounterViewModel } from '../viewmodels/CounterViewModel';
import '../app.css';

const STACK = ['Vite', 'JavaScript', 'Qwik', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `import { Command } from "@web-loom/mvvm-core";
import { computed, signal } from "@web-loom/signals-core";

export class CounterViewModel {
  countState = signal(0);
  count = this.countState.asReadonly();
  doubled = computed(() => this.count.get() * 2);

  incrementCommand = new Command(async () => {
    this.countState.update((value) => value + 1);
  });
  decrementCommand = new Command(async () => {
    this.countState.update((value) => value - 1);
  });
  resetCommand = new Command(async () => {
    this.countState.set(0);
  });
}`;

const counterViewModel = new CounterViewModel();

export default component$(() => {
  const count = useSignal(0);
  const doubled = useSignal(0);

  useTask$(({ cleanup }) => {
    if (!isBrowser) {
      return;
    }

    const stopCount = observe(counterViewModel.count, (value) => {
      count.value = value;
    });
    const stopDoubled = observe(counterViewModel.doubled, (value) => {
      doubled.value = value;
    });

    cleanup(() => {
      stopCount();
      stopDoubled();
    });
  });

  const increment = $(() => void counterViewModel.incrementCommand.execute());
  const decrement = $(() => void counterViewModel.decrementCommand.execute());
  const reset = $(() => void counterViewModel.resetCommand.execute());

  return (
    <main class="starter-root">
      <section class="hero">
        <p class="kicker">Web Loom starter (Qwik + JavaScript)</p>
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
