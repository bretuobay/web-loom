<template>
  <div class="dashboard-container">
    <h2>Dashboard</h2>

    <div v-if="isLoading" class="loading-message">
      <p>Loading dashboard data...</p>
    </div>

    <div v-if="!isLoading" class="flex-container">
      <div className="flex-item">
        <GreenhouseCard :greenhouseListDataProp="greenHouses" />
      </div>
      <div className="flex-item">
        <SensorCard :sensorListDataProp="sensors" />
      </div>
      <div className="flex-item">
        <ThresholdAlertCard :thresholdAlertsProp="thresholdAlerts" />
      </div>
      <div className="flex-item">
        <SensorReadingCard :sensorReadingsProp="sensorReadings" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useObservable } from '../hooks/useObservable';

import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';

import GreenhouseCard from './GreenhouseCard.vue';
import SensorCard from './SensorCard.vue';
import SensorReadingCard from './SensorReadingCard.vue';
import ThresholdAlertCard from './ThresholdAlertCard.vue';

const greenHouses = useObservable(greenHouseViewModel.data$, []);
const isLoadingGreenHouses = useObservable(greenHouseViewModel.isLoading$, true);

const sensors = useObservable(sensorViewModel.data$, []);
const isLoadingSensors = useObservable(sensorViewModel.isLoading$, true);

const sensorReadings = useObservable(sensorReadingViewModel.data$, []);
const isLoadingSensorReadings = useObservable(sensorReadingViewModel.isLoading$, true);

const thresholdAlerts = useObservable(thresholdAlertViewModel.data$, []);
const isLoadingThresholdAlerts = useObservable(thresholdAlertViewModel.isLoading$, true);

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
