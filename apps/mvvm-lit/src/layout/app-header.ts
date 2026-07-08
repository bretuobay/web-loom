import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { observe } from '@web-loom/signals-core';
import { navigationViewModel, type NavigationListData } from '@repo/shared/view-models/NavigationViewModel';

@customElement('app-header')
export class AppHeader extends LitElement {
  createRenderRoot() {
    return this;
  }

  @state()
  private navigationItems: NavigationListData[] = [];

  private unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to navigation items
    this.unsubscribe = observe(navigationViewModel.navigationList.items$, (items) => {
      this.navigationItems = items;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private handleNavigation(path: string) {
    // Use Lit Router's navigation
    const event = new CustomEvent('navigate', {
      detail: { path },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <header class="header">
        <a
          href="/dashboard"
          class="header-item"
          @click=${(e: Event) => {
            e.preventDefault();
            this.handleNavigation('/dashboard');
          }}
        >
          Dashboard
        </a>
        <nav class="flex-container">
          ${this.navigationItems.map(
            (item) => html`
              <a
                href="/${item.id}"
                class="header-item"
                @click=${(e: Event) => {
                  e.preventDefault();
                  this.handleNavigation(`/${item.id}`);
                }}
              >
                ${item.label}
              </a>
            `,
          )}
        </nav>
      </header>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}
