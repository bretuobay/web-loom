import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import './components/dashboard-view';
import './components/greenhouse-list';
import './components/sensor-list';
import './components/sensor-reading-list';
import './components/threshold-alert-list';

@customElement('app-shell')
export class AppShell extends LitElement {
  private router = new Router(this, [
    { path: '/', render: () => html`<dashboard-view></dashboard-view>` },
    { path: '/dashboard', render: () => html`<dashboard-view></dashboard-view>` },
    { path: '/greenhouses', render: () => html`<greenhouse-list></greenhouse-list>` },
    { path: '/sensors', render: () => html`<sensor-list></sensor-list>` },
    { path: '/sensor-readings', render: () => html`<sensor-reading-list></sensor-reading-list>` },
    { path: '/threshold-alerts', render: () => html`<threshold-alert-list></threshold-alert-list>` },
  ]);

  render() {
    return this.router.outlet();
  }
}
