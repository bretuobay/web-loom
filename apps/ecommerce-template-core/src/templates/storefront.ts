import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';
import type { CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { productCardTemplateSource, storefrontTemplateSource } from './storefront-source';

export interface ProductCardProps {
  product: CatalogProductDto;
  formatMoney: (value: unknown) => string;
  onSelect: (product: CatalogProductDto) => void;
  onAdd: (product: CatalogProductDto) => void;
  selected: boolean;
}

const card = declareContext<ProductCardProps>();
export const productCard = defineComponent<ProductCardProps>({
  name: 'product-card',
  props: ['product', 'formatMoney', 'onSelect', 'onAdd', 'selected'],
  template: card.compile(productCardTemplateSource),
});

const page = declareContext<AppContext>();

/** Partial context schema for storefront templates. */
export type StorefrontPartials = PartialContexts<{ 'product-card': ProductCardProps }>;

export const storefrontTemplate = page.compile<StorefrontPartials>(storefrontTemplateSource, {
  partials: { 'product-card': productCard },
});
