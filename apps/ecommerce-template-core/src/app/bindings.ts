import type { TemplateAppViewModel } from '../TemplateAppViewModel';

/**
 * Adapts template-core DOM events to the framework-agnostic app ViewModel.
 * Event and element knowledge belongs at the View boundary, not in the VM.
 */
export class TemplateAppBindings {
  readonly state: TemplateAppViewModel['state'];
  readonly actions: TemplateAppViewModel['actions'];
  readonly catalog: TemplateAppViewModel['catalog'];
  readonly cart: TemplateAppViewModel['cart'];

  constructor(private readonly viewModel: TemplateAppViewModel) {
    this.state = viewModel.state;
    this.actions = viewModel.actions;
    this.catalog = viewModel.catalog;
    this.cart = viewModel.cart;
  }

  navigateFromClick(event: Event): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    void this.viewModel.navigate(anchor.getAttribute('href') ?? '/');
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
    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.actions.selectNextPaletteCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.actions.selectPreviousPaletteCommand();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.actions.executeSelectedPaletteCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.actions.closePalette();
    }
  }

  executePaletteCommand(event: Event): void {
    const commandId = this.readDataAttribute(event, 'command-id');
    if (commandId) this.actions.executePaletteCommand(commandId);
  }

  stopEvent(event: Event): void {
    event.stopPropagation();
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
