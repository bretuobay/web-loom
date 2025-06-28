<template>
  <div class="card">
    <router-link to="/sensor-readings" class="card-header-link">
      <h5 class="card-title">Sensor Readings</h5>
    </router-link>
    <div v-if="readings && readings.length > 0">
      <div>
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div>
        <p class="card-content">Total Readings: {{ readings.length }}</p>
      </div>
    </div>
    <div v-else-if="isLoadingReadings">
      <p class="card-content">Loading readings...</p>
    </div>
    <div v-else>
      <p>No readings available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, ref, watch } from 'vue';
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{
  sensorReadingsProp?: SensorReadingListData | null;
}>();

const readings = computed(() => props.sensorReadingsProp || []);
const isLoadingReadings = ref(false);

const chartData = computed(() => {
  if (!readings.value || readings.value.length === 0) {
    return { labels: [], datasets: [] };
  }
  type ReadingItem = (typeof readings.value)[0];

  return {
    labels: readings.value.map((r: ReadingItem) => new Date(r.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: `Sensor Readings`,
        borderColor: 'rgb(75, 192, 192)',
        data: readings.value.map((r: ReadingItem) => r.value),
        fill: false,
        tension: 0.1,
      },
    ],
  };
});

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      title: { display: true, text: 'Time' },
      ticks: { autoSkip: true, maxTicksLimit: 10 },
    },
    y: {
      title: { display: true, text: 'Value' },
      beginAtZero: false,
    },
  },
  plugins: {
    legend: { display: true },
    tooltip: { enabled: true },
  },
});

watch(
  () => props.sensorReadingsProp,
  () => {},
  { immediate: true, deep: true },
);
</script>

<style scoped></style>
