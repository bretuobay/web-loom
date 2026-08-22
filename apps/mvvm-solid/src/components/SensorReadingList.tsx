import { For, Show, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';
import { useSignal } from '../hooks/useSignal';
import BackArrow from '../assets/back-arrow.svg';

export function SensorReadingList() {
  const readingList = useSignal(sensorReadingViewModel.data$);

  onMount(() => {
    void sensorReadingViewModel.fetchCommand.execute();
  });

  return (
    <>
      <A href="/" class="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </A>
      <div class="card">
        <h1 class="card-title">Sensor Readings</h1>
        <Show
          when={readingList() && readingList()!.length > 0}
          fallback={<p>No sensor readings found or still loading...</p>}
        >
          <ul class="card-content list">
            <For each={readingList() ?? []}>
              {(reading) => (
                <li class="list-item">
                  Reading ID: {reading.sensorId}, Sensor ID: {reading.sensorId}, Timestamp:{' '}
                  {new Date(reading.timestamp).toLocaleString()}, Value: {reading.value}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </>
  );
}
