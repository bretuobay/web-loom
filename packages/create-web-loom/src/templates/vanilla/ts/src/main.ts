import './style.css';
import { observe } from '@web-loom/signals-core';
import { CounterViewModel } from './viewmodels/CounterViewModel';

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

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Web Loom starter expected #app root element.');
}

const vm = new CounterViewModel();

app.innerHTML = `
  <main class="starter-root">
    <section class="hero">
      <p class="kicker">Web Loom starter (Vanilla + TypeScript)</p>
      <h1>MVVM Starter Kit</h1>
      <p class="lead">Framework-free UI connected to the same Web Loom ViewModel and signal primitives.</p>
      <div class="stack" role="list" aria-label="Starter technologies">
        <span role="listitem" class="chip">Vite</span>
        <span role="listitem" class="chip">TypeScript</span>
        <span role="listitem" class="chip">Vanilla</span>
        <span role="listitem" class="chip">@web-loom/mvvm-core</span>
        <span role="listitem" class="chip">@web-loom/signals-core</span>
      </div>
    </section>

    <section class="grid">
      <article class="card counter-card">
        <h2>Live Counter Demo</h2>
        <p class="meta">CounterViewModel wired directly to the DOM</p>
        <div class="metrics">
          <div><span>Count</span><strong id="count">0</strong></div>
          <div><span>Doubled</span><strong id="doubled">0</strong></div>
        </div>
        <div class="controls">
          <button id="dec">-</button>
          <button id="reset">Reset</button>
          <button id="inc">+</button>
        </div>
      </article>

      <article class="card code-card">
        <h2>MVVM Wiring</h2>
        <p class="meta">Generated starter files in src/</p>
        <h3>src/viewmodels/CounterViewModel.ts</h3>
        <pre><code id="vm-snippet"></code></pre>
      </article>
    </section>
  </main>
`;

const countEl = app.querySelector<HTMLElement>('#count');
const doubledEl = app.querySelector<HTMLElement>('#doubled');
const snippetEl = app.querySelector<HTMLElement>('#vm-snippet');

if (!countEl || !doubledEl || !snippetEl) {
  throw new Error('Web Loom starter failed to mount required elements.');
}

snippetEl.textContent = vmSnippet;

const stopCount = observe(vm.count, (count) => {
  countEl.textContent = String(count);
});
const stopDoubled = observe(vm.doubled, (doubled) => {
  doubledEl.textContent = String(doubled);
});

app.querySelector<HTMLButtonElement>('#dec')?.addEventListener('click', () => void vm.decrementCommand.execute());
app.querySelector<HTMLButtonElement>('#reset')?.addEventListener('click', () => void vm.resetCommand.execute());
app.querySelector<HTMLButtonElement>('#inc')?.addEventListener('click', () => void vm.incrementCommand.execute());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopCount();
    stopDoubled();
    vm.dispose();
  });
}
