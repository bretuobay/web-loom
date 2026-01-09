import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { Subscription } from 'rxjs';

@customElement('greenhouse-card')
export class GreenhouseCard extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state() private greenhouses: GreenhouseData[] = [];
  private subscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.subscription = greenHouseViewModel.data$.subscribe((data: any) => {
      this.greenhouses = data;
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
          <a href="/greenhouses" class="card-title-link">Greenhouses</a>
        </h3>
        <p class="card-content">Total: ${this.greenhouses.length}</p>
      </div>
    `;
  }
}
