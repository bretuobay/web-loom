import { describe, expect, it } from 'vitest';
import { render } from './entry-server';
import { createApp } from './app';
import type { CatalogProductDto } from './infrastructure/api/ports/ecommerce-api-port';

describe('ecommerce SSR storefront island', () => {
  it('renders catalog HTML and a client-hydratable initial state payload', async () => {
    const result = await render({ url: '/', method: 'GET', headers: {} });
    expect(result.html).toContain('class="product-card"');
    expect(result.html).not.toContain('on:click');
    expect(result.state).toHaveProperty('products');
  });

  it('hydrates the SSR catalog while preserving existing product nodes', async () => {
    const result = await render({ url: '/', method: 'GET', headers: {} });
    const products = (result.state as { products: CatalogProductDto[] }).products;
    const app = document.createElement('div');
    const island = document.createElement('main');
    island.innerHTML = result.html;
    document.body.append(app, island);

    const existingCards = Array.from(island.querySelectorAll('.product-card'));
    const clientApp = createApp({ initialProducts: products });
    await clientApp.mount(app, island);

    expect(Array.from(island.querySelectorAll('.product-card'))).toEqual(existingCards);
    clientApp.unmount();
    app.remove();
    island.remove();
  });
});
