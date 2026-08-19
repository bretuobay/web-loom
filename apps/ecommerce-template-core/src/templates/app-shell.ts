import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import type { AppContext } from '../app/context';
import { cartDrawerTemplate } from './cart-drawer';
import { commandPaletteTemplate } from './command-palette';
import { confirmationDialogTemplate } from './confirmation-dialog';
import { headerTemplate } from './header';
import { toastTemplate } from './toast';

const shell = declareContext<AppContext>();

/** Documents partial context shapes for review and ESLint settings. */
export type AppShellPartials = PartialContexts<{
  header: AppContext;
  cart: AppContext;
  palette: AppContext;
  confirmation: AppContext;
  toast: AppContext;
}>;

export const appShellTemplate = shell.compile<AppShellPartials>(
  `<div class="app-shell">
  {{> header}}
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
