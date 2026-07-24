import type { CommandPaletteBehavior } from '@web-loom/ui-patterns';
import type { Router } from '@web-loom/router-core';
import { appBus } from '../infrastructure/events/app-bus';
import { uiStore } from '../infrastructure/store/ui-store';
import type { CartViewModel } from '../features/cart/CartViewModel';
import type { TemplateAppActions } from './actions';
import type { TemplateAppState } from './state';

interface SubscriptionOptions {
  state: TemplateAppState;
  cart: CartViewModel;
  router: Router;
  palette: CommandPaletteBehavior;
  actions: TemplateAppActions;
}

export function createTemplateAppSubscriptions(options: SubscriptionOptions): Array<() => void> {
  const { state, cart, router, palette, actions } = options;
  const onCheckoutCompleted = (orderId: string, totalCents: number) => {
    actions.closeCart();
    void actions.navigate('/');
    actions.pushToast(`Checkout complete: ${orderId} (${(totalCents / 100).toFixed(2)} USD).`);
  };
  const onItemAdded = (_productId: string, quantity: number) => {
    actions.pushToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart.`);
  };

  appBus.on('checkout:completed', onCheckoutCompleted);
  appBus.on('cart:item-added', onItemAdded);

  return [
    router.subscribe((route) => state.route$.set(route.path)),
    uiStore.subscribe((nextState) => state.theme$.set(nextState.theme)),
    palette.subscribe((nextState) => state.paletteState$.set(nextState)),
    cart.checkoutForm.subscribe((nextState) => state.checkoutState$.set(nextState)),
    cart.notifications.requested$.subscribe((event) => {
      actions.pushToast(event.context.content);
      event.callback(event.context);
    }),
    cart.confirmClearCart.requested$.subscribe((event) => {
      state.pendingConfirmation$.set({ context: event.context, callback: event.callback });
    }),
    cart.confirmCheckout.requested$.subscribe((event) => {
      state.pendingConfirmation$.set({ context: event.context, callback: event.callback });
    }),
    () => appBus.off('checkout:completed', onCheckoutCompleted),
    () => appBus.off('cart:item-added', onItemAdded),
    installGlobalKeyboardShortcuts(state, actions),
    installLinkInterception(actions),
  ];
}

function installGlobalKeyboardShortcuts(state: TemplateAppState, actions: TemplateAppActions): () => void {
  const listener = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (state.paletteState$.get().isOpen) actions.closePalette();
      else actions.openPalette();
    }
    if (event.key === 'Escape') {
      if (state.paletteState$.get().isOpen) actions.closePalette();
      else if (state.cartOpen$.get()) actions.closeCart();
    }
  };
  document.addEventListener('keydown', listener);
  return () => document.removeEventListener('keydown', listener);
}

function installLinkInterception(actions: TemplateAppActions): () => void {
  const listener = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const url = new URL(anchor.href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    event.preventDefault();
    void actions.navigate(`${url.pathname}${url.search}`);
  };
  document.addEventListener('click', listener);
  return () => document.removeEventListener('click', listener);
}
