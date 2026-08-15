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
import type { ReadonlySignal } from '@web-loom/signals-core';
import type { SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import type { ElementAction } from '@web-loom/template-core';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

export function createSensorReadingsChartAction(
  getReadings: () => ReadonlySignal<SensorReadingListData | null>,
): (element: Element) => ElementAction | void {
  return (element: Element) => {
    if (!(element instanceof HTMLCanvasElement)) return;
    const ctx = element.getContext('2d');
    if (!ctx) return;

    let chart: Chart | null = null;
    const render = (readings: SensorReadingListData | null) => {
      if (chart) {
        chart.destroy();
        chart = null;
      }
      if (!readings || readings.length === 0) return;
      chart = new Chart(ctx, {
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
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Value' } },
          },
        },
      });
    };

    const readings$ = getReadings();
    render(readings$.peek());
    const stop = readings$.subscribe((readings) => render(readings));

    return {
      dispose() {
        stop();
        chart?.destroy();
        chart = null;
      },
    };
  };
}
