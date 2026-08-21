import { For, Show, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { useSignal } from '../hooks/useSignal';
import BackArrow from '../assets/back-arrow.svg';

export function SensorList() {
  const sensors = useSignal(sensorViewModel.data$);

  onMount(() => {
    void sensorViewModel.fetchCommand.execute();
  });

  return (
    <>
      <A href="/" class="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </A>
      <div class="card">
        <h1 class="card-title">Sensors</h1>
        <Show
          when={sensors() && sensors()!.length > 0}
          fallback={<p>No sensors found or still loading...</p>}
        >
          <ul class="card-content list">
            <For each={sensors() ?? []}>
              {(sensor) => (
                <li class="list-item">
                  {sensor.greenhouse.name} {sensor.type} (Status: {sensor.status})
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </>
  );
}
