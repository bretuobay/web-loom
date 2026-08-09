import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import type { TemplateAppBindings } from '../app/bindings';
import { cartDrawerTemplate } from './cart-drawer';
import { commandPaletteTemplate } from './command-palette';
import { confirmationDialogTemplate } from './confirmation-dialog';
import { headerTemplate } from './header';
import { toastTemplate } from './toast';

const shell = declareContext<TemplateAppBindings>();

/** Documents partial context shapes for review and ESLint settings. */
export type AppShellPartials = PartialContexts<{
  header: TemplateAppBindings;
  cart: TemplateAppBindings;
  palette: TemplateAppBindings;
  confirmation: TemplateAppBindings;
  toast: TemplateAppBindings;
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
