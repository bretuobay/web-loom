import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { thresholdAlertViewModel, type ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { Subscription } from 'rxjs';

@customElement('threshold-alert-card')
export class ThresholdAlertCard extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private thresholdAlerts: ThresholdAlertListData = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = thresholdAlertViewModel.data$.subscribe((data: any) => {
      this.thresholdAlerts = data;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  render() {
    return html`
      <div class="card">
        <h3 class="card-title">
          <a href="/threshold-alerts" class="card-title-link">Threshold Alerts</a>
        </h3>
        <p class="card-content">${this.thresholdAlerts.length}</p>
      </div>
    `;
  }
}
