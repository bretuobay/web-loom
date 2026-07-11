import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorReadingViewModel, type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { observe } from '@web-loom/signals-core';

@customElement('sensor-reading-list')
export class SensorReadingList extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private sensorReadings: SensorReadingListData = [];
  private unsubscribe: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = observe(sensorReadingViewModel.data$, (data: any) => {
      this.sensorReadings = data;
    });
    sensorReadingViewModel.fetchCommand.execute();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    return html`
      <a href="/" class="back-button">
        <img src="/back-arrow.svg" alt="Back to dashboard" class="back-arrow" />
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
