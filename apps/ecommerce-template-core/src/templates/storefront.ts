import { compile } from '@web-loom/template-core';
import { productCardTemplateSource, storefrontTemplateSource } from './storefront-source';

export const productCardTemplate = compile(productCardTemplateSource);

export const storefrontTemplate = compile(storefrontTemplateSource, {
  partials: { 'product-card': productCardTemplate },
});
