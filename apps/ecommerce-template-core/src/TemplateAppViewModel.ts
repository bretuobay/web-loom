import { createRouter, type Router } from '@web-loom/router-core';
import type { CommandPaletteBehavior } from '@web-loom/ui-patterns';
import { uiStore } from './infrastructure/store/ui-store';
import { disposeTheme, initTheme } from './theme/init-theme';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartModel } from './features/cart/CartModel';
import { CartViewModel } from './features/cart/CartViewModel';
import { TemplateAppActions } from './app/actions';
import { createTemplateAppPalette } from './app/palette';
import { createTemplateAppState, type TemplateAppState } from './app/state';
import { createTemplateAppSubscriptions } from './app/subscriptions';

export class TemplateAppViewModel {
  readonly state: TemplateAppState;
  readonly actions: TemplateAppActions;
  readonly router: Router;
  readonly palette: CommandPaletteBehavior;
  readonly catalog: CatalogViewModel;
  readonly cart: CartViewModel;

  private subscriptions: Array<() => void> = [];
  private started = false;

  constructor(
    catalogModel: CatalogModel,
    cartModel: CartModel,
  ) {
    this.catalog = new CatalogViewModel(catalogModel);
    this.cart = new CartViewModel(cartModel);
    this.router = createRouter({
      mode: 'history',
      routes: [
        { path: '/', name: 'storefront', meta: { view: 'storefront' } },
        { path: '/checkout', name: 'checkout', meta: { view: 'checkout' } },
        { path: '/:pathMatch(.*)', name: 'not-found', matchStrategy: 'prefix', meta: { view: 'not-found' } },
      ],
    });
    this.state = createTemplateAppState(
      uiStore.getState().theme,
      this.router.currentRoute.path,
      this.cart.checkoutForm.getState(),
    );
    this.actions = new TemplateAppActions({
      catalog: this.catalog,
      cart: this.cart,
      state: this.state,
      navigate: (path) => this.navigate(path),
    });
    const palette = createTemplateAppPalette(this.actions);
    this.actions.bindPalette(palette);
    this.palette = palette;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await initTheme();
    this.catalog.activate();
    this.cart.activate();
    this.subscriptions = createTemplateAppSubscriptions({
      state: this.state,
      cart: this.cart,
      router: this.router,
      palette: this.palette,
      actions: this.actions,
    });
  }

  async navigate(path: string): Promise<void> {
    await this.router.push(path);
  }

  navigateFromClick(event: Event): void {
    const anchor = event.currentTarget;
    if (anchor instanceof HTMLAnchorElement) {
      this.actions.navigateFromClick(event, anchor.getAttribute('href') ?? '/');
    }
  }

  setSearchQueryFromEvent(event: Event): void {
    this.actions.setSearchQuery(this.readInputValue(event));
  }

  selectProduct(event: Event): void {
    const productId = this.readDataAttribute(event, 'product-id');
    const product = this.catalog.filteredProducts.get().find((item) => item.id === productId);
    if (product) this.actions.selectProduct(product);
  }

  addToCart(event: Event): void {
    const productId = this.readDataAttribute(event, 'product-id');
    const product = this.catalog.filteredProducts.get().find((item) => item.id === productId);
    if (product) this.actions.addToCart(product);
  }

  formatMoney(value: unknown): string {
    return this.actions.formatMoney(value);
  }

  setCheckoutEmailFromEvent(event: Event): void {
    this.actions.setCheckoutEmail(this.readInputValue(event));
  }

  setCheckoutAddressFromEvent(event: Event): void {
    this.actions.setCheckoutAddress(this.readInputValue(event));
  }

  setCheckoutNotesFromEvent(event: Event): void {
    this.actions.setCheckoutNotes(this.readInputValue(event));
  }

  touchCheckoutEmail(): void {
    this.actions.touchCheckoutField('email');
  }

  touchCheckoutAddress(): void {
    this.actions.touchCheckoutField('shippingAddress');
  }

  touchCheckoutNotes(): void {
    this.actions.touchCheckoutField('notes');
  }

  updateQuantity(event: Event): void {
    const button = event.currentTarget;
    if (!(button instanceof Element)) return;
    const itemElement = button.closest<HTMLElement>('[data-product-id]');
    const productId = itemElement?.dataset.productId;
    const delta = Number(button.getAttribute('data-quantity-delta'));
    const item = this.cart.cart.get().items.find((candidate) => candidate.productId === productId);
    if (item && Number.isFinite(delta)) this.actions.updateQuantity(item, delta);
  }

  removeItem(event: Event): void {
    const button = event.currentTarget;
    if (!(button instanceof Element)) return;
    const productId = button.closest<HTMLElement>('[data-product-id]')?.dataset.productId;
    if (productId) this.actions.removeItem({ productId });
  }

  setPaletteQueryFromEvent(event: Event): void {
    this.actions.setPaletteQuery(this.readInputValue(event));
  }

  handlePaletteKey(event: Event): void {
    if (event instanceof KeyboardEvent) this.actions.handlePaletteKey(event);
  }

  executePaletteCommand(event: Event): void {
    const commandId = this.readDataAttribute(event, 'command-id');
    if (commandId) this.actions.executePaletteCommand(commandId);
  }

  dispose(): void {
    this.subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
    this.actions.dispose();
    this.palette.destroy();
    this.router.destroy();
    disposeTheme();
    this.catalog.deactivate();
    this.cart.deactivate();
    this.catalog.dispose();
    this.cart.dispose();
    this.started = false;
  }

  private readInputValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : '';
  }

  private readDataAttribute(event: Event, name: string): string | null {
    const target = event.target ?? event.currentTarget;
    return target instanceof Element ? target.closest<HTMLElement>(`[data-${name}]`)?.getAttribute(`data-${name}`) ?? null : null;
  }
}
