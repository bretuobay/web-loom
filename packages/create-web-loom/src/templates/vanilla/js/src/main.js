import './style.css';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const app = document.querySelector('#app');
if (!app) {
  throw new Error('Web Loom starter expected #app root element.');
}

const vm = new CounterViewModel();

app.innerHTML = `
  <main style="font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 680px">
    <p>Web Loom starter (Vanilla + JavaScript)</p>
    <h1>Counter MVVM</h1>
    <p>Count: <strong id="count">0</strong></p>
    <p>Doubled: <strong id="doubled">0</strong></p>
    <div style="display: flex; gap: 0.5rem">
      <button id="dec">-</button>
      <button id="reset">Reset</button>
      <button id="inc">+</button>
    </div>
  </main>
`;

const countEl = app.querySelector('#count');
const doubledEl = app.querySelector('#doubled');

if (!countEl || !doubledEl) {
  throw new Error('Web Loom starter failed to mount counter elements.');
}

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
