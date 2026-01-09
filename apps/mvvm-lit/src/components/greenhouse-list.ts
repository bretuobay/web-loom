import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { Subscription } from 'rxjs';

@customElement('greenhouse-list')
export class GreenhouseList extends LitElement {
  createRenderRoot() {
    return this;
  }
  @state()
  private greenhouses: GreenhouseData[] = [];

  private dataSubscription: Subscription | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.dataSubscription = greenHouseViewModel.data$.subscribe((data: any) => {
      this.greenhouses = data;
    });
    greenHouseViewModel.fetchCommand.execute();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.dataSubscription?.unsubscribe();
  }

  private handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const size = formData.get('size') as string;
    const cropType = formData.get('cropType') as string;
    const data = { name, location, size, cropType };

    const existingGreenhouse = this.greenhouses.find((gh) => gh.name === name);
    if (existingGreenhouse) {
      greenHouseViewModel.updateCommand.execute({
        id: existingGreenhouse.id || '',
        payload: {
          ...existingGreenhouse,
          ...data,
        },
      });
    } else {
      greenHouseViewModel.createCommand.execute(data);
    }
    form.reset();
  }

  private handleDelete(id?: string) {
    if (id) {
      greenHouseViewModel.deleteCommand.execute(id);
    }
  }

  private handleUpdate(id?: string) {
    const greenhouse = this.greenhouses.find((gh) => gh.id === id);
    if (greenhouse) {
      const nameInput = this.querySelector<HTMLInputElement>('#name');
      const locationInput = this.querySelector<HTMLTextAreaElement>('#location');
      const sizeSelect = this.querySelector<HTMLSelectElement>('#size');
      const cropTypeInput = this.querySelector<HTMLInputElement>('#cropType');

      if (nameInput) {
        nameInput.value = greenhouse.name;
      }
      if (locationInput) {
        locationInput.value = greenhouse.location;
      }
      if (sizeSelect) {
        sizeSelect.value = greenhouse.size;
      }
      if (cropTypeInput) {
        cropTypeInput.value = greenhouse.cropType || '';
      }
    }
  }

  render() {
    return html`
      <a href="/" class="back-button">
        <img src="/back-arrow.svg" alt="Back to dashboard" class="back-arrow" />
      </a>
      <section class="flex-container flex-row">
        <form class="form-container" @submit=${this.handleSubmit}>
          <div class="form-group">
            <label for="name">Greenhouse Name:</label>
            <input type="text" id="name" name="name" required class="input-field" placeholder="Enter greenhouse name" />
          </div>
          <div class="form-group">
            <label for="location">Location:</label>
            <textarea id="location" name="location" required rows="3" class="textarea-field" placeholder="Location"></textarea>
          </div>
          <div class="form-group">
            <label for="size">Size:</label>
            <select id="size" class="select-field" name="size" required>
              <option value="">Select size</option>
              <option value="25sqm">25sqm / Small</option>
              <option value="50sqm">50sqm / Medium</option>
              <option value="100sqm">100sqm / Large</option>
            </select>
          </div>
          <div class="form-group">
            <label for="cropType">Crop Type:</label>
            <input type="text" name="cropType" id="cropType" class="input-field" placeholder="Enter crop type" />
          </div>
          <button type="submit" class="button">Submit</button>
        </form>
        <div class="card" style="max-width: 600px;">
          <h1 class="card-title">Greenhouses</h1>
          ${this.greenhouses && this.greenhouses.length > 0
            ? html`
                  <ul class="card-content list">
                    ${this.greenhouses.map(
                      (gh) => html`
                        <li class="list-item" style="font-size: 1.8rem; justify-content: space-between;">
                          <span>${gh.name}</span>
                          <div class="button-group">
                            <button class="button-tiny button-tiny-delete" @click=${() => this.handleDelete(gh.id)}>Delete</button>
                            <button class="button-tiny button-tiny-edit" @click=${() => this.handleUpdate(gh.id)}>Edit</button>
                          </div>
                        </li>
                      `,
                    )}
                  </ul>
                `
            : html`<p>No greenhouses found or still loading...</p>`}
        </div>
      </section>
    `;
  }
}
