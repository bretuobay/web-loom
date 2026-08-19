import { declareContext } from '@web-loom/template-core';
import type { AppContext } from '../app/context';

const page = declareContext<AppContext>();

export const notFoundTemplate = page.compile(`<section class="checkout-panel">
  <h2>
    Page not found
  </h2>
  <p>
    No route matches this page.
  </p>
  <a href="/">
    Return to storefront
  </a>
</section>
`);
