import { useEffect, useMemo } from 'preact/hooks';
import { useSignal } from './hooks/useObservable';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import './app.css';

const STACK = ['Vite', 'JavaScript', 'Preact', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `export class CounterViewModel {
  count = signal(0);
  doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

export default function App() {
  const vm = useMemo(() => new CounterViewModel(), []);

  useEffect(() => {
    return () => vm.dispose();
  }, [vm]);

  const count = useSignal(vm.count);
  const doubled = useSignal(vm.doubled);

  return (
    <main className="starter-root">
      <section className="hero">
        <p className="kicker">Web Loom starter (Preact + JavaScript)</p>
        <h1>MVVM Starter Kit</h1>
        <p className="lead">Signals-powered ViewModel state with lightweight Preact rendering.</p>
        <div className="stack" role="list" aria-label="Starter technologies">
          {STACK.map((item) => (
            <span key={item} role="listitem" className="chip">{item}</span>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="card counter-card">
          <h2>Live Counter Demo</h2>
          <p className="meta">CounterViewModel + useSignal bridge</p>
          <div className="metrics">
            <div><span>Count</span><strong>{count}</strong></div>
            <div><span>Doubled</span><strong>{doubled}</strong></div>
          </div>
          <div className="controls">
            <button onClick={() => vm.decrement()}>-</button>
            <button onClick={() => vm.reset()}>Reset</button>
            <button onClick={() => vm.increment()}>+</button>
          </div>
        </article>

        <article className="card code-card">
          <h2>MVVM Wiring</h2>
          <p className="meta">Generated starter files in src/</p>
          <h3>src/viewmodels/CounterViewModel.ts</h3>
          <pre><code>{vmSnippet}</code></pre>
        </article>
      </section>
    </main>
  );
}
