import { createEffect, onCleanup } from 'solid-js';
import { A } from '@solidjs/router';
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
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface SensorReadingCardProps {
  sensorReadings: SensorReadingListData;
}

export default function SensorReadingCard(props: SensorReadingCardProps) {
  let canvasRef: HTMLCanvasElement | undefined;

  createEffect(() => {
    const readings = props.sensorReadings;
    const canvas = canvasRef;
    if (!canvas) {
      return;
    }

    if (readings.length === 0) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: readings.map((reading) => new Date(reading.timestamp).toLocaleTimeString()),
        datasets: [
          {
            label: 'Sensor Value',
            data: readings.map((reading) => reading.value),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time',
            },
          },
          y: {
            title: {
              display: true,
              text: 'Value',
            },
          },
        },
      },
    });

    onCleanup(() => {
      chart.destroy();
    });
  });

  return (
    <div class="card">
      <A href="/sensor-readings" class="card-header-link">
        <h3 class="card-title">Sensor Readings</h3>
      </A>
      <div class="card-content">
        <canvas ref={(el) => (canvasRef = el)} />
      </div>
      <p class="card-content">Total Readings: {props.sensorReadings.length}</p>
    </div>
  );
}
