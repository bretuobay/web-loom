import { onCleanup } from 'solid-js';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import { useSignalValue } from './hooks/useSignalValue';
import './App.css';

const STACK = ['Vite', 'JavaScript', 'Solid', '@web-loom/mvvm-core', '@web-loom/signals-core'];

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

export default function App() {
  const vm = new CounterViewModel();
  onCleanup(() => vm.dispose());

  const count = useSignalValue(vm.count);
  const doubled = useSignalValue(vm.doubled);

  return (
    <main class="starter-root">
      <section class="hero">
        <p class="kicker">Web Loom starter (Solid + JavaScript)</p>
        <h1>MVVM Starter Kit</h1>
        <p class="lead">Fine-grained updates from a framework-agnostic ViewModel layer.</p>
        <div class="stack" role="list" aria-label="Starter technologies">
          {STACK.map((item) => (
            <span role="listitem" class="chip">{item}</span>
          ))}
        </div>
      </section>

      <section class="grid">
        <article class="card counter-card">
          <h2>Live Counter Demo</h2>
          <p class="meta">CounterViewModel + reactive signal bridge</p>
          <div class="metrics">
            <div><span>Count</span><strong>{count()}</strong></div>
            <div><span>Doubled</span><strong>{doubled()}</strong></div>
          </div>
          <div class="controls">
            <button onClick={() => void vm.decrementCommand.execute()}>-</button>
            <button onClick={() => void vm.resetCommand.execute()}>Reset</button>
            <button onClick={() => void vm.incrementCommand.execute()}>+</button>
          </div>
        </article>

        <article class="card code-card">
          <h2>MVVM Wiring</h2>
          <p class="meta">Generated starter files in src/</p>
          <h3>src/viewmodels/CounterViewModel.ts</h3>
          <pre><code>{vmSnippet}</code></pre>
        </article>
      </section>
    </main>
  );
}
