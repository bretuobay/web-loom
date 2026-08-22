import { For, Show, createSignal, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useSignal } from '../hooks/useSignal';
import BackArrow from '../assets/back-arrow.svg';

const greenHouseSizeOptions = ['25sqm', '50sqm', '100sqm'] as const;

const emptyForm = {
  name: '',
  location: '',
  size: '',
  cropType: '',
};

export function GreenhouseList() {
  const greenHouses = useSignal(greenHouseViewModel.data$);
  const isLoading = useSignal(greenHouseViewModel.isLoading$);

  const [name, setName] = createSignal(emptyForm.name);
  const [location, setLocation] = createSignal(emptyForm.location);
  const [size, setSize] = createSignal(emptyForm.size);
  const [cropType, setCropType] = createSignal(emptyForm.cropType);
  const [editingId, setEditingId] = createSignal<string | null>(null);

  onMount(() => {
    void greenHouseViewModel.fetchCommand.execute().catch((error) => {
      console.error('Error fetching greenhouses:', error);
    });
  });

  const resetForm = () => {
    setName(emptyForm.name);
    setLocation(emptyForm.location);
    setSize(emptyForm.size);
    setCropType(emptyForm.cropType);
    setEditingId(null);
  };

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = {
      name: name(),
      location: location(),
      size: size(),
      cropType: cropType(),
    };

    const currentId = editingId();
    if (currentId) {
      const existingGreenhouse = greenHouses()?.find((gh) => gh.id === currentId);
      if (existingGreenhouse) {
        greenHouseViewModel.updateCommand.execute({
          id: existingGreenhouse.id || '',
          payload: {
            ...existingGreenhouse,
            ...data,
          },
        });
      }
      resetForm();
      return;
    }

    const existingGreenhouse = greenHouses()?.find((gh) => gh.name === data.name);
    if (existingGreenhouse) {
      console.error('Greenhouse with this name already exists:', data.name);
      greenHouseViewModel.updateCommand.execute({
        id: existingGreenhouse.id || '',
        payload: {
          ...existingGreenhouse,
          ...data,
        },
      });
      resetForm();
      return;
    }

    greenHouseViewModel.createCommand.execute(data);
    resetForm();
  };

  const handleDelete = (id?: string) => {
    if (!id) {
      console.error('No ID provided for deletion');
      return;
    }
    greenHouseViewModel.deleteCommand.execute(id);
  };

  const handleUpdate = (id?: string) => {
    const greenhouse = greenHouses()?.find((gh) => gh.id === id);
    if (!greenhouse) {
      console.error('Greenhouse not found for update:', id);
      return;
    }
    setName(greenhouse.name);
    setLocation(greenhouse.location);
    setSize(
      greenHouseSizeOptions.includes(greenhouse.size as (typeof greenHouseSizeOptions)[number])
        ? greenhouse.size
        : '100sqm',
    );
    setCropType(greenhouse.cropType || '');
    setEditingId(greenhouse.id ?? null);
  };

  return (
    <>
      <A href="/" class="back-button">
        <img src={BackArrow} alt="Back to dashboard" class="back-arrow" />
      </A>
      <section class="flex-container flex-row">
        <form class="form-container" onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="name">Greenhouse Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              class="input-field"
              placeholder="Enter greenhouse name"
              value={name()}
              onInput={(event) => setName(event.currentTarget.value)}
            />
          </div>

          <div class="form-group">
            <label for="location">Location:</label>
            <textarea
              id="location"
              name="location"
              required
              rows={3}
              class="textarea-field"
              placeholder="Location"
              value={location()}
              onInput={(event) => setLocation(event.currentTarget.value)}
            />
          </div>

          <div class="form-group">
            <label for="size">Size:</label>
            <select
              id="size"
              class="select-field"
              name="size"
              required
              value={size()}
              onChange={(event) => setSize(event.currentTarget.value)}
            >
              <option value="">Select size</option>
              <option value="25sqm">25sqm / Small </option>
              <option value="50sqm">50sqm / Medium </option>
              <option value="100sqm">100sqm / Large </option>
            </select>
          </div>

          <div class="form-group">
            <label for="cropType">Crop Type:</label>
            <input
              type="text"
              name="cropType"
              id="cropType"
              class="input-field"
              placeholder="Enter crop type"
              value={cropType()}
              onInput={(event) => setCropType(event.currentTarget.value)}
            />
          </div>

          <button type="submit" class="button">
            Submit
          </button>
        </form>

        <div class="card" style={{ 'max-width': '600px' }}>
          <h1 class="card-title">Greenhouses</h1>
          <Show when={isLoading()}>
            <p class="card-content">Loading greenhouses...</p>
          </Show>
          <Show when={!isLoading()}>
            <Show
              when={greenHouses() && greenHouses()!.length > 0}
              fallback={<p class="card-content">No greenhouses found.</p>}
            >
              <ul class="card-content list">
                <For each={greenHouses() ?? []}>
                  {(gh) => (
                    <li class="list-item" style={{ 'font-size': '1.8rem', 'justify-content': 'space-between' }}>
                      <span>{gh.name}</span>
                      <div class="button-group">
                        <button class="button-tiny button-tiny-delete" onClick={() => handleDelete(gh.id)}>
                          Delete
                        </button>
                        <button class="button-tiny button-tiny-edit" onClick={() => handleUpdate(gh.id)}>
                          Edit
                        </button>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Show>
        </div>
      </section>
    </>
  );
}
