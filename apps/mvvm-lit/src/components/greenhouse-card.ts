import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { observe } from '@web-loom/signals-core';

@customElement('greenhouse-card')
export class GreenhouseCard extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private greenhouses: GreenhouseData[] = [];
  private unsubscribe: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = observe(greenHouseViewModel.data$, (data: any) => {
      this.greenhouses = data;
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
          <a href="/greenhouses" class="card-title-link">Greenhouses</a>
        </h3>
        <p class="card-content">Total: ${this.greenhouses.length}</p>
      </div>
    `;
  }
}
