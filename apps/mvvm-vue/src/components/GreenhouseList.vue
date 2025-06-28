<template>
  <router-link to="/" class="back-button">
    <BackArrow class="back-arrow" />
  </router-link>
  <section class="flex-container flex-row">
    <form class="form-container" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Greenhouse Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          v-model="formData.name"
          required
          class="input-field"
          placeholder="Enter greenhouse name"
        />
      </div>

      <div class="form-group">
        <label for="location">Location:</label>
        <textarea
          id="location"
          name="location"
          v-model="formData.location"
          required
          rows="3"
          class="textarea-field"
          placeholder="Location"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="size">Size:</label>
        <select id="size" class="select-field" name="size" v-model="formData.size" required>
          <option value="">Select size</option>
          <option value="25sqm">25sqm / Small</option>
          <option value="50sqm">50sqm / Medium</option>
          <option value="100sqm">100sqm / Large</option>
        </select>
      </div>

      <div class="form-group">
        <label for="cropType">Crop Type:</label>
        <input
          type="text"
          name="cropType"
          id="cropType"
          v-model="formData.cropType"
          class="input-field"
          placeholder="Enter crop type"
        />
      </div>

      <button type="submit" class="button">Submit</button>
    </form>

    <div class="card" style="max-width: 600px">
      <h1 class="card-title">Greenhouses</h1>
      <div v-if="isLoading" class="card-content">
        <p>Loading greenhouses...</p>
      </div>
      <div v-else-if="greenhouses && greenhouses.length > 0">
        <ul class="card-content list">
          <li
            v-for="gh in greenhouses"
            :key="gh.id"
            class="list-item"
            style="font-size: 1.8rem; justify-content: space-between"
          >
            <span>{{ gh.name }}</span>
            <div class="button-group">
              <button class="button-tiny button-tiny-delete" @click="handleDelete(gh.id)">Delete</button>
              <button class="button-tiny button-tiny-edit" @click="handleUpdate(gh.id)">Edit</button>
            </div>
          </li>
        </ul>
      </div>
      <div v-else>
        <p class="card-content">No greenhouses found.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';

const isLoading = useObservable(greenHouseViewModel.isLoading$, true);
const greenhouses = useObservable(greenHouseViewModel.data$, []);

const greenHouseSizeOptions = ['25sqm', '50sqm', '100sqm'] as const;

const initialFormData = {
  name: '',
  location: '',
  size: '',
  cropType: '',
};
const formData = reactive({ ...initialFormData });
const editingGreenhouseId = ref<string | null | undefined>(null);

onMounted(() => {
  greenHouseViewModel.fetchCommand.execute();
});

const handleSubmit = (event: Event) => {
  const form = event.target as HTMLFormElement;
  const nativeFormData = new FormData(form);
  const name = nativeFormData.get('name') as string;
  const location = nativeFormData.get('location') as string;
  const size = nativeFormData.get('size') as string;
  const cropType = nativeFormData.get('cropType') as string;

  const data = { name, location, size, cropType };

  if (editingGreenhouseId.value) {
    const existingGreenhouse = greenhouses.value?.find((gh) => gh.id === editingGreenhouseId.value);
    if (existingGreenhouse) {
      greenHouseViewModel.updateCommand.execute({
        id: existingGreenhouse.id || '',
        payload: {
          ...existingGreenhouse,
          name: data.name,
          location: data.location,
          size: data.size,
          cropType: data.cropType,
        },
      });
    }
  } else {
    const existingGreenhouseByName = greenhouses.value?.find((gh) => gh.name === name);
    if (existingGreenhouseByName) {
      console.error('Greenhouse with this name already exists:', name);
      greenHouseViewModel.updateCommand.execute({
        id: existingGreenhouseByName.id || '',
        payload: {
          ...existingGreenhouseByName,
          name: data.name,
          location: data.location,
          size: data.size,
          cropType: data.cropType,
        },
      });
      return;
    }
    greenHouseViewModel.createCommand.execute(data);
  }

  // Reset form and editing state
  Object.assign(formData, initialFormData);
  editingGreenhouseId.value = null;
  // Optionally, reset the native form if not using v-model for everything (though we are)
  form.reset();
};

const handleDelete = (id?: string) => {
  if (!id) {
    console.error('No ID provided for deletion');
    return;
  }
  greenHouseViewModel.deleteCommand.execute(id);
};

const handleUpdate = (id?: string) => {
  const greenhouse = greenhouses.value?.find((gh) => gh.id === id);
  if (!greenhouse) {
    console.error('Greenhouse not found for update:', id);
    return;
  }
  formData.name = greenhouse.name;
  formData.location = greenhouse.location;

  if (!greenHouseSizeOptions.includes(greenhouse.size as (typeof greenHouseSizeOptions)[number])) {
    console.error('Invalid greenhouse size:', greenhouse.size);
    formData.size = '100sqm'; // Default to '100sqm' if invalid
  } else {
    formData.size = greenhouse.size;
  }
  formData.cropType = greenhouse.cropType || '';
  editingGreenhouseId.value = greenhouse.id;
};
</script>
<style scoped></style>
