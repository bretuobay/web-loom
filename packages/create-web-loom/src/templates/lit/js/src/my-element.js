import { css, html, LitElement } from 'lit';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const STACK = ['Vite', 'JavaScript', 'Lit', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `export class CounterViewModel {
  count = signal(0);
  doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: 'Space Grotesk', 'Avenir Next', 'Segoe UI', sans-serif;
      color: #152334;
      background: radial-gradient(circle at 15% 0%, #d4f7ff 0%, #eef7ff 35%, #f8f4ea 100%);
    }

    * {
      box-sizing: border-box;
    }

    .starter-root {
      max-width: 1120px;
      margin: 0 auto;
      padding: 3.5rem 1.25rem 4rem;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(2rem, 6vw, 4rem);
      letter-spacing: -0.03em;
      color: #0b1f34;
    }

    .kicker {
      margin: 0 0 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
      font-size: 0.78rem;
      color: #2e4f74;
    }

    .lead {
      margin: 1rem 0 1.6rem;
      max-width: 68ch;
      color: #2f3f51;
    }

    .stack {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .chip {
      border: 1px solid #9bc6de;
      background: rgba(255, 255, 255, 0.7);
      color: #20466b;
      border-radius: 999px;
      padding: 0.36rem 0.8rem;
      font-size: 0.83rem;
      font-weight: 600;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid #bfd9e8;
      border-radius: 1.1rem;
      padding: 1.2rem;
      backdrop-filter: blur(8px);
      box-shadow: 0 14px 34px rgba(18, 46, 74, 0.12);
    }

    .card h2 {
      margin: 0;
      font-size: 1.22rem;
      color: #112a44;
    }

    .meta {
      margin: 0.45rem 0 1rem;
      color: #3d5872;
      font-size: 0.92rem;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem;
      margin-bottom: 1rem;
    }

    .metrics div {
      border: 1px solid #c9dfeb;
      border-radius: 0.8rem;
      padding: 0.8rem;
      background: #f9fcff;
    }

    .metrics span {
      display: block;
      font-size: 0.78rem;
      color: #4d6a84;
      margin-bottom: 0.2rem;
    }

    .metrics strong {
      font-size: 1.5rem;
      color: #0d2845;
    }

    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
    }

    .controls button {
      border: none;
      border-radius: 0.72rem;
      padding: 0.65rem 1rem;
      min-width: 3.2rem;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.98rem;
      color: #ffffff;
      background: linear-gradient(120deg, #0e5b9c, #297dbf);
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease;
    }

    .controls button:hover {
      transform: translateY(-1px);
      filter: brightness(1.05);
    }

    .controls button:active {
      transform: translateY(0);
    }

    .code-card h3 {
      margin: 0.9rem 0 0.45rem;
      font-size: 0.9rem;
      color: #2f4b66;
    }

    .code-card pre {
      margin: 0;
      overflow-x: auto;
      background: #10243b;
      border: 1px solid #173451;
      border-radius: 0.85rem;
      padding: 0.8rem;
    }

    .code-card code {
      color: #d4ecff;
      font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Menlo, monospace;
      font-size: 0.76rem;
      line-height: 1.5;
      white-space: pre;
    }

    @media (min-width: 900px) {
      .grid {
        grid-template-columns: 0.9fr 1.1fr;
      }
    }
  `;

  static properties = {
    count: { state: true },
    doubled: { state: true },
  };

  vm = new CounterViewModel();
  unsubscribeCount = () => {};
  unsubscribeDoubled = () => {};

  constructor() {
    super();
    this.count = this.vm.count.get();
    this.doubled = this.vm.doubled.get();
  }

  connectedCallback() {
    super.connectedCallback();

    const sync = () => {
      this.count = this.vm.count.get();
      this.doubled = this.vm.doubled.get();
    };

    sync();
    this.unsubscribeCount = this.vm.count.subscribe(sync);
    this.unsubscribeDoubled = this.vm.doubled.subscribe(sync);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeCount();
    this.unsubscribeDoubled();
    this.vm.dispose();
  }

  render() {
    return html`
      <main class="starter-root">
        <section class="hero">
          <p class="kicker">Web Loom starter (Lit + JavaScript)</p>
          <h1>MVVM Starter Kit</h1>
          <p class="lead">Signals-powered ViewModel state rendered through a Web Component shell.</p>
          <div class="stack" role="list" aria-label="Starter technologies">
            ${STACK.map((item) => html`<span role="listitem" class="chip">${item}</span> `)}
          </div>
        </section>

        <section class="grid">
          <article class="card counter-card">
            <h2>Live Counter Demo</h2>
            <p class="meta">CounterViewModel + LitElement subscriptions</p>
            <div class="metrics">
              <div><span>Count</span><strong>${this.count}</strong></div>
              <div><span>Doubled</span><strong>${this.doubled}</strong></div>
            </div>
            <div class="controls">
              <button @click=${() => this.vm.decrement()}>-</button>
              <button @click=${() => this.vm.reset()}>Reset</button>
              <button @click=${() => this.vm.increment()}>+</button>
            </div>
          </article>

          <article class="card code-card">
            <h2>MVVM Wiring</h2>
            <p class="meta">Generated starter files in src/</p>
            <h3>src/viewmodels/CounterViewModel.ts</h3>
            <pre><code>${vmSnippet}</code></pre>
          </article>
        </section>
      </main>
    `;
  }
}

customElements.define('my-element', MyElement);
