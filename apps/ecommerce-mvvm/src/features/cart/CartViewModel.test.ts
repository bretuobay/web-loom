import { describe, expect, it, vi } from 'vitest';
import type {
  CartDto,
  CheckoutResultDto,
  EcommerceApiPort,
} from '../../infrastructure/api/ports/ecommerce-api-port';
import { CartModel } from './CartModel';
import { CartViewModel } from './CartViewModel';

function createCart(itemCount: number): CartDto {
  return {
    items:
      itemCount > 0
        ? [
            {
              productId: 'p-1',
              name: 'Test Product',
              imageUrl: 'https://example.com/p.jpg',
              unitPriceCents: 1200,
              quantity: itemCount,
              lineTotalCents: 1200 * itemCount,
              currency: 'USD',
            },
          ]
        : [],
    itemCount,
    subtotalCents: 1200 * itemCount,
    currency: 'USD',
  };
}

describe('CartViewModel', () => {
  it('does not clear cart when confirmation is cancelled', async () => {
    const api: EcommerceApiPort = {
      listProducts: vi.fn(async () => []),
      getCart: vi.fn(async () => createCart(1)),
      addToCart: vi.fn(async () => createCart(1)),
      updateCartItem: vi.fn(async () => createCart(1)),
      removeCartItem: vi.fn(async () => createCart(0)),
      clearCart: vi.fn(async () => createCart(0)),
      checkout: vi.fn(async () => ({
        orderId: 'ORDER-1',
        totalCents: 1200,
        currency: 'USD' as const,
        placedAtIso: new Date().toISOString(),
      })),
    };

    const model = new CartModel(api);
    const viewModel = new CartViewModel(model);

    model.setData(createCart(1));

    viewModel.confirmClearCart.requested$.subscribe((event) => {
      event.callback({ ...event.context, confirmed: false });
    });

    await viewModel.clearCartCommand.execute();

    expect(api.clearCart).not.toHaveBeenCalled();

    viewModel.dispose();
    model.dispose();
  });

  it('checks out when confirmed and form is valid', async () => {
    const checkoutResult: CheckoutResultDto = {
      orderId: 'ORDER-99',
      totalCents: 1200,
      currency: 'USD',
      placedAtIso: new Date().toISOString(),
    };

    const checkoutSpy = vi.fn(async () => checkoutResult);

    const api: EcommerceApiPort = {
      listProducts: vi.fn(async () => []),
      getCart: vi.fn(async () => createCart(0)),
      addToCart: vi.fn(async () => createCart(1)),
      updateCartItem: vi.fn(async () => createCart(1)),
      removeCartItem: vi.fn(async () => createCart(0)),
      clearCart: vi.fn(async () => createCart(0)),
      checkout: checkoutSpy,
    };

    const model = new CartModel(api);
    const viewModel = new CartViewModel(model);

    const notifications: string[] = [];

    model.setData(createCart(1));

    viewModel.checkoutForm.actions.setFieldValue('email', 'user@example.com');
    viewModel.checkoutForm.actions.setFieldValue('shippingAddress', '123 Main Street, Springfield');

    viewModel.notifications.requested$.subscribe((event) => {
      notifications.push(event.context.content);
      event.callback(event.context);
    });

    viewModel.confirmCheckout.requested$.subscribe((event) => {
      event.callback({ ...event.context, confirmed: true });
    });

    await viewModel.checkoutCommand.execute(undefined);

    expect(checkoutSpy).toHaveBeenCalledTimes(1);
    expect(notifications.some((message) => message.includes('ORDER-99'))).toBe(true);

    viewModel.dispose();
    model.dispose();
  });
});
