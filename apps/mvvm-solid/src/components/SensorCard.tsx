import { Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { SensorListData } from '@repo/view-models/SensorViewModel';

interface SensorCardProps {
  sensors: SensorListData | null;
}

export default function SensorCard(props: SensorCardProps) {
  return (
    <Show when={props.sensors}>
      {(sensors) => (
        <div class="card">
          <A href="/sensors" class="card-header-link">
            <h3 class="card-title">Sensors</h3>
          </A>
          <p class="card-content">Total: {sensors().length}</p>
        </div>
      )}
    </Show>
  );
}
