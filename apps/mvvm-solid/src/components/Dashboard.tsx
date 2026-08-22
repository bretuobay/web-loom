import { Show, createMemo, onMount } from 'solid-js';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useSignal } from '../hooks/useSignal';
import GreenhouseCard from './GreenhouseCard';
import SensorCard from './SensorCard';
import SensorReadingCard from './SensorReadingCard';
import ThresholdAlertCard from './ThresholdAlertCard';

export default function Dashboard() {
  const greenHouses = useSignal(greenHouseViewModel.data$);
  const isLoadingGreenHouses = useSignal(greenHouseViewModel.isLoading$);

  const sensors = useSignal(sensorViewModel.data$);
  const isLoadingSensors = useSignal(sensorViewModel.isLoading$);

  const sensorReadings = useSignal(sensorReadingViewModel.data$);
  const isLoadingSensorReadings = useSignal(sensorReadingViewModel.isLoading$);

  const thresholdAlerts = useSignal(thresholdAlertViewModel.data$);
  const isLoadingThresholdAlerts = useSignal(thresholdAlertViewModel.isLoading$);

  const isLoading = createMemo(
    () => isLoadingGreenHouses() || isLoadingSensors() || isLoadingSensorReadings() || isLoadingThresholdAlerts(),
  );

  onMount(() => {
    void Promise.all([
      greenHouseViewModel.fetchCommand.execute(),
      sensorViewModel.fetchCommand.execute(),
      sensorReadingViewModel.fetchCommand.execute(),
      thresholdAlertViewModel.fetchCommand.execute(),
    ]).catch((error) => {
      console.error('Error fetching data:', error);
    });
  });

  return (
    <div class="dashboard-container">
      <Show when={isLoading()}>
        <p>Loading dashboard data...</p>
      </Show>
      <Show when={!isLoading()}>
        <h2>Dashboard</h2>
        <div class="flex-container">
          <div class="flex-item">
            <GreenhouseCard greenHouses={greenHouses()} />
          </div>
          <div class="flex-item">
            <SensorCard sensors={sensors()} />
          </div>
          <div class="flex-item">
            <ThresholdAlertCard thresholdAlerts={thresholdAlerts() ?? []} />
          </div>
          <div class="flex-item">
            <SensorReadingCard sensorReadings={sensorReadings() ?? []} />
          </div>
        </div>
      </Show>
    </div>
  );
}
