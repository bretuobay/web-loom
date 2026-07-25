import { createCommandPalette, type CommandPaletteBehavior } from '@web-loom/ui-patterns';
import type { TemplateAppActions } from './actions';

export function createTemplateAppPalette(actions: TemplateAppActions): CommandPaletteBehavior {
  return createCommandPalette({
    commands: [
      {
        id: 'reload-products',
        label: 'Reload Products',
        category: 'Catalog',
        keywords: ['refresh', 'catalog'],
        action: () => actions.reloadProducts(),
      },
      {
        id: 'toggle-theme',
        label: 'Toggle Theme',
        category: 'Appearance',
        keywords: ['dark', 'light'],
        action: () => actions.toggleTheme(),
      },
      {
        id: 'toggle-cart',
        label: 'Toggle Cart Drawer',
        category: 'Cart',
        keywords: ['basket', 'cart'],
        action: () => actions.toggleCart(),
      },
      {
        id: 'clear-cart',
        label: 'Clear Cart',
        category: 'Cart',
        keywords: ['reset', 'empty'],
        action: () => actions.clearCart(),
      },
      {
        id: 'go-checkout',
        label: 'Go to Checkout',
        category: 'Cart',
        keywords: ['pay', 'order'],
        action: () => actions.goToCheckout(),
      },
    ],
    onOpen: () => undefined,
    onClose: () => undefined,
  });
}
