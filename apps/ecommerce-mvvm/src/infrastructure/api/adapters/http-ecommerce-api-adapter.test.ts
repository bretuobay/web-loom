import { describe, expect, it, vi } from 'vitest';
import type { EcommerceApiPort } from '../ports/ecommerce-api-port';
import { HttpEcommerceApiAdapter } from './http-ecommerce-api-adapter';

function assertPortContract(api: EcommerceApiPort): void {
  expect(typeof api.listProducts).toBe('function');
  expect(typeof api.getCart).toBe('function');
  expect(typeof api.addToCart).toBe('function');
  expect(typeof api.updateCartItem).toBe('function');
  expect(typeof api.removeCartItem).toBe('function');
  expect(typeof api.clearCart).toBe('function');
  expect(typeof api.checkout).toBe('function');
}

describe('HttpEcommerceApiAdapter', () => {
  it('satisfies the EcommerceApiPort contract', () => {
    const api = new HttpEcommerceApiAdapter('http://localhost:3000');
    assertPortContract(api);
  });

  it('maps endpoints and payloads correctly', async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/products')) {
        return new Response(JSON.stringify([{ id: '1' }]), { status: 200 });
      }

      if (url.endsWith('/cart') && (!init?.method || init.method === 'GET')) {
        return new Response(JSON.stringify({ items: [], itemCount: 0, subtotalCents: 0, currency: 'USD' }), {
          status: 200,
        });
      }

      if (url.endsWith('/cart/items') && init?.method === 'POST') {
        return new Response(JSON.stringify({ items: [], itemCount: 1, subtotalCents: 12900, currency: 'USD' }), {
          status: 200,
        });
      }

      if (url.includes('/cart/items/') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ items: [], itemCount: 2, subtotalCents: 25800, currency: 'USD' }), {
          status: 200,
        });
      }

      if (url.includes('/cart/items/') && init?.method === 'DELETE') {
        return new Response(JSON.stringify({ items: [], itemCount: 0, subtotalCents: 0, currency: 'USD' }), {
          status: 200,
        });
      }

      if (url.endsWith('/cart') && init?.method === 'DELETE') {
        return new Response(JSON.stringify({ items: [], itemCount: 0, subtotalCents: 0, currency: 'USD' }), {
          status: 200,
        });
      }

      if (url.endsWith('/checkout')) {
        return new Response(
          JSON.stringify({ orderId: 'ORDER-1', totalCents: 12900, currency: 'USD', placedAtIso: new Date().toISOString() }),
          { status: 200 },
        );
      }

      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
    });

    const api = new HttpEcommerceApiAdapter('http://localhost:3000', mockFetch as typeof fetch);

    await api.listProducts();
    await api.getCart();
    await api.addToCart('p-1', 1);
    await api.updateCartItem('p-1', 2);
    await api.removeCartItem('p-1');
    await api.clearCart();
    await api.checkout({ email: 'test@example.com', shippingAddress: '123 Main Street', notes: '' });

    expect(mockFetch).toHaveBeenCalledTimes(7);
    const secondInit = mockFetch.mock.calls[2]?.[1];
    expect(secondInit?.method).toBe('POST');
  });

  it('surfaces server error messages', async () => {
    const mockFetch = vi.fn(async () => {
      return new Response(JSON.stringify({ message: 'Checkout failed' }), { status: 400 });
    });

    const api = new HttpEcommerceApiAdapter('http://localhost:3000', mockFetch as typeof fetch);

    await expect(api.checkout({ email: 'a@b.com', shippingAddress: 'x', notes: '' })).rejects.toThrow('Checkout failed');
  });
});
