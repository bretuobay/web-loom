import { onCleanup } from 'solid-js';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import { useSignalValue } from './hooks/useObservable';
import './App.css';

const STACK = ['Vite', 'TypeScript', 'Solid', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `export class CounterViewModel {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

export default function App() {
  const vm = new CounterViewModel();
  onCleanup(() => vm.dispose());

  const count = useSignalValue(vm.count);
  const doubled = useSignalValue(vm.doubled);

  return (
    <main class="starter-root">
      <section class="hero">
        <p class="kicker">Web Loom starter (Solid + TypeScript)</p>
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
            <button onClick={() => vm.decrement()}>-</button>
            <button onClick={() => vm.reset()}>Reset</button>
            <button onClick={() => vm.increment()}>+</button>
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
