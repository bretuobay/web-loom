import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorReadingViewModel, type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Subscription } from 'rxjs';

@customElement('sensor-reading-card')
export class SensorReadingCard extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private sensorReadings: SensorReadingListData = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = sensorReadingViewModel.data$.subscribe((data: any) => {
      this.sensorReadings = data;
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
          <a href="/sensor-readings" class="card-title-link">Sensor Readings</a>
        </h3>
        <p class="card-content">Total: ${this.sensorReadings.length}</p>
      </div>
    `;
  }
}
