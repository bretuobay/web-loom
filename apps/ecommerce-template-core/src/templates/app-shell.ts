import { compile } from '@web-loom/template-core';
import { cartDrawerTemplate } from './cart-drawer';
import { commandPaletteTemplate } from './command-palette';
import { confirmationDialogTemplate } from './confirmation-dialog';
import { headerTemplate } from './header';
import { toastTemplate } from './toast';

export const appShellTemplate = compile(
  `
  <div class="app-shell">
    {{> header}}
    <main data-template-slot="route"></main>
    {{> cart}}
    {{> palette}}
    {{> confirmation}}
    {{> toast}}
  </div>
`,
  {
    partials: {
      header: headerTemplate,
      cart: cartDrawerTemplate,
      palette: commandPaletteTemplate,
      confirmation: confirmationDialogTemplate,
      toast: toastTemplate,
    },
  },
);
