import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorViewModel, type SensorListData } from '@repo/view-models/SensorViewModel';
import { observe } from '@web-loom/signals-core';

@customElement('sensor-list')
export class SensorList extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private sensors: SensorListData = [];
  private unsubscribe: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = observe(sensorViewModel.data$, (data: any) => {
      this.sensors = data;
    });
    sensorViewModel.fetchCommand.execute();
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
        <h1 class="card-title">Sensors</h1>
        ${this.sensors && this.sensors.length > 0
          ? html`
              <ul class="card-content list">
                ${this.sensors.map(
                  (sensor: any) =>
                    html`<li class="list-item">
                      ${sensor.greenhouse.name} ${sensor.type} (Status: ${sensor.status})
                    </li>`,
                )}
              </ul>
            `
          : html`<p>No sensors found or still loading...</p>`}
      </div>
    `;
  }
}
