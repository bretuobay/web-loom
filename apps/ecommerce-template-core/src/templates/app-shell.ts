import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { CartItemDto } from '../infrastructure/api/ports/ecommerce-api-port';
import type { AppContext } from '../app/context';
import { cartDrawer, type CartDrawerProps } from './cart-drawer';
import { commandPalette, type CommandPaletteProps } from './command-palette';
import { confirmationDialog, type ConfirmationDialogProps } from './confirmation-dialog';
import { header, type HeaderProps } from './header';
import { toast, type ToastProps } from './toast';

const frame = declareContext();
const appFrame = defineComponent({
  name: 'app-shell',
  template: frame.compile(`<div class="app-shell">
  {{> yield name="header"}}
  {{> yield name="cart"}}
  {{> yield name="palette"}}
  {{> yield name="confirmation"}}
  {{> yield name="toast"}}
</div>
`),
});

const chrome = declareContext<AppContext>();

/** Documents partial context shapes for review and ESLint settings. */
export type AppShellPartials = PartialContexts<{
  'app-shell': object;
  header: HeaderProps;
  cart: CartDrawerProps;
  palette: CommandPaletteProps;
  confirmation: ConfirmationDialogProps;
  toast: ToastProps;
}>;

export const appShell = defineComponent<AppContext>({
  name: 'app-chrome',
  template: chrome.compile<AppShellPartials>(
    `{{#> app-shell}}
  {{#slot header}}
    {{> header theme=state.theme$ cartCount=cart.itemCount onNavigate=navigateFromClick onOpenPalette=openPalette onToggleTheme=toggleTheme onOpenCart=openCart}}
  {{/slot}}
  {{#slot cart}}
    {{> cart open=state.cartOpen$ items=cart.items itemCount=cart.itemCount subtotalCents=cart.subtotalCents formatMoney=formatMoney onClose=closeCart onUpdateQuantity=updateQuantity onRemove=removeItem onClear=clearCart onCheckout=goToCheckout}}
  {{/slot}}
  {{#slot palette}}
    {{> palette palette=state.paletteState$ onClose=closePalette onStop=stopEvent onQuery=setPaletteQueryFromEvent onKey=handlePaletteKey onExecute=executePaletteCommand}}
  {{/slot}}
  {{#slot confirmation}}
    {{> confirmation pending=state.pendingConfirmation$ onCancel=cancelPending onConfirm=confirmPending onStop=stopEvent}}
  {{/slot}}
  {{#slot toast}}
    {{> toast message=state.toastMessage$}}
  {{/slot}}
{{/app-shell}}
`,
    {
      partials: {
        'app-shell': appFrame,
        header,
        cart: cartDrawer,
        palette: commandPalette,
        confirmation: confirmationDialog,
        toast,
      },
    },
  ),
  setup({ actions }) {
    return {
      formatMoney: (value: unknown) => actions.formatMoney(value),
      navigateFromClick(event: Event): void {
        const anchor = event.currentTarget;
        if (!(anchor instanceof HTMLAnchorElement)) return;
        event.preventDefault();
        void actions.navigate(anchor.getAttribute('href') ?? '/');
      },
      updateQuantity: (item: CartItemDto, delta: number) => actions.updateQuantity(item, delta),
      removeItem: (item: CartItemDto) => actions.removeItem(item),
      setPaletteQueryFromEvent: (event: Event) => actions.setPaletteQuery(readInputValue(event)),
      handlePaletteKey(event: Event): void {
        if (!(event instanceof KeyboardEvent)) return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          actions.selectNextPaletteCommand();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          actions.selectPreviousPaletteCommand();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          actions.executeSelectedPaletteCommand();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          actions.closePalette();
        }
      },
      executePaletteCommand(event: Event): void {
        const commandId = readDataAttribute(event, 'command-id');
        if (commandId) actions.executePaletteCommand(commandId);
      },
      openCart: () => actions.openCart(),
      closeCart: () => actions.closeCart(),
      openPalette: () => actions.openPalette(),
      closePalette: () => actions.closePalette(),
      toggleTheme: () => actions.toggleTheme(),
      clearCart: () => actions.clearCart(),
      goToCheckout: () => actions.goToCheckout(),
      stopEvent: (event: Event) => actions.stopEvent(event),
      cancelPending: () => actions.cancelPending(),
      confirmPending: () => actions.confirmPending(),
    };
  },
});

function readInputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : '';
}

function readDataAttribute(event: Event, name: string): string | null {
  const target = event.target ?? event.currentTarget;
  return target instanceof Element
    ? (target.closest<HTMLElement>(`[data-${name}]`)?.getAttribute(`data-${name}`) ?? null)
    : null;
}
