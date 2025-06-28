<template>
  <router-link to="/">
    <div class="back-arrow" aria-label="Back to Dashboard"><BackArrow /></div>
  </router-link>
  <div class="card">
    <h5 class="card-title">Readings {{ sensorId ? 'for Sensor ' + sensorId : 'List' }}</h5>
    <div v-if="isLoading">
      <p class="content">Loading sensor readings...</p>
    </div>
    <div v-else-if="filteredReadings && filteredReadings.length > 0">
      <ul class="card-content list">
        <li v-for="reading in filteredReadings" :key="reading.id || reading.timestamp" class="list-item">
          Sensor ID: {{ reading.sensorId }} | Timestamp: {{ new Date(reading.timestamp).toLocaleString() }} | Value:
          {{ reading.value }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p class="card-content">No readings available {{ sensorId ? 'for this sensor' : '' }}.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, onMounted, computed, watch } from 'vue';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';

const props = defineProps<{
  sensorId?: string;
  greenhouseId?: string;
}>();

const isLoading = useObservable(sensorReadingViewModel.isLoading$, true);
const allReadings = useObservable(sensorReadingViewModel.data$, []);

const filteredReadings = computed(() => {
  if (!allReadings.value) return [];
  if (props.sensorId) {
    return allReadings.value.filter((reading: any) => reading.sensorId === props.sensorId);
  }
  return allReadings.value;
});

onMounted(() => {
  sensorReadingViewModel.fetchCommand.execute();
});

watch(
  () => props.sensorId,
  (newId, oldId) => {
    if (newId !== oldId) {
    }
  },
);
</script>

<style scoped></style>
