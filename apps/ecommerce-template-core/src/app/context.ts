import { composeContext } from '@web-loom/template-core';
import type { CartItemDto, CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import type { TemplateAppViewModel } from '../TemplateAppViewModel';

/**
 * The single context every `.loom`/`compile()` template mounts against.
 * Domain state and commands stay on `state`/`actions`/`catalog`/`cart`; the
 * remaining members are view-boundary handlers — DOM event adapters and
 * `this`-safe aliases of `actions.*` methods. Hash-arg function props cannot
 * keep the original method receiver, and call-form expressions only resolve a
 * single identifier.
 */
export function createAppContext(viewModel: TemplateAppViewModel) {
  const { state, actions, catalog, cart } = viewModel;

  function navigateFromClick(event: Event): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    event.preventDefault();
    void actions.navigate(anchor.getAttribute('href') ?? '/');
  }

  function focusSearch(element: Element): void {
    if (!(element instanceof HTMLInputElement)) return;
    if (document.activeElement === document.body || document.activeElement == null) element.focus();
  }

  function selectProduct(product: CatalogProductDto): void {
    actions.selectProduct(product);
  }

  function addToCart(product: CatalogProductDto): void {
    actions.addToCart(product);
  }

  function updateQuantity(item: CartItemDto, delta: number): void {
    actions.updateQuantity(item, delta);
  }

  function removeItem(item: CartItemDto): void {
    actions.removeItem(item);
  }

  function setCheckoutEmail(value: string): void {
    actions.setCheckoutEmail(value);
  }

  function setCheckoutAddress(value: string): void {
    actions.setCheckoutAddress(value);
  }

  function setCheckoutNotes(value: string): void {
    actions.setCheckoutNotes(value);
  }

  function touchCheckoutEmail(): void {
    actions.touchCheckoutField('email');
  }

  function touchCheckoutAddress(): void {
    actions.touchCheckoutField('shippingAddress');
  }

  function touchCheckoutNotes(): void {
    actions.touchCheckoutField('notes');
  }

  function setPaletteQueryFromEvent(event: Event): void {
    actions.setPaletteQuery(readInputValue(event));
  }

  function handlePaletteKey(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      actions.selectNextPaletteCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      actions.selectPreviousPaletteCommand();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      actions.executeSelectedPaletteCommand();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      actions.closePalette();
    }
  }

  function executePaletteCommand(event: Event): void {
    const commandId = readDataAttribute(event, 'command-id');
    if (commandId) actions.executePaletteCommand(commandId);
  }

  function formatMoney(value: unknown): string {
    return actions.formatMoney(value);
  }

  function openCart(): void {
    actions.openCart();
  }

  function closeCart(): void {
    actions.closeCart();
  }

  function openPalette(): void {
    actions.openPalette();
  }

  function closePalette(): void {
    actions.closePalette();
  }

  function toggleTheme(): void {
    actions.toggleTheme();
  }

  function clearCart(): void {
    actions.clearCart();
  }

  function goToCheckout(): void {
    actions.goToCheckout();
  }

  function stopEvent(event: Event): void {
    actions.stopEvent(event);
  }

  function cancelPending(): void {
    actions.cancelPending();
  }

  function confirmPending(): void {
    actions.confirmPending();
  }

  return composeContext(
    { state, actions, catalog, cart },
    {
      formatMoney,
      navigateFromClick,
      focusSearch,
      selectProduct,
      addToCart,
      updateQuantity,
      removeItem,
      setCheckoutEmail,
      setCheckoutAddress,
      setCheckoutNotes,
      touchCheckoutEmail,
      touchCheckoutAddress,
      touchCheckoutNotes,
      setPaletteQueryFromEvent,
      handlePaletteKey,
      executePaletteCommand,
      openCart,
      closeCart,
      openPalette,
      closePalette,
      toggleTheme,
      clearCart,
      goToCheckout,
      stopEvent,
      cancelPending,
      confirmPending,
    },
  );
}

export type AppContext = ReturnType<typeof createAppContext>;

function readInputValue(event: Event): string {
  const target = event.target;
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement ? target.value : '';
}

function readDataAttribute(event: Event, name: string): string | null {
  const target = event.target ?? event.currentTarget;
  return target instanceof Element
    ? (target.closest<HTMLElement>(`[data-${name}]`)?.getAttribute(`data-${name}`) ?? null)
    : null;
}
