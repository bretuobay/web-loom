<template>
  <router-link to="/">
    <div class="back-arrow" aria-label="Back to Dashboard"><BackArrow /></div>
  </router-link>
  <div class="card">
    <h4 class="card-title">Sensors {{ greenhouseId ? 'for Greenhouse ' + greenhouseId : 'List' }}</h4>
    <div v-if="isLoading">
      <p class="content">Loading sensors...</p>
    </div>
    <div v-else-if="filteredSensors && filteredSensors.length > 0">
      <ul class="card-content list">
        <li v-for="sensor in filteredSensors" :key="sensor.id" class="list-item">
          Sensor Type: {{ sensor.type }}
          <span v-if="sensor.greenhouse"> | Greenhouse: {{ sensor.greenhouse.name }}</span>
          <span v-if="sensor.greenhouse.name"> | Name: {{ sensor.greenhouse.name }}</span>
          (Status: {{ sensor.status || 'N/A' }})
        </li>
      </ul>
    </div>
    <div v-else>
      <p>No sensors found {{ greenhouseId ? 'for this greenhouse' : '' }}.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, defineProps, watch, computed } from 'vue';
import { sensorViewModel as importedSensorVMInstance } from '@repo/view-models/SensorViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';

const props = defineProps<{
  greenhouseId?: string;
}>();

const isLoading = useObservable(importedSensorVMInstance.isLoading$, true);
const allSensors = useObservable(importedSensorVMInstance.data$, []);

const filteredSensors = computed(() => {
  if (!allSensors.value) return [];
  if (props.greenhouseId) {
    return allSensors.value.filter(
      (sensor: any) =>
        sensor.greenhouseId === props.greenhouseId ||
        (sensor.greenhouse && sensor.greenhouse.id === props.greenhouseId),
    );
  }
  return allSensors.value;
});

onMounted(() => {
  importedSensorVMInstance.fetchCommand.execute();
});

watch(
  () => props.greenhouseId,
  () => {},
);
</script>

<style scoped></style>
