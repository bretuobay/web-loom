import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import { cartDrawerTemplate, type CartDrawerProps } from './cart-drawer';
import { commandPaletteTemplate, type CommandPaletteProps } from './command-palette';
import { confirmationDialogTemplate, type ConfirmationDialogProps } from './confirmation-dialog';
import { headerTemplate, type HeaderProps } from './header';
import { toastTemplate, type ToastProps } from './toast';

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

export const appShellTemplate = chrome.compile<AppShellPartials>(
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
      header: headerTemplate,
      cart: cartDrawerTemplate,
      palette: commandPaletteTemplate,
      confirmation: confirmationDialogTemplate,
      toast: toastTemplate,
    },
  },
);
