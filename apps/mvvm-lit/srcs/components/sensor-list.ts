import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorViewModel, SensorListData } from '@repo/view-models/SensorViewModel';
import { Subscription } from 'rxjs';

@customElement('sensor-list')
export class SensorList extends LitElement {
  @state() private sensors: SensorListData = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = sensorViewModel.data$.subscribe(data => {
      this.sensors = data;
    });
    sensorViewModel.fetchCommand.execute();
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
        <h1 class="card-title">Sensors</h1>
        ${this.sensors && this.sensors.length > 0
          ? html`
              <ul class="card-content list">
                ${this.sensors.map(
                  (sensor) =>
                    html`<li class="list-item">${sensor.greenhouse.name} ${sensor.type} (Status: ${sensor.status})</li>`,
                )}
              </ul>
            `
          : html`<p>No sensors found or still loading...</p>`}
      </div>
    `;
  }
}
