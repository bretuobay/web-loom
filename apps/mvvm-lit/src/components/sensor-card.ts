import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorViewModel, type SensorListData } from '@repo/view-models/SensorViewModel';
import { Subscription } from 'rxjs';

@customElement('sensor-card')
export class SensorCard extends LitElement {
  @state() private sensors: SensorListData = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = sensorViewModel.data$.subscribe((data: any) => {
      this.sensors = data;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.subscription?.unsubscribe();
  }

  render() {
    return html`
      <div class="card">
        <h3 class="card-title">Sensors</h3>
        <p class="card-content">${this.sensors.length}</p>
        <a href="/sensors" class="card-link">View Sensors</a>
      </div>
    `;
  }
}
