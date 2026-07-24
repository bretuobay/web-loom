import { compile } from '@web-loom/template-core';

export const appTemplate = compile(`
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-block">
        <p class="brand-kicker">Web Loom Commerce · Template Core</p>
        <h1>Loom Market</h1>
      </div>
      <nav class="header-nav" aria-label="Primary navigation">
        <a href="/" on:click="navigateFromClick($event, '/')">Storefront</a>
        <a href="/checkout" on:click="navigateFromClick($event, '/checkout')">Checkout</a>
      </nav>
      <div class="header-actions">
        <button class="ghost-btn" type="button" on:click="openPalette">Command Menu</button>
        <button class="ghost-btn" type="button" on:click="toggleTheme">
          {{#if theme$ === "light"}}Dark{{else}}Light{{/if}} Theme
        </button>
        <button class="brand-btn" type="button" on:click="openCart">Cart ({{ cart.itemCount }})</button>
      </div>
    </header>

    {{#if catalog.error$}}
      <p class="error-banner">{{ catalog.error$ }}</p>
    {{/if}}

    {{#if route$ === "/"}}
      <section class="product-browser">
        <div class="browser-toolbar">
          <div>
            <h2>Storefront</h2>
            <p>Browse products, inspect details, and add items to the cart.</p>
          </div>
          <button class="ghost-btn" type="button" on:click="reloadProducts">Reload</button>
        </div>

        <label class="field-label" for="search-products">Search products</label>
        <input id="search-products" class="text-input" autocomplete="off"
          :value="catalog.searchQuery" on:input="setSearchQuery($event.target.value)"
          placeholder="Search by name, category, or description">

        {{#if catalog.isLoading$}}
          <p class="status-line">Refreshing products...</p>
        {{/if}}

        <div class="browser-grid">
          <div class="product-list">
            {{#if catalog.filteredProducts.length > 0}}
              {{#each catalog.filteredProducts key=id}}
                <article class="product-card" class:selected="../catalog.selectedProduct.id === id"
                  on:click="selectProduct(this)">
                  <img :src="imageUrl" :alt="name" loading="lazy">
                  <div class="product-content">
                    <h3>{{ name }}</h3>
                    <p class="product-category">{{ category }}</p>
                    <p class="product-description">{{ description }}</p>
                    <div class="product-row">
                      <strong>{{ formatMoney(priceCents) }}</strong>
                      <span>{{ stock }} in stock</span>
                    </div>
                    <button class="brand-btn" type="button" on:click="addToCart(this)">Add to cart</button>
                  </div>
                </article>
              {{else}}
                <div class="empty-card">No products found for this search.</div>
              {{/each}}
            {{else}}
              {{#if catalog.searchQuery}}
                <div class="empty-card">No products found for this search.</div>
              {{else}}
                <div class="empty-card">No products available right now.</div>
              {{/if}}
            {{/if}}
          </div>

          <aside class="product-detail">
            {{#if catalog.selectedProduct}}
              <h3>{{ catalog.selectedProduct.name }}</h3>
              <img :src="catalog.selectedProduct.imageUrl" :alt="catalog.selectedProduct.name" loading="lazy">
              <p>{{ catalog.selectedProduct.description }}</p>
              <dl>
                <div><dt>Category</dt><dd>{{ catalog.selectedProduct.category }}</dd></div>
                <div><dt>Price</dt><dd>{{ formatMoney(catalog.selectedProduct.priceCents) }}</dd></div>
                <div><dt>Stock</dt><dd>{{ catalog.selectedProduct.stock }}</dd></div>
              </dl>
              <button class="brand-btn" type="button" on:click="addSelectedToCart">Add selected item</button>
            {{else}}
              <div class="empty-card">Pick a product to view more details.</div>
            {{/if}}
          </aside>
        </div>
      </section>
    {{else if route$ === "/checkout"}}
      <section class="checkout-panel">
        <div>
          <h2>Checkout</h2>
          <p>Submit a mock order. You can later swap the adapter to a real backend.</p>
        </div>
        <div class="checkout-summary">
          <p><span>Items</span><strong>{{ cart.itemCount }}</strong></p>
          <p><span>Total</span><strong>{{ formatMoney(cart.subtotalCents) }}</strong></p>
        </div>
        <label class="field-label" for="checkout-email">Email</label>
        <input id="checkout-email" class="text-input" :value="checkoutState$.values.email"
          on:input="setCheckoutEmail($event.target.value)" on:blur="touchCheckoutField('email')"
          placeholder="you@example.com">
        {{#if checkoutState$.errors.email}}<p class="field-error">{{ checkoutState$.errors.email }}</p>{{/if}}
        <label class="field-label" for="checkout-address">Shipping Address</label>
        <textarea id="checkout-address" class="text-input text-area" :value="checkoutState$.values.shippingAddress"
          on:input="setCheckoutAddress($event.target.value)" on:blur="touchCheckoutField('shippingAddress')"
          placeholder="Street, city, state, zip"></textarea>
        {{#if checkoutState$.errors.shippingAddress}}<p class="field-error">{{ checkoutState$.errors.shippingAddress }}</p>{{/if}}
        <label class="field-label" for="checkout-notes">Notes (optional)</label>
        <textarea id="checkout-notes" class="text-input text-area" :value="checkoutState$.values.notes"
          on:input="setCheckoutNotes($event.target.value)" on:blur="touchCheckoutField('notes')"
          placeholder="Delivery instructions"></textarea>
        {{#if checkoutState$.errors.notes}}<p class="field-error">{{ checkoutState$.errors.notes }}</p>{{/if}}
        <button class="brand-btn" type="button" :disabled="cart.itemCount === 0" on:click="submitCheckout">Place order</button>
      </section>
    {{else}}
      <section class="checkout-panel"><h2>Page not found</h2><p>No route matches this page.</p><a href="/">Return to storefront</a></section>
    {{/if}}

    {{#if cartOpen$}}
      <div class="drawer-backdrop open" on:click="closeCart"></div>
      <aside class="cart-drawer open">
        <div class="drawer-header"><h2>Cart</h2><button class="ghost-btn" type="button" on:click="closeCart">Close</button></div>
        {{#if cart.itemCount > 0}}
          <ul class="cart-items">
            {{#each cart.items key=productId}}
              <li>
                <img :src="imageUrl" :alt="name" loading="lazy">
                <div><h3>{{ name }}</h3><p>{{ formatMoney(unitPriceCents) }}</p></div>
                <div class="qty-controls">
                  <button type="button" on:click="updateQuantity(this, -1)" :aria-label="name">-</button>
                  <span>{{ quantity }}</span>
                  <button type="button" on:click="updateQuantity(this, 1)" :aria-label="name">+</button>
                </div>
                <button class="text-btn" type="button" on:click="removeItem(this)">Remove</button>
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
            <button class="ghost-btn" type="button" on:click="clearCart">Clear cart</button>
            <button class="brand-btn" type="button" :disabled="cart.itemCount === 0" on:click="goToCheckout">Checkout</button>
          </div>
        </footer>
      </aside>
    {{/if}}

    {{#if paletteState$.isOpen}}
      <div class="palette-backdrop" on:click="closePalette">
        <div class="palette-dialog" on:click="stopEvent">
          <input class="palette-input" autofocus :value="paletteState$.query"
            on:input="setPaletteQuery($event.target.value)" on:keydown="handlePaletteKey($event)"
            placeholder="Type a command">
          <ul class="palette-list">
            {{#if paletteState$.filteredCommands.length > 0}}
              {{#each paletteState$.filteredCommands key=id}}
                <li><button class="palette-item" class:active="../paletteState$.selectedIndex === @index" type="button"
                  on:click="executePaletteCommand(id)"><span>{{ label }}</span><small>{{ category }}</small></button></li>
              {{else}}
                <li class="palette-empty">No commands found.</li>
              {{/each}}
            {{else}}
              <li class="palette-empty">No commands found.</li>
            {{/if}}
          </ul>
        </div>
      </div>
    {{/if}}

    {{#if pendingConfirmation$}}
      <div class="dialog-backdrop" on:click="cancelPending">
        <section class="dialog-card" role="dialog" aria-modal="true" on:click="stopEvent">
          <h3>{{ pendingConfirmation$.context.title }}</h3>
          <p>{{ pendingConfirmation$.context.content }}</p>
          <div class="dialog-actions">
            <button type="button" class="ghost-btn" on:click="cancelPending">{{ pendingConfirmation$.context.cancelText }}</button>
            <button type="button" class="brand-btn" on:click="confirmPending">{{ pendingConfirmation$.context.confirmText }}</button>
          </div>
        </section>
      </div>
    {{/if}}

    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div class="toast-item">{{ toastMessage$ }}</div>
    </div>
  </div>
`);
