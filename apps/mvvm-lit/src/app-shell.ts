import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import './components/dashboard-view';
import './components/greenhouse-list';
import './components/sensor-list';
import './components/sensor-reading-list';
import './components/threshold-alert-list';
import './layout/app-container';
import './layout/app-header';
import './layout/app-footer';

@customElement('app-shell')
export class AppShell extends LitElement {
  createRenderRoot() {
    return this;
  }

  private router = new Router(this, [
    { path: '/', render: () => html`<dashboard-view></dashboard-view>` },
    { path: '/dashboard', render: () => html`<dashboard-view></dashboard-view>` },
    { path: '/greenhouses', render: () => html`<greenhouse-list></greenhouse-list>` },
    { path: '/sensors', render: () => html`<sensor-list></sensor-list>` },
    { path: '/sensor-readings', render: () => html`<sensor-reading-list></sensor-reading-list>` },
    { path: '/threshold-alerts', render: () => html`<threshold-alert-list></threshold-alert-list>` },
  ]);

  connectedCallback() {
    super.connectedCallback();
    // Listen for navigation events from header
    this.addEventListener('navigate', this.handleNavigation as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('navigate', this.handleNavigation as EventListener);
  }

  private handleNavigation = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { path } = customEvent.detail;
    this.router.goto(path);
  };

  render() {
    return html`
      <app-header></app-header>
      <div class="content">
        <app-container> ${this.router.outlet()} </app-container>
      </div>
      <app-footer></app-footer>
    `;
  }
}
