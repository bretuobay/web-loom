import { For, Show, onMount } from 'solid-js';
import { A } from '@solidjs/router';
import { thresholdAlertViewModel } from '@repo/view-models/ThresholdAlertViewModel';
import { useSignal } from '../hooks/useSignal';
import BackArrow from '../assets/back-arrow.svg';

export function ThresholdAlertList() {
  const thresholds = useSignal(thresholdAlertViewModel.data$);

  onMount(() => {
    void thresholdAlertViewModel.fetchCommand.execute();
  });

  return (
    <>
      <A href="/" class="back-button">
        <img src={BackArrow} alt="Back to dashboard" style={{ width: '36px', height: '36px' }} />
      </A>
      <div class="card">
        <h1 class="card-title">Threshold Alerts</h1>
        <Show
          when={thresholds() && thresholds()!.length > 0}
          fallback={<p>No threshold alerts found or still loading...</p>}
        >
          <ul class="card-content list">
            <For each={thresholds() ?? []}>
              {(alert) => (
                <li class="list-item">
                  Alert ID: {alert.id}, Sensor ID: {alert.sensorType}, Message: Max: {alert.maxValue}, Min:{' '}
                  {alert.minValue}
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </>
  );
}
