import './app.css';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CartModel } from './features/cart/CartModel';
import { TemplateAppViewModel } from './TemplateAppViewModel';
import { TemplateAppView } from './app/view';
import type { CatalogProductDto } from './infrastructure/api/ports/ecommerce-api-port';

function readInitialState(): { products: CatalogProductDto[] } {
  const element = document.getElementById('__TEMPLATE_CORE_STATE__');
  if (!element?.textContent) return { products: [] };
  try {
    const state = JSON.parse(element.textContent) as { products?: CatalogProductDto[] };
    return { products: Array.isArray(state.products) ? state.products : [] };
  } catch {
    return { products: [] };
  }
}

const appContainer = document.getElementById('app');
const storefrontIsland = document.getElementById('storefront-island');
if (!appContainer || !storefrontIsland) throw new Error('The SSR application slots were not found.');

const initialState = readInitialState();
const api = createEcommerceApi();
const appViewModel = new TemplateAppViewModel(new CatalogModel(api, initialState.products), new CartModel(api));
const mountedView = new TemplateAppView();
const mounted = mountedView.mount(appContainer, appViewModel, storefrontIsland);

void appViewModel.start();

function dispose(): void {
  mounted.dispose();
  appViewModel.dispose();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
