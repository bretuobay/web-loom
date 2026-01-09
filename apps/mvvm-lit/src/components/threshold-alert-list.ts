import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { thresholdAlertViewModel, type ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';
import { Subscription } from 'rxjs';

@customElement('threshold-alert-list')
export class ThresholdAlertList extends LitElement {
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
    thresholdAlertViewModel.fetchCommand.execute();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  render() {
    return html`
      <a href="/" class="back-button">
        <img src="/back-arrow.svg" alt="Back to dashboard" class="back-arrow" />
      </a>
      <div class="card">
        <h1 class="card-title">Threshold Alerts</h1>
        ${this.thresholdAlerts && this.thresholdAlerts.length > 0
          ? html`
              <ul class="card-content list">
                ${this.thresholdAlerts.map(
                  (alert: any) =>
                    html`<li class="list-item">
                      Alert ID: ${alert.id}, Sensor ID: ${alert.sensorType}, Message: Max: ${alert.maxValue}, Min:
                      ${alert.minValue}
                    </li>`,
                )}
              </ul>
            `
          : html`<p>No threshold alerts found or still loading...</p>`}
      </div>
    `;
  }
}
