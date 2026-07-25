import type { TemplateAppViewModel } from '../TemplateAppViewModel';
import type { CartItemDto, CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';

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

  focusSearch(element: Element): void {
    if (!(element instanceof HTMLInputElement)) return;
    if (document.activeElement === document.body || document.activeElement == null) element.focus();
  }

  setCheckoutEmail(value: string): void {
    this.actions.setCheckoutEmail(value);
  }

  setCheckoutAddress(value: string): void {
    this.actions.setCheckoutAddress(value);
  }

  setCheckoutNotes(value: string): void {
    this.actions.setCheckoutNotes(value);
  }

  selectProduct(product: CatalogProductDto): void {
    this.actions.selectProduct(product);
  }

  addToCart(product: CatalogProductDto): void {
    this.actions.addToCart(product);
  }

  formatMoney(value: unknown): string {
    return this.actions.formatMoney(value);
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

  updateQuantity(item: CartItemDto, delta: number): void {
    this.actions.updateQuantity(item, delta);
  }

  removeItem(item: CartItemDto): void {
    this.actions.removeItem(item);
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
    return target instanceof Element
      ? (target.closest<HTMLElement>(`[data-${name}]`)?.getAttribute(`data-${name}`) ?? null)
      : null;
  }
}
