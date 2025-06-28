<template>
  <div class="card">
    <router-link to="/sensors" class="card-header-link">
      <h3 class="card-title">Sensors</h3>
    </router-link>
    <p v-if="sensorListDataProp" class="card-content">Total: {{ sensorListDataProp.length }}</p>
    <p v-else class="card-content">Total: 0</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { SensorListData } from '@repo/view-models/SensorViewModel';
defineProps<{
  sensorListDataProp?: SensorListData | null;
}>();
</script>

<style scoped></style>
