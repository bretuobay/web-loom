<template>
  <div class="card">
    <router-link to="/greenhouses" class="card-header-link">
      <h3 class="card-title">Greenhouses</h3>
    </router-link>
    <p v-if="greenhouseListDataProp" class="card-content">Total: {{ greenhouseListDataProp.length }}</p>
    <p v-else class="card-content">Total: 0</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';

defineProps<{
  greenhouseListDataProp?: GreenhouseListData | null;
}>();
</script>

<style scoped></style>
