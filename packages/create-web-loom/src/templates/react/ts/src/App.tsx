import { useEffect, useMemo } from 'react';
import { useSignal } from './hooks/useSignal';
import { CounterViewModel } from './viewmodels/CounterViewModel';
import './App.css';

const STACK = ['Vite', 'TypeScript', 'React', '@web-loom/mvvm-core', '@web-loom/signals-core'];

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

const hookSnippet = `import { useSyncExternalStore } from 'react';
import type { ReadonlySignal } from '@web-loom/signals-core';

export function useSignal<T>(source: ReadonlySignal<T>): T {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
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
        <p className="kicker">Web Loom starter (React + TypeScript)</p>
        <h1>MVVM Starter Kit</h1>
        <p className="lead">
          Build on a clean ViewModel-first architecture with signals, predictable state, and framework-agnostic domain
          logic.
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
            <button onClick={() => void vm.decrementCommand.execute()}>-</button>
            <button onClick={() => void vm.resetCommand.execute()}>Reset</button>
            <button onClick={() => void vm.incrementCommand.execute()}>+</button>
          </div>
        </article>

        <article className="card code-card">
          <h2>MVVM Wiring</h2>
          <p className="meta">Starter files already generated in your src folder</p>

          <h3>src/viewmodels/CounterViewModel.ts</h3>
          <pre>
            <code>{vmSnippet}</code>
          </pre>

          <h3>src/hooks/useSignal.ts</h3>
          <pre>
            <code>{hookSnippet}</code>
          </pre>
        </article>
      </section>
    </main>
  );
}
