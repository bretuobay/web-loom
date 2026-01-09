import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-container')
export class AppContainer extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <main class="flex-container flex-column flex-app">
        <slot></slot>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-container': AppContainer;
  }
}
