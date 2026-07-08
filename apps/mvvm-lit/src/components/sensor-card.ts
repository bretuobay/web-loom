import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sensorViewModel, type SensorListData } from '@repo/view-models/SensorViewModel';
import { observe } from '@web-loom/signals-core';

@customElement('sensor-card')
export class SensorCard extends LitElement {
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    return html`
      <div class="card">
        <h3 class="card-title">
          <a href="/sensors" class="card-title-link">Sensors</a>
        </h3>
        <p class="card-content">Total: ${this.sensors.length}</p>
      </div>
    `;
  }
}
