<template>
  <div class="dashboard-container">
    <h2>Dashboard</h2>

    <div
      v-if="isLoading"
      class="loading-message"
    >
      <p>Loading dashboard data...</p>
    </div>

    <div
      v-if="!isLoading"
      class="flex-container"
    >
      <div className="flex-item">
        <GreenhouseCard :greenhouse-list-data-prop="greenHouses" />
      </div>
      <div className="flex-item">
        <SensorCard :sensor-list-data-prop="sensors" />
      </div>
      <div className="flex-item">
        <ThresholdAlertCard :threshold-alerts-prop="thresholdAlerts" />
      </div>
      <div className="flex-item">
        <SensorReadingCard :sensor-readings-prop="sensorReadings" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useSignal } from '../hooks/useSignal';

import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

import GreenhouseCard from './GreenhouseCard.vue';
import SensorCard from './SensorCard.vue';
import SensorReadingCard from './SensorReadingCard.vue';
import ThresholdAlertCard from './ThresholdAlertCard.vue';

const greenHouses = useSignal(greenHouseViewModel.data$);
const isLoadingGreenHouses = useSignal(greenHouseViewModel.isLoading$);

const sensors = useSignal(sensorViewModel.data$);
const isLoadingSensors = useSignal(sensorViewModel.isLoading$);

const sensorReadings = useSignal(sensorReadingViewModel.data$);
const isLoadingSensorReadings = useSignal(sensorReadingViewModel.isLoading$);

const thresholdAlerts = useSignal(thresholdAlertViewModel.data$);
const isLoadingThresholdAlerts = useSignal(thresholdAlertViewModel.isLoading$);

const isLoading = computed(
  () =>
    isLoadingGreenHouses.value ||
    isLoadingSensors.value ||
    isLoadingSensorReadings.value ||
    isLoadingThresholdAlerts.value,
);

onMounted(async () => {
  try {
    await greenHouseViewModel.fetchCommand.execute();
    await sensorViewModel.fetchCommand.execute();
    await sensorReadingViewModel.fetchCommand.execute();
    await thresholdAlertViewModel.fetchCommand.execute();
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
});
</script>

<style scoped></style>
