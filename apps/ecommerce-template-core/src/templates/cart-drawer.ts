import { compile } from '@web-loom/template-core';

export const cartDrawerTemplate = compile(`
  {{#if state.cartOpen$}}
    <div class="drawer-backdrop open" on:click="actions.closeCart"></div>
    <aside class="cart-drawer open">
      <div class="drawer-header"><h2>Cart</h2><button class="ghost-btn" type="button" on:click="actions.closeCart">Close</button></div>
      {{#if cart.itemCount > 0}}
        <ul class="cart-items">
          {{#each cart.items key=productId}}
            <li data-product-id="{{ productId }}">
              <img :src="imageUrl" :alt="name" loading="lazy">
              <div><h3>{{ name }}</h3><p>{{ formatMoney(unitPriceCents) }}</p></div>
              <div class="qty-controls">
                <button type="button" data-quantity-delta="-1" on:click="updateQuantity" :aria-label="name">-</button>
                <span>{{ quantity }}</span>
                <button type="button" data-quantity-delta="1" on:click="updateQuantity" :aria-label="name">+</button>
              </div>
              <button class="text-btn" type="button" on:click="removeItem">Remove</button>
            </li>
          {{/each}}
        </ul>
      {{else}}
        <div class="empty-card">Your cart is empty.</div>
      {{/if}}
      <footer class="drawer-footer">
        <p><span>Items:</span><strong>{{ cart.itemCount }}</strong></p>
        <p><span>Subtotal:</span><strong>{{ formatMoney(cart.subtotalCents) }}</strong></p>
        <div class="drawer-actions">
          <button class="ghost-btn" type="button" on:click="actions.clearCart">Clear cart</button>
          <button class="brand-btn" type="button" :disabled="cart.itemCount === 0" on:click="actions.goToCheckout">Checkout</button>
        </div>
      </footer>
    </aside>
  {{/if}}
`);
