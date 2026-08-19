import './app.css';
import { createApp } from './app';
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

const app = createApp({ initialProducts: readInitialState().products });
void app.mount(appContainer, storefrontIsland);

if (import.meta.hot) import.meta.hot.dispose(() => app.unmount());
