import { For } from 'solid-js';
import { A } from '@solidjs/router';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';
import { useSignal } from '../hooks/useSignal';

export function Header() {
  const navigation = useSignal(navigationViewModel.navigationList.items$);

  return (
    <header class="header">
      <A href="/" class="header-item">
        Dashboard
      </A>
      <nav class="flex-container">
        <For each={navigation()}>
          {(item) => (
            <A href={`/${item.id}`} class="header-item">
              <i class={`icon-${item.icon}`}></i> {item.label}
            </A>
          )}
        </For>
      </nav>
    </header>
  );
}
