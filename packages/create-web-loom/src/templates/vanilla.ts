export const counterTemplate = `import { CounterViewModel } from './viewmodels/CounterViewModel';

const vm = new CounterViewModel();

const countEl = document.getElementById('count')!;
const doubledEl = document.getElementById('doubled')!;

vm.count.subscribe((n) => { countEl.textContent = String(n); });
vm.doubled.subscribe((n) => { doubledEl.textContent = String(n); });

document.getElementById('btn-inc')?.addEventListener('click', () => vm.increment());
document.getElementById('btn-dec')?.addEventListener('click', () => vm.decrement());
document.getElementById('btn-reset')?.addEventListener('click', () => vm.reset());

// Cleanup on page unload
window.addEventListener('beforeunload', () => vm.dispose());
`;

export const counterHtmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Loom Counter</title>
    <style>
      body { font-family: sans-serif; text-align: center; padding: 2rem; }
      .controls { display: flex; gap: 0.5rem; justify-content: center; }
    </style>
  </head>
  <body>
    <h2>Web Loom Counter</h2>
    <p>Count: <strong id="count">0</strong></p>
    <p>Doubled: <strong id="doubled">0</strong></p>
    <div class="controls">
      <button id="btn-dec">-</button>
      <button id="btn-reset">Reset</button>
      <button id="btn-inc">+</button>
    </div>
    <script type="module" src="/src/counter.ts"></script>
  </body>
</html>
`;
