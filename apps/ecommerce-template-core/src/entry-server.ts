import { compile } from '@web-loom/template-core/ssr';
import { loadCatalogForRequest } from './infrastructure/api/catalog-loader';
import { formatMoney } from './utils/money';
import { productCardTemplateSource, storefrontTemplateSource } from './templates/storefront-source';
import type { SsrRenderResult, SsrRequest } from '../../../packages/template-core-vite-ssr/src';

const storefrontServerTemplate = compile(storefrontTemplateSource, {
  name: 'storefront-ssr',
  helpers: { formatMoney: (value: unknown) => formatMoney(Number(value)) },
  partials: { 'product-card': productCardTemplateSource },
});

export async function render(_request: SsrRequest): Promise<SsrRenderResult> {
  const products = await loadCatalogForRequest();
  return {
    head: '<title>Loom Market · SSR Storefront</title>',
    html: storefrontServerTemplate.renderToString({
      catalog: {
        error$: null,
        isLoading$: false,
        filteredProducts: products,
        selectedProduct: null,
        searchQuery: '',
      },
      formatMoney,
    }),
    state: { products },
  };
}
