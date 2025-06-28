<template>
  <router-link to="/">
    <div class="back-arrow" aria-label="Back to Dashboard"><BackArrow /></div>
  </router-link>
  <div class="card">
    <h3 class="card-title">Active Threshold Alerts</h3>
    <div v-if="isLoading">
      <p>Loading alerts...</p>
    </div>
    <ul v-else-if="alertsData && alertsData.length > 0" class="card-content list">
      <li v-for="alert in alertsData" :key="alert.id" class="list-item">
        Alert ID: {{ alert.id }} | Sensor Type: {{ alert.sensorType || 'N/A' }} | Threshold: Max
        {{ alert.maxValue ?? 'N/A' }}, Min
        {{ alert.minValue ?? 'N/A' }}
      </li>
    </ul>
    <div v-else>
      <p>No active threshold alerts.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useObservable } from '../hooks/useObservable';
import BackArrow from '../assets/back-arrow.svg';

const isLoading = useObservable(thresholdAlertViewModel.isLoading$, true);
const alertsData = useObservable(thresholdAlertViewModel.data$, []);

onMounted(() => {
  thresholdAlertViewModel.fetchCommand.execute();
});
</script>

<style scoped></style>
