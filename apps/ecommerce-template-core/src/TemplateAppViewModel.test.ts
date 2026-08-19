import { createRouter, type Router } from '@web-loom/router-core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CartModel } from './features/cart/CartModel';
import { TemplateAppViewModel } from './TemplateAppViewModel';

function makeRouter(): Router {
  window.history.pushState({}, '', '/');
  return createRouter({ mode: 'history', routes: [{ path: '/' }, { path: '/checkout' }] });
}

describe('TemplateAppViewModel', () => {
  let router: Router | null = null;

  afterEach(() => {
    router?.destroy();
    router = null;
  });

  it('disposes its models on dispose, but leaves the router (owned by the caller) alone', () => {
    const api = createEcommerceApi();
    const catalogModel = new CatalogModel(api);
    const cartModel = new CartModel(api);
    const disposeCatalogModel = vi.spyOn(catalogModel, 'dispose');
    const disposeCartModel = vi.spyOn(cartModel, 'dispose');

    router = makeRouter();
    const disposeRouter = vi.spyOn(router, 'destroy');
    const viewModel = new TemplateAppViewModel(catalogModel, cartModel, router);

    viewModel.dispose();

    expect(disposeCatalogModel).toHaveBeenCalledOnce();
    expect(disposeCartModel).toHaveBeenCalledOnce();
    expect(disposeRouter).not.toHaveBeenCalled();
  });

  it('navigate() pushes through the injected router', async () => {
    const api = createEcommerceApi();
    router = makeRouter();
    const viewModel = new TemplateAppViewModel(new CatalogModel(api), new CartModel(api), router);

    await viewModel.navigate('/checkout');

    expect(router.currentRoute.path).toBe('/checkout');
    viewModel.dispose();
  });
});
