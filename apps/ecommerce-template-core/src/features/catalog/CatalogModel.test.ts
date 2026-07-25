import { describe, expect, it, vi } from 'vitest';
import type { EcommerceApiPort } from '../../infrastructure/api/ports/ecommerce-api-port';
import { appBus } from '../../infrastructure/events/app-bus';
import { CatalogModel } from './CatalogModel';

describe('CatalogModel', () => {
  it('loads products and emits catalog reload event', async () => {
    const listProducts = vi.fn(async () => {
      return [
        {
          id: 'p-1',
          name: 'Item',
          description: 'Desc',
          category: 'Category',
          imageUrl: 'https://example.com/image.jpg',
          priceCents: 1000,
          currency: 'USD' as const,
          stock: 2,
        },
      ];
    });

    const api = {
      listProducts,
      getCart: vi.fn(),
      addToCart: vi.fn(),
      updateCartItem: vi.fn(),
      removeCartItem: vi.fn(),
      clearCart: vi.fn(),
      checkout: vi.fn(),
    } as unknown as EcommerceApiPort;

    const model = new CatalogModel(api);
    const listener = vi.fn();
    appBus.on('catalog:reloaded', listener);

    await model.fetchAll(true);

    expect(listProducts).toHaveBeenCalledTimes(1);
    expect(model.getCurrentData()).toHaveLength(1);
    expect(listener).toHaveBeenCalledWith(1);

    appBus.off('catalog:reloaded', listener);
    model.dispose();
  });
});
