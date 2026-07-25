import { signal, type WritableSignal } from '@web-loom/signals-core';
import type { CommandPaletteState } from '@web-loom/ui-patterns';
import type { FormState } from '@web-loom/ui-core';
import type { ThemeMode } from '../infrastructure/store/ui-store';
import type { CheckoutFormValues } from '../features/cart/CartViewModel';
import type { PendingConfirmation } from './types';

export interface TemplateAppState {
  readonly route$: WritableSignal<string>;
  readonly theme$: WritableSignal<ThemeMode>;
  readonly cartOpen$: WritableSignal<boolean>;
  readonly paletteState$: WritableSignal<CommandPaletteState>;
  readonly pendingConfirmation$: WritableSignal<PendingConfirmation | null>;
  readonly toastMessage$: WritableSignal<string>;
  readonly checkoutState$: WritableSignal<FormState<CheckoutFormValues>>;
}

export function createTemplateAppState(
  initialTheme: ThemeMode,
  initialRoute: string,
  initialCheckoutState: FormState<CheckoutFormValues>,
): TemplateAppState {
  return {
    route$: signal(initialRoute),
    theme$: signal(initialTheme),
    cartOpen$: signal(false),
    paletteState$: signal<CommandPaletteState>({
      isOpen: false,
      query: '',
      commands: [],
      filteredCommands: [],
      selectedIndex: 0,
    }),
    pendingConfirmation$: signal(null),
    toastMessage$: signal(''),
    checkoutState$: signal(initialCheckoutState),
  };
}
