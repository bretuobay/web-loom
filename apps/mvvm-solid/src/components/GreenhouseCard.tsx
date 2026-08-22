import { Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { GreenhouseListData } from '@repo/view-models/GreenHouseViewModel';

interface GreenhouseCardProps {
  greenHouses: GreenhouseListData | null;
}

export default function GreenhouseCard(props: GreenhouseCardProps) {
  return (
    <Show when={props.greenHouses}>
      {(greenHouses) => (
        <div class="card">
          <A href="/greenhouses" class="card-header-link">
            <h3 class="card-title">Greenhouses</h3>
          </A>
          <p class="card-content">Total: {greenHouses().length}</p>
        </div>
      )}
    </Show>
  );
}
