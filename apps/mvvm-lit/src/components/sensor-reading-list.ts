import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorReadingViewModel, type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Subscription } from 'rxjs';

@customElement('sensor-reading-list')
export class SensorReadingList extends LitElement {
  @state() private sensorReadings: SensorReadingListData = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = sensorReadingViewModel.data$.subscribe((data: any) => {
      this.sensorReadings = data;
    });
    sensorReadingViewModel.fetchCommand.execute();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  render() {
    return html`
      <a href="/" class="back-button">
        <img src="/back-arrow.svg" alt="Back to dashboard" style="width: 36px; height: 36px" />
      </a>
      <div class="card">
        <h1 class="card-title">Sensor Readings</h1>
        ${this.sensorReadings && this.sensorReadings.length > 0
          ? html`
              <ul class="card-content list">
                ${this.sensorReadings.map(
                  (reading: any) =>
                    html`<li class="list-item">
                      Reading ID: ${reading.id}, Sensor ID: ${reading.sensorId}, Timestamp:
                      ${new Date(reading.timestamp).toLocaleString()}, Value: ${reading.value}
                    </li>`,
                )}
              </ul>
            `
          : html`<p>No sensor readings found or still loading...</p>`}
      </div>
    `;
  }
}
