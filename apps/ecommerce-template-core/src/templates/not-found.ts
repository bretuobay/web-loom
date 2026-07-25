import { compile } from '@web-loom/template-core';

export const notFoundTemplate = compile(`
  <section class="checkout-panel">
    <h2>Page not found</h2>
    <p>No route matches this page.</p>
    <a href="/">Return to storefront</a>
  </section>
`);
