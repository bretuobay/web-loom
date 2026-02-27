import { css, html, LitElement } from 'lit';
import { CounterViewModel } from './viewmodels/CounterViewModel';

export class MyElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      margin: 2rem auto;
      max-width: 680px;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
    }
  `;

  static properties = {
    count: { state: true },
    doubled: { state: true },
  };

  vm = new CounterViewModel();
  unsubscribeCount = () => {};
  unsubscribeDoubled = () => {};
  count = this.vm.count.get();
  doubled = this.vm.doubled.get();

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
      <p>Web Loom starter (Lit + JavaScript)</p>
      <h1>Counter MVVM</h1>
      <p>Count: <strong>${this.count}</strong></p>
      <p>Doubled: <strong>${this.doubled}</strong></p>
      <div class="controls">
        <button @click=${() => this.vm.decrement()}>-</button>
        <button @click=${() => this.vm.reset()}>Reset</button>
        <button @click=${() => this.vm.increment()}>+</button>
      </div>
    `;
  }
}

customElements.define('my-element', MyElement);
