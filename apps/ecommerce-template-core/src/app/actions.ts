import type { CommandPaletteBehavior } from '@web-loom/ui-patterns';
import type { CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { uiStore } from '../infrastructure/store/ui-store';
import { CatalogViewModel } from '../features/catalog/CatalogViewModel';
import { CartViewModel, type CheckoutFormValues } from '../features/cart/CartViewModel';
import { formatMoney } from '../utils/money';
import type { TemplateAppState } from './state';

interface TemplateAppActionOptions {
  catalog: CatalogViewModel;
  cart: CartViewModel;
  state: TemplateAppState;
  navigate: (path: string) => Promise<void>;
}

export class TemplateAppActions {
  private palette: CommandPaletteBehavior | null = null;
  private readonly toastTimers = new Map<string, number>();

  constructor(private readonly options: TemplateAppActionOptions) {}

  bindPalette(palette: CommandPaletteBehavior): void {
    this.palette = palette;
  }

  dispose(): void {
    this.toastTimers.forEach((timer) => window.clearTimeout(timer));
    this.toastTimers.clear();
  }

  async navigate(path: string): Promise<void> {
    await this.options.navigate(path);
  }

  navigateFromClick(event: Event, path: string): void {
    event.preventDefault();
    void this.navigate(path);
  }

  setSearchQuery(value: string): void {
    this.options.catalog.setSearchQuery(value);
  }

  selectProduct(product: CatalogProductDto): void {
    this.options.catalog.selectProduct(product);
  }

  addToCart(product: CatalogProductDto): void {
    void this.options.cart.addToCartCommand.execute({ productId: product.id, quantity: 1 });
  }

  addSelectedToCart(): void {
    const product = this.options.catalog.selectedProduct.get();
    if (product) this.addToCart(product);
  }

  reloadProducts(): void {
    void this.options.catalog.refreshCatalogCommand.execute();
  }

  toggleTheme(): void {
    uiStore.actions.toggleTheme();
  }

  openCart(): void {
    this.options.state.cartOpen$.set(true);
  }

  closeCart(): void {
    this.options.state.cartOpen$.set(false);
  }

  toggleCart(): void {
    this.options.state.cartOpen$.update((open) => !open);
  }

  openPalette(): void {
    this.palette?.actions.open();
  }

  closePalette(): void {
    this.palette?.actions.close();
  }

  updateQuantity(item: { productId: string; quantity: number }, delta: number): void {
    const quantity = Math.max(item.quantity + delta, 0);
    void this.options.cart.updateQuantityCommand.execute({ productId: item.productId, quantity });
  }

  removeItem(item: { productId: string }): void {
    void this.options.cart.removeItemCommand.execute(item.productId);
  }

  clearCart(): void {
    void this.options.cart.clearCartCommand.execute();
  }

  goToCheckout(): void {
    this.closeCart();
    void this.navigate('/checkout');
  }

  setCheckoutEmail(value: string): void {
    this.options.cart.checkoutForm.actions.setFieldValue('email', value);
  }

  setCheckoutAddress(value: string): void {
    this.options.cart.checkoutForm.actions.setFieldValue('shippingAddress', value);
  }

  setCheckoutNotes(value: string): void {
    this.options.cart.checkoutForm.actions.setFieldValue('notes', value);
  }

  touchCheckoutField(field: keyof CheckoutFormValues): void {
    this.options.cart.checkoutForm.actions.setFieldTouched(field, true);
  }

  submitCheckout(): void {
    void this.options.cart.checkoutCommand.execute(undefined);
  }

  confirmPending(): void {
    const pending = this.options.state.pendingConfirmation$.get();
    if (!pending) return;
    pending.callback({ ...pending.context, confirmed: true });
    this.options.state.pendingConfirmation$.set(null);
  }

  cancelPending(): void {
    const pending = this.options.state.pendingConfirmation$.get();
    if (!pending) return;
    pending.callback({ ...pending.context, confirmed: false });
    this.options.state.pendingConfirmation$.set(null);
  }

  executePaletteCommand(commandId: string): void {
    void this.palette?.actions.executeCommand(commandId);
  }

  selectNextPaletteCommand(): void {
    this.palette?.actions.selectNext();
  }

  selectPreviousPaletteCommand(): void {
    this.palette?.actions.selectPrevious();
  }

  executeSelectedPaletteCommand(): void {
    void this.palette?.actions.executeSelected();
  }

  setPaletteQuery(value: string): void {
    this.palette?.actions.setQuery(value);
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

  stopEvent(event: Event): void {
    event.stopPropagation();
  }

  pushToast(message: string): void {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    this.options.state.toastMessage$.set(message);
    const timer = window.setTimeout(() => {
      this.toastTimers.delete(id);
      if (this.options.state.toastMessage$.get() === message) this.options.state.toastMessage$.set('');
    }, 3200);
    this.toastTimers.set(id, timer);
  }

  formatMoney(value: unknown): string {
    return formatMoney(Number(value ?? 0));
  }
}
