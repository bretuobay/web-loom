import './style.css';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const vmSnippet = `export class CounterViewModel {
  count = signal(0);
  doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

const app = document.querySelector('#app');
if (!app) {
  throw new Error('Web Loom starter expected #app root element.');
}

const vm = new CounterViewModel();

app.innerHTML = `
  <main class="starter-root">
    <section class="hero">
      <p class="kicker">Web Loom starter (Vanilla + JavaScript)</p>
      <h1>MVVM Starter Kit</h1>
      <p class="lead">Framework-free UI connected to the same Web Loom ViewModel and signal primitives.</p>
      <div class="stack" role="list" aria-label="Starter technologies">
        <span role="listitem" class="chip">Vite</span>
        <span role="listitem" class="chip">JavaScript</span>
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

const countEl = app.querySelector('#count');
const doubledEl = app.querySelector('#doubled');
const snippetEl = app.querySelector('#vm-snippet');

if (!countEl || !doubledEl || !snippetEl) {
  throw new Error('Web Loom starter failed to mount required elements.');
}

snippetEl.textContent = vmSnippet;

const render = () => {
  countEl.textContent = String(vm.count.get());
  doubledEl.textContent = String(vm.doubled.get());
};

const unsubscribeCount = vm.count.subscribe(render);
const unsubscribeDoubled = vm.doubled.subscribe(render);

render();

app.querySelector('#inc')?.addEventListener('click', () => vm.increment());
app.querySelector('#dec')?.addEventListener('click', () => vm.decrement());
app.querySelector('#reset')?.addEventListener('click', () => vm.reset());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribeCount();
    unsubscribeDoubled();
    vm.dispose();
  });
}
