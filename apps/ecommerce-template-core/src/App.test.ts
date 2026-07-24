import { fireEvent, waitFor } from '@testing-library/dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartModel } from './features/cart/CartModel';
import { CartViewModel } from './features/cart/CartViewModel';
import { TemplateAppViewModel } from './TemplateAppViewModel';
import { appTemplate } from './templates';

function mountApp() {
  const container = document.createElement('div');
  document.body.append(container);
  const api = createEcommerceApi();
  const catalogModel = new CatalogModel(api);
  const cartModel = new CartModel(api);
  const catalogViewModel = new CatalogViewModel(catalogModel);
  const cartViewModel = new CartViewModel(cartModel);
  const appViewModel = new TemplateAppViewModel(catalogViewModel, cartViewModel);
  const view = appTemplate.mount(container, appViewModel);
  const ready = appViewModel.start();

  return {
    container,
    ready,
    view,
    appViewModel,
  };
}

describe('template-core ecommerce demo', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders the catalog and drives search and cart actions through templates', async () => {
    const app = mountApp();
    await app.ready;
    await waitFor(() => expect(app.container.querySelectorAll('.product-card').length).toBeGreaterThan(0));

    const search = app.container.querySelector<HTMLInputElement>('#search-products');
    expect(search).not.toBeNull();
    fireEvent.input(search!, { target: { value: 'nonexistent product' } });
    await waitFor(() => expect(app.container.textContent).toContain('No products found for this search.'));

    fireEvent.input(search!, { target: { value: '' } });
    const addButton = app.container.querySelector<HTMLButtonElement>('.product-card .brand-btn');
    expect(addButton).not.toBeNull();
    fireEvent.click(addButton!);
    await waitFor(() => expect(app.container.querySelector('.header-actions .brand-btn')?.textContent).toContain('Cart (1)'));

    fireEvent.click(app.container.querySelector('.header-actions .brand-btn')!);
    expect(app.container.querySelector('.cart-drawer')).not.toBeNull();
    await waitFor(() => expect(app.container.querySelector('.toast-item')?.textContent).toMatch(/added to cart|Added/));

    app.view.dispose();
    app.appViewModel.dispose();
    app.container.remove();
  });

  it('navigates to checkout and disposes reactive bindings', async () => {
    const app = mountApp();
    await app.ready;
    await waitFor(() => expect(app.container.querySelector('.product-card')).not.toBeNull());

    fireEvent.click(app.container.querySelector<HTMLAnchorElement>('a[href="/checkout"]')!);
    await waitFor(() => expect(app.appViewModel.route$.get()).toBe('/checkout'));
    expect(app.container.querySelector('.checkout-panel h2')?.textContent).toBe('Checkout');

    const beforeDispose = app.container.textContent;
    app.view.dispose();
    app.appViewModel.dispose();
    app.appViewModel.route$.set('/');
    expect(beforeDispose).toContain('Checkout');
    expect(app.container.textContent).toBe('');
    app.container.remove();
  });
});
