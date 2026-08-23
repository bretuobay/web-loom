import { composeContext } from '@web-loom/template-core';
import type { TemplateAppViewModel } from '../TemplateAppViewModel';

/**
 * Shared provider every screen may bind: namespaced ViewModel slices.
 * Screen- and chrome-owned handlers live in each component's `setup`.
 */
export function createAppContext(viewModel: TemplateAppViewModel) {
  const { state, actions, catalog, cart } = viewModel;
  return composeContext({ state, actions, catalog, cart });
}

export type AppContext = ReturnType<typeof createAppContext>;
