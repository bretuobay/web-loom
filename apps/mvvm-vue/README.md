# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

# MVVM in Vue

This project applies the MVVM (Model-View-ViewModel) pattern in Vue 3. Components interact with ViewModels that expose observable streams and commands for data management. The GreenhouseList component is a practical example of MVVM in action.

## How MVVM is Applied: Real Example from GreenhouseList

### ViewModel Usage

ViewModels encapsulate data-fetching and mutation logic, exposing observable streams and commands for the component to consume. For example:

```typescript
// Provided via import in the component
export const greenHouseViewModel = {
  data$: greenHouseDataObservable, // Observable stream of greenhouse data
  isLoading$: isLoadingObservable, // Observable stream for loading state
  fetchCommand: {
    execute: async () => {
      /* fetches greenhouse data */
    },
  },
  createCommand: {
    execute: async (data) => {
      /* creates a greenhouse */
    },
  },
  updateCommand: {
    execute: async ({ id, payload }) => {
      /* updates a greenhouse */
    },
  },
  deleteCommand: {
    execute: async (id) => {
      /* deletes a greenhouse */
    },
  },
};
```

### View: GreenhouseList Component

The component subscribes to the observable data and triggers data fetching and mutations via ViewModel commands:

```vue
<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { useObservable } from '../hooks/useObservable';

const isLoading = useObservable(greenHouseViewModel.isLoading$, true);
const greenhouses = useObservable(greenHouseViewModel.data$, []);

const initialFormData = { name: '', location: '', size: '', cropType: '' };
const formData = reactive({ ...initialFormData });
const editingGreenhouseId = ref<string | null | undefined>(null);

onMounted(() => {
  greenHouseViewModel.fetchCommand.execute();
});

const handleSubmit = (event: Event) => {
  // ...calls createCommand or updateCommand...
};
const handleDelete = (id?: string) => {
  greenHouseViewModel.deleteCommand.execute(id);
};
const handleUpdate = (id?: string) => {
  // ...sets form fields for editing...
};
</script>
```

### Template Example

The template uses Vue's reactivity and event handling to bind to observable data and trigger ViewModel commands:

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <!-- form fields bound to formData -->
    <button type="submit">Submit</button>
  </form>
  <div v-if="isLoading">Loading greenhouses...</div>
  <ul v-else>
    <li v-for="gh in greenhouses" :key="gh.id">
      <span>{{ gh.name }}</span>
      <button @click="handleDelete(gh.id)">Delete</button>
      <button @click="handleUpdate(gh.id)">Edit</button>
    </li>
  </ul>
  <div v-if="!greenhouses.length">No greenhouses found.</div>
</template>
```

### MVVM Mapping

- **Model:** Data sources and business logic (e.g., greenhouse models)
- **ViewModel:** Observable streams and commands (e.g., `data$`, `isLoading$`, `fetchCommand`, `createCommand`, `updateCommand`, `deleteCommand`)
- **View:** Vue components and templates subscribe to ViewModel observables and render UI, triggering commands for CRUD operations

This approach keeps data logic out of the UI components and enables reactive updates when data changes.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
