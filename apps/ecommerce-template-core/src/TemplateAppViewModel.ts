import { createCommandPalette, type CommandPaletteBehavior, type CommandPaletteState } from '@web-loom/ui-patterns';
import { signal, type ReadonlySignal, type WritableSignal } from '@web-loom/signals-core';
import { createRouter, type Router } from '@web-loom/router-core';
import type { IConfirmation } from '@web-loom/mvvm-patterns';
import type { FormState } from '@web-loom/ui-core';
import { appBus } from './infrastructure/events/app-bus';
import { uiStore, type ThemeMode } from './infrastructure/store/ui-store';
import { initTheme } from './theme/init-theme';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartViewModel, type CheckoutFormValues } from './features/cart/CartViewModel';
import { formatMoney } from './utils/money';

export interface ToastMessage {
  id: string;
  message: string;
}

export interface PendingConfirmation {
  context: IConfirmation;
  callback: (response: IConfirmation) => void;
}

export class TemplateAppViewModel {
  readonly route$ = signal('/');
  readonly theme$ = signal<ThemeMode>(uiStore.getState().theme);
  readonly cartOpen$ = signal(uiStore.getState().cartOpen);
  readonly paletteState$ = signal<CommandPaletteState>({
    isOpen: false,
    query: '',
    commands: [],
    filteredCommands: [],
    selectedIndex: 0,
  });
  readonly pendingConfirmation$ = signal<PendingConfirmation | null>(null);
  readonly toastMessage$ = signal('');
  readonly checkoutState$: WritableSignal<FormState<CheckoutFormValues>>;

  readonly router: Router;
  readonly palette: CommandPaletteBehavior;
  readonly catalog: CatalogViewModel;
  readonly cart: CartViewModel;

  private readonly subscriptions: Array<() => void> = [];
  private readonly toastTimers = new Map<string, number>();
  private started = false;

