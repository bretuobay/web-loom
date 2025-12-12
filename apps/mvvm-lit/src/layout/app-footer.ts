import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('app-footer')
export class AppFooter extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .footer {
      background: #34495e;
      color: white;
      padding: 1rem 2rem;
      text-align: center;
      margin-top: auto;
      border-top: 1px solid #2c3e50;
    }

    .footer p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }
  `;

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
