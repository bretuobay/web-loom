import { declareContext } from '@web-loom/template-core';
import type { PartialContexts } from '@web-loom/template-core';
import type { AppContext } from '../app/context';
import type { CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { productCardTemplateSource, storefrontTemplateSource } from './storefront-source';

const card = declareContext<CatalogProductDto>();
export const productCardTemplate = card.compile(productCardTemplateSource);

const page = declareContext<AppContext>();

/** Partial context schema for storefront templates. */
export type StorefrontPartials = PartialContexts<{ 'product-card': CatalogProductDto }>;

export const storefrontTemplate = page.compile<StorefrontPartials>(storefrontTemplateSource, {
  partials: { 'product-card': productCardTemplate },
});
