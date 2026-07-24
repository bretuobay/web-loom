import { describe, expect, it } from 'vitest';
import type { EcommerceApiPort } from '../ports/ecommerce-api-port';
import { MockEcommerceApiAdapter } from './mock-ecommerce-api-adapter';

function assertPortContract(api: EcommerceApiPort): void {
  expect(typeof api.listProducts).toBe('function');
  expect(typeof api.getCart).toBe('function');
  expect(typeof api.addToCart).toBe('function');
  expect(typeof api.updateCartItem).toBe('function');
  expect(typeof api.removeCartItem).toBe('function');
  expect(typeof api.clearCart).toBe('function');
  expect(typeof api.checkout).toBe('function');
}

describe('MockEcommerceApiAdapter', () => {
  it('satisfies the EcommerceApiPort contract', () => {
    const api = new MockEcommerceApiAdapter();
    assertPortContract(api);
  });

  it('recalculates totals across add/update/remove/clear', async () => {
    const api = new MockEcommerceApiAdapter();
    const products = await api.listProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0].imageUrl.startsWith('https://')).toBe(true);

    await api.addToCart(products[0].id, 2);
    await api.addToCart(products[1].id, 1);

    const updated = await api.getCart();
    expect(updated.itemCount).toBe(3);
    expect(updated.subtotalCents).toBe(products[0].priceCents * 2 + products[1].priceCents);

    const reduced = await api.updateCartItem(products[0].id, 1);
    expect(reduced.itemCount).toBe(2);

    const removed = await api.removeCartItem(products[1].id);
    expect(removed.itemCount).toBe(1);

    const cleared = await api.clearCart();
    expect(cleared.itemCount).toBe(0);
    expect(cleared.subtotalCents).toBe(0);
  });
});
