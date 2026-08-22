export const productCardTemplateSource = `
  <article class="product-card" class:selected="selected" on:click="onSelect(product)">
    <img :src="product.imageUrl" :alt="product.name" loading="lazy">
    <div class="product-content">
      <h3>{{ product.name }}</h3>
      <p class="product-category">{{ product.category }}</p>
      <p class="product-description">{{ product.description }}</p>
      <div class="product-row">
        <strong>{{ formatMoney(product.priceCents) }}</strong>
        <span>{{ product.stock }} in stock</span>
      </div>
      <button class="brand-btn" type="button" on:click.stop="onAdd(product)">Add to cart</button>
    </div>
  </article>
`;

export const storefrontTemplateSource = `
  <section class="product-browser">
    {{#if catalog.error$}}
      <p class="error-banner">{{ catalog.error$ }}</p>
    {{/if}}
    <div class="browser-toolbar">
      <div>
        <h2>Storefront</h2>
        <p>Browse products, inspect details, and add items to the cart.</p>
      </div>
      <button class="ghost-btn" type="button" on:click="actions.reloadProducts">Reload</button>
    </div>
    <label class="field-label" for="search-products">Search products</label>
    <input id="search-products" class="text-input" autocomplete="off"
      bind:value="catalog.searchQuery" use:focusSearch="focusSearch"
      placeholder="Search by name, category, or description">
    {{#if catalog.isLoading$}}
      <p class="status-line">Refreshing products...</p>
    {{/if}}
    <div class="browser-grid">
      <div class="product-list">
        {{#if catalog.filteredProducts.length > 0}}
          {{#each catalog.filteredProducts key=id}}{{> product-card product=this formatMoney=../formatMoney onSelect=../selectProduct onAdd=../addToCart selected=../catalog.selectedProduct.id === id}}{{/each}}
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
          <button class="brand-btn" type="button" on:click="actions.addSelectedToCart">Add selected item</button>
        {{else}}
          <div class="empty-card">Pick a product to view more details.</div>
        {{/if}}
      </aside>
    </div>
  </section>
`;