  constructor(
    readonly catalogViewModel: CatalogViewModel,
    readonly cartViewModel: CartViewModel,
  ) {
    this.catalog = catalogViewModel;
    this.cart = cartViewModel;
    this.checkoutState$ = signal(this.cartViewModel.checkoutForm.getState());
    this.router = createRouter({
      mode: 'history',
      routes: [
        { path: '/', name: 'storefront', meta: { view: 'storefront' } },
        { path: '/checkout', name: 'checkout', meta: { view: 'checkout' } },
        { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix', meta: { view: 'not-found' } },
      ],
    });
    this.route$.set(this.router.currentRoute.path);

    this.palette = createCommandPalette({
      commands: [
        {
          id: 'reload-products',
          label: 'Reload Products',
          category: 'Catalog',
          keywords: ['refresh', 'catalog'],
          action: () => void this.catalogViewModel.refreshCatalogCommand.execute(),
        },
        {
          id: 'toggle-theme',
          label: 'Toggle Theme',
          category: 'Appearance',
          keywords: ['dark', 'light'],
          action: () => this.toggleTheme(),
        },
        {
          id: 'toggle-cart',
          label: 'Toggle Cart Drawer',
          category: 'Cart',
          keywords: ['basket', 'cart'],
          action: () => this.toggleCart(),
        },
        {
          id: 'clear-cart',
          label: 'Clear Cart',
          category: 'Cart',
          keywords: ['reset', 'empty'],
          action: () => void this.cartViewModel.clearCartCommand.execute(),
        },
        {
          id: 'go-checkout',
          label: 'Go to Checkout',
          category: 'Cart',
          keywords: ['pay', 'order'],
          action: () => {
            this.closeCart();
            void this.navigate('/checkout');
          },
        },
      ],
      onOpen: () => uiStore.actions.openPalette(),
      onClose: () => uiStore.actions.closePalette(),
    });
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await initTheme();
    this.catalogViewModel.activate();
    this.cartViewModel.activate();

    const onCheckoutCompleted = (orderId: string, totalCents: number) => {
      this.closeCart();
      void this.navigate('/');
      this.pushToast(`Checkout complete: ${orderId} (${(totalCents / 100).toFixed(2)} USD).`);
    };
    const onItemAdded = (_productId: string, quantity: number) => {
      this.pushToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart.`);
    };

    this.subscriptions.push(
      this.router.subscribe((route) => this.route$.set(route.path)),
      uiStore.subscribe((state) => {
        this.theme$.set(state.theme);
        this.cartOpen$.set(state.cartOpen);
      }),
      this.palette.subscribe((state) => this.paletteState$.set(state)),
      this.cartViewModel.checkoutForm.subscribe((state) => this.checkoutState$.set(state)),
      this.cartViewModel.notifications.requested$.subscribe((event) => {
        this.pushToast(event.context.content);
        event.callback(event.context);
      }),
      this.cartViewModel.confirmClearCart.requested$.subscribe((event) => {
        this.pendingConfirmation$.set({ context: event.context, callback: event.callback });
      }),
      this.cartViewModel.confirmCheckout.requested$.subscribe((event) => {
        this.pendingConfirmation$.set({ context: event.context, callback: event.callback });
      }),
      () => appBus.off('checkout:completed', onCheckoutCompleted),
      () => appBus.off('cart:item-added', onItemAdded),
    );
    appBus.on('checkout:completed', onCheckoutCompleted);
    appBus.on('cart:item-added', onItemAdded);

    this.subscriptions.push(this.installGlobalKeyboardShortcuts());
    this.subscriptions.push(this.installLinkInterception());
  }

  dispose(): void {
    this.subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
    this.toastTimers.forEach((timer) => window.clearTimeout(timer));
    this.toastTimers.clear();
    this.palette.destroy();
    this.router.destroy();
    this.catalogViewModel.deactivate();
    this.cartViewModel.deactivate();
    this.catalogViewModel.dispose();
    this.cartViewModel.dispose();
    this.started = false;
  }

  async navigate(path: string): Promise<void> {
    await this.router.push(path);
  }

  navigateFromClick(event: Event, path: string): void {
    event.preventDefault();
    void this.navigate(path);
  }

  setSearchQuery(value: string): void {
    this.catalogViewModel.setSearchQuery(value);
  }

  selectProduct(product: unknown): void {
    if (product && typeof product === 'object' && 'id' in product) {
      this.catalogViewModel.selectProduct(product as Parameters<CatalogViewModel['selectProduct']>[0]);
    }
  }

  addToCart(product: unknown): void {
    if (product && typeof product === 'object' && 'id' in product) {
      void this.cartViewModel.addToCartCommand.execute({ productId: String(product.id), quantity: 1 });
    }
  }

  addSelectedToCart(): void {
    const product = this.catalogViewModel.selectedProduct.get();
    if (product) this.addToCart(product);
  }

  reloadProducts(): void {
    void this.catalogViewModel.refreshCatalogCommand.execute();
  }

  toggleTheme(): void {
    uiStore.actions.toggleTheme();
  }

  openCart(): void {
    uiStore.actions.openCart();
  }

  closeCart(): void {
    uiStore.actions.closeCart();
  }

  toggleCart(): void {
    uiStore.actions.toggleCart();
  }

  openPalette(): void {
    this.palette.actions.open();
  }

  closePalette(): void {
    this.palette.actions.close();
  }

  updateQuantity(item: unknown, delta: number): void {
    if (!item || typeof item !== 'object' || !('productId' in item) || !('quantity' in item)) return;
    const quantity = Math.max(Number(item.quantity) + delta, 0);
    void this.cartViewModel.updateQuantityCommand.execute({ productId: String(item.productId), quantity });
  }

  removeItem(item: unknown): void {
    if (item && typeof item === 'object' && 'productId' in item) {
      void this.cartViewModel.removeItemCommand.execute(String(item.productId));
    }
  }

  clearCart(): void {
    void this.cartViewModel.clearCartCommand.execute();
  }

  goToCheckout(): void {
    this.closeCart();
    void this.navigate('/checkout');
  }

  setCheckoutEmail(value: string): void {
    this.cartViewModel.checkoutForm.actions.setFieldValue('email', value);
  }

  setCheckoutAddress(value: string): void {
    this.cartViewModel.checkoutForm.actions.setFieldValue('shippingAddress', value);
  }

  setCheckoutNotes(value: string): void {
    this.cartViewModel.checkoutForm.actions.setFieldValue('notes', value);
  }

  touchCheckoutField(field: keyof CheckoutFormValues): void {
    this.cartViewModel.checkoutForm.actions.setFieldTouched(field, true);
  }

  submitCheckout(): void {
    void this.cartViewModel.checkoutCommand.execute(undefined);
  }

  confirmPending(): void {
    const pending = this.pendingConfirmation$.get();
    if (!pending) return;
    pending.callback({ ...pending.context, confirmed: true });
    this.pendingConfirmation$.set(null);
  }

  cancelPending(): void {
    const pending = this.pendingConfirmation$.get();
    if (!pending) return;
    pending.callback({ ...pending.context, confirmed: false });
    this.pendingConfirmation$.set(null);
  }

  formatMoney(value: unknown): string {
    return formatMoney(Number(value ?? 0));
  }

  executePaletteCommand(commandId: string): void {
    void this.palette.actions.executeCommand(commandId);
  }

  selectNextPaletteCommand(): void {
    this.palette.actions.selectNext();
  }

  selectPreviousPaletteCommand(): void {
    this.palette.actions.selectPrevious();
  }

  executeSelectedPaletteCommand(): void {
    void this.palette.actions.executeSelected();
  }

  setPaletteQuery(value: string): void {
    this.palette.actions.setQuery(value);
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  handlePaletteKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectNextPaletteCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectPreviousPaletteCommand();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.executeSelectedPaletteCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closePalette();
    }
  }

  private pushToast(message: string): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.toastMessage$.set(message);
    const timer = window.setTimeout(() => {
      this.toastTimers.delete(id);
      if (this.toastMessage$.get() === message) this.toastMessage$.set('');
    }, 3200);
    this.toastTimers.set(id, timer);
  }

  private installGlobalKeyboardShortcuts(): () => void {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (this.paletteState$.get().isOpen) this.closePalette();
        else this.openPalette();
      }
      if (event.key === 'Escape') {
        if (this.paletteState$.get().isOpen) this.closePalette();
        else if (this.cartOpen$.get()) this.closeCart();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }

  private installLinkInterception(): () => void {
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
      void this.navigate(`${url.pathname}${url.search}`);
    };
    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }
}

export type TemplateAppSignals = {
  catalog: CatalogViewModel;
  cart: CartViewModel;
  route$: ReadonlySignal<string>;
};
