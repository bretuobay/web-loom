import { declareContext } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { CartItemDto } from '../infrastructure/api/ports/ecommerce-api-port';

export interface CartDrawerProps {
  open: boolean;
  items: CartItemDto[];
  itemCount: number;
  subtotalCents: number;
  formatMoney: (value: unknown) => string;
  onClose: () => void;
  onUpdateQuantity: (item: CartItemDto, delta: number) => void;
  onRemove: (item: CartItemDto) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const card = declareContext<CartDrawerProps>();

export const cartDrawer = defineComponent<CartDrawerProps>({
  name: 'cart',
  props: [
    'open',
    'items',
    'itemCount',
    'subtotalCents',
    'formatMoney',
    'onClose',
    'onUpdateQuantity',
    'onRemove',
    'onClear',
    'onCheckout',
  ],
  template: card.compile(`{{#if open}}
  <div class="drawer-backdrop open" on:click="onClose">
  </div>
  <aside class="cart-drawer open">
    <div class="drawer-header">
      <h2>
        Cart
      </h2>
      <button class="ghost-btn" type="button" on:click="onClose">
        Close
      </button>
    </div>
    {{#if itemCount > 0}}
      <ul class="cart-items">
        {{#each items key=productId}}
          <li>
            <img :src="imageUrl" :alt="name" loading="lazy">
            <div>
              <h3>
                {{ name }}
              </h3>
              <p>
                {{ formatMoney(unitPriceCents) }}
              </p>
            </div>
            <div class="qty-controls">
              <button type="button" on:click="onUpdateQuantity(this, -1)" :aria-label="name">
                -
              </button>
              <span>
                {{ quantity }}
              </span>
              <button type="button" on:click="onUpdateQuantity(this, 1)" :aria-label="name">
                +
              </button>
            </div>
            <button class="text-btn" type="button" on:click="onRemove(this)">
              Remove
            </button>
          </li>
        {{/each}}
      </ul>
      {{else}}
      <div class="empty-card">
        Your cart is empty.
      </div>
    {{/if}}
    <footer class="drawer-footer">
      <p>
        <span>
          Items:
        </span>
        <strong>
          {{ itemCount }}
        </strong>
      </p>
      <p>
        <span>
          Subtotal:
        </span>
        <strong>
          {{ formatMoney(subtotalCents) }}
        </strong>
      </p>
      <div class="drawer-actions">
        <button class="ghost-btn" type="button" on:click="onClear">
          Clear cart
        </button>
        <button class="brand-btn" type="button" :disabled="itemCount === 0" on:click="onCheckout">
          Checkout
        </button>
      </div>
    </footer>
  </aside>
{{/if}}
`),
});
