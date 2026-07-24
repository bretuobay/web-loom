import { compile } from '@web-loom/template-core';

export const headerTemplate = compile(`
  <header class="app-header">
    <div class="brand-block">
      <p class="brand-kicker">Web Loom Commerce · Template Core</p>
      <h1>Loom Market</h1>
    </div>
    <nav class="header-nav" aria-label="Primary navigation">
      <a href="/" on:click="navigateFromClick">Storefront</a>
      <a href="/checkout" on:click="navigateFromClick">Checkout</a>
    </nav>
    <div class="header-actions">
      <button class="ghost-btn" type="button" on:click="actions.openPalette">Command Menu</button>
      <button class="ghost-btn" type="button" on:click="actions.toggleTheme">
        {{#if state.theme$ === "light"}}Dark{{else}}Light{{/if}} Theme
      </button>
      <button class="brand-btn" type="button" on:click="actions.openCart">Cart ({{ cart.itemCount }})</button>
    </div>
  </header>
`);
