import { useEffect, useMemo } from 'react';
import { useSignal } from './hooks/useObservable';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import './App.css';

const STACK = ['Vite', 'JavaScript', 'React', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `import { computed, signal } from '@web-loom/signals-core';

export class CounterViewModel {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

const hookSnippet = `export function useSignal(signal) {
  const [value, setValue] = useState(() => signal.get());

  useEffect(() => {
    const sync = () => setValue(signal.get());
    sync();
    return signal.subscribe(sync);
  }, [signal]);

  return value;
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
        <p className="kicker">Web Loom starter (React + JavaScript)</p>
        <h1>MVVM Starter Kit</h1>
        <p className="lead">
          Build on a clean ViewModel-first architecture with signals, predictable state, and framework-agnostic domain logic.
        </p>
        <div className="stack" role="list" aria-label="Starter technologies">
          {STACK.map((item) => (
            <span key={item} role="listitem" className="chip">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="grid">
        <article className="card counter-card">
          <h2>Live Counter Demo</h2>
          <p className="meta">Driven by CounterViewModel with @web-loom/signals-core</p>
          <div className="metrics">
            <div>
              <span>Count</span>
              <strong>{count}</strong>
            </div>
            <div>
              <span>Doubled</span>
              <strong>{doubled}</strong>
            </div>
          </div>
          <div className="controls">
            <button onClick={() => vm.decrement()}>-</button>
            <button onClick={() => vm.reset()}>Reset</button>
            <button onClick={() => vm.increment()}>+</button>
          </div>
        </article>

        <article className="card code-card">
          <h2>MVVM Wiring</h2>
          <p className="meta">Starter files already generated in your src folder</p>

          <h3>src/viewmodels/CounterViewModel.ts</h3>
          <pre>
            <code>{vmSnippet}</code>
          </pre>

          <h3>src/hooks/useObservable.js</h3>
          <pre>
            <code>{hookSnippet}</code>
          </pre>
        </article>
      </section>
    </main>
  );
}
