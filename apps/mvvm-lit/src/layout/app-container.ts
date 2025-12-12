import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-container')
export class AppContainer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .flex-container {
      display: flex;
    }

    .flex-column {
      flex-direction: column;
    }

    .flex-app {
      min-height: 100vh;
    }

    main {
      padding: 20px;
      flex: 1;
    }
  `;

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
