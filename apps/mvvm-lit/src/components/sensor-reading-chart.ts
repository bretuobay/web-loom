import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

let chartInstance: Chart | null = null;

export function renderSensorReadingsChart(sensorReadings: SensorReadingListData) {
  const canvasElement = document.getElementById('sensorReadingsChart') as HTMLCanvasElement | null;
  if (!canvasElement) {
    return;
  }

  const ctx = canvasElement.getContext('2d');
  if (!ctx) {
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
  }

  const chartData = {
    labels: sensorReadings.map((reading) => new Date(reading.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sensor Value',
        data: sensorReadings.map((reading) => reading.value),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}
