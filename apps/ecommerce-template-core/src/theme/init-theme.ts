import { applyTheme, setTheme } from '@web-loom/design-core/utils';
import { uiStore } from '../infrastructure/store/ui-store';
import { darkTheme, lightTheme } from './themes';

let stopThemeSync: (() => void) | null = null;

export async function initTheme(): Promise<void> {
  await applyTheme(lightTheme);
  await applyTheme(darkTheme);

  setTheme(uiStore.getState().theme);

  if (stopThemeSync) {
    stopThemeSync();
  }

  stopThemeSync = uiStore.subscribe((state, previous) => {
    if (state.theme !== previous.theme) {
      setTheme(state.theme);
    }
  });
}
