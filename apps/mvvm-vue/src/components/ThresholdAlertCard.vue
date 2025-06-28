<template>
  <div class="card">
    <router-link to="/threshold-alerts" class="card-header-link">
      <h3 class="card-title">Alerts</h3>
    </router-link>
    <p v-if="thresholdAlertsProp" class="card-content">Total Alerts: {{ thresholdAlertsProp.length }}</p>
    <p v-else class="card-content">Total Alerts: 0</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { ThresholdAlertListData } from '@repo/view-models/ThresholdAlertViewModel';

defineProps<{
  thresholdAlertsProp?: ThresholdAlertListData | null;
}>();
</script>

<style scoped></style>
