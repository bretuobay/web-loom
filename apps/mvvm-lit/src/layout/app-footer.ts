import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-footer')
export class AppFooter extends LitElement {
  createRenderRoot() {
    return this;
  }

  private get currentYear(): number {
    return new Date().getFullYear();
  }

  render() {
    return html`
      <footer class="footer">
        <p>&copy; ${this.currentYear} Dashboard Demo. All rights reserved.</p>
      </footer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-footer': AppFooter;
  }
}
