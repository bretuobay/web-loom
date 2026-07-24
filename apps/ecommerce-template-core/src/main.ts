import './app.css';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CartModel } from './features/cart/CartModel';
import { TemplateAppViewModel } from './TemplateAppViewModel';
import { TemplateAppView } from './app/view';

const container = document.getElementById('app');
if (!container) throw new Error('Template-core app container was not found.');

const api = createEcommerceApi();
const appViewModel = new TemplateAppViewModel(new CatalogModel(api), new CartModel(api));
const mountedView = new TemplateAppView();
const mounted = mountedView.mount(container, appViewModel);

void appViewModel.start();

function dispose(): void {
  mounted.dispose();
  appViewModel.dispose();
}

if (import.meta.hot) {
  import.meta.hot.dispose(dispose);
}
