import { describe, expect, it } from 'vitest';
import { renderDocument, serializeInitialState } from './index.js';

describe('template-core Vite SSR helpers', () => {
  it('serializes state safely for an inert JSON script', () => {
    expect(serializeInitialState({ value: '</script><script>alert(1)</script>' })).toBe(
      '{"value":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}',
    );
  });

  it('injects head, HTML, and optional state into the document shell', () => {
    const html = renderDocument('<head><!--ssr-head--></head><main><!--ssr-outlet--></main>', {
      head: '<title>Storefront</title>',
      html: '<p>Products</p>',
      state: { products: 2 },
    });
    expect(html).toContain('<title>Storefront</title>');
    expect(html).toContain('<p>Products</p>');
    expect(html).toContain('__TEMPLATE_CORE_STATE__');
  });
});
