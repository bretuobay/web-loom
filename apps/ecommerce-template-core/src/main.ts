import './app.css';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartModel } from './features/cart/CartModel';
import { CartViewModel } from './features/cart/CartViewModel';
import { TemplateAppViewModel } from './TemplateAppViewModel';
import { appTemplate } from './templates';

const container = document.getElementById('app');
if (!container) throw new Error('Template-core app container was not found.');

const api = createEcommerceApi();
const catalogModel = new CatalogModel(api);
const cartModel = new CartModel(api);
const catalogViewModel = new CatalogViewModel(catalogModel);
const cartViewModel = new CartViewModel(cartModel);
const appViewModel = new TemplateAppViewModel(catalogViewModel, cartViewModel);
const mountedView = appTemplate.mount(container, appViewModel);

void appViewModel.start();

function dispose(): void {
  mountedView.dispose();
  appViewModel.dispose();
}

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
