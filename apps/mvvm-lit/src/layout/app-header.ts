import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { navigationViewModel, type NavigationListData } from '@repo/shared/view-models/NavigationViewModel';

@customElement('app-header')
export class AppHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .header {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .header-item {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .flex-container {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .brand {
      font-size: 1.25rem;
      font-weight: bold;
    }

    .icon {
      font-size: 1rem;
    }
  `;

  @state()
  private navigationItems: NavigationListData[] = [];

  private subscription?: any;

  connectedCallback() {
    super.connectedCallback();
    // Subscribe to navigation items
    this.subscription = navigationViewModel.navigationList.items$.subscribe((items) => {
      this.navigationItems = items;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
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
          href="#"
          class="header-item brand"
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
                href="#"
                class="header-item"
                @click=${(e: Event) => {
                  e.preventDefault();
                  this.handleNavigation(`/${item.id}`);
                }}
              >
                <i class="icon icon-${item.icon}"></i>
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
