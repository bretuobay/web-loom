import { declareContext } from '@web-loom/template-core';
import { defineComponent } from '@web-loom/view';
import type { AppContext } from '../app/context';

const page = declareContext<AppContext>();

export const checkout = defineComponent<AppContext>({
  name: 'checkout',
  template: page.compile(`<section class="checkout-panel">
  <div>
    <h2>
      Checkout
    </h2>
    <p>
      Submit a mock order. You can later swap the adapter to a real backend.
    </p>
  </div>
  <div class="checkout-summary">
    <p>
      <span>
        Items
      </span>
      <strong>
        {{ cart.itemCount }}
      </strong>
    </p>
    <p>
      <span>
        Total
      </span>
      <strong>
        {{ formatMoney(cart.subtotalCents) }}
      </strong>
    </p>
  </div>
  <label class="field-label" for="checkout-email">
    Email
  </label>
  <input id="checkout-email" class="text-input" bind:value="state.checkoutState$.values.email" bind:set="setCheckoutEmail"
      on:blur="touchCheckoutEmail"
      placeholder="you@example.com">
  {{#if state.checkoutState$.errors.email}}
    <p class="field-error">
      {{ state.checkoutState$.errors.email }}
    </p>
  {{/if}}
  <label class="field-label" for="checkout-address">
    Shipping Address
  </label>
  <textarea id="checkout-address" class="text-input text-area" bind:value="state.checkoutState$.values.shippingAddress" bind:set="setCheckoutAddress"
      on:blur="touchCheckoutAddress"
      placeholder="Street, city, state, zip">
  </textarea>
  {{#if state.checkoutState$.errors.shippingAddress}}
    <p class="field-error">
      {{ state.checkoutState$.errors.shippingAddress }}
    </p>
  {{/if}}
  <label class="field-label" for="checkout-notes">
    Notes (optional)
  </label>
  <textarea id="checkout-notes" class="text-input text-area" bind:value="state.checkoutState$.values.notes" bind:set="setCheckoutNotes"
      on:blur="touchCheckoutNotes"
      placeholder="Delivery instructions">
  </textarea>
  {{#if state.checkoutState$.errors.notes}}
    <p class="field-error">
      {{ state.checkoutState$.errors.notes }}
    </p>
  {{/if}}
  <button class="brand-btn" type="button" :disabled="cart.itemCount === 0" on:click="actions.submitCheckout">
    Place order
  </button>
</section>
`),
  setup({ actions }) {
    return {
      formatMoney: (value: unknown) => actions.formatMoney(value),
      setCheckoutEmail: (value: string) => actions.setCheckoutEmail(value),
      setCheckoutAddress: (value: string) => actions.setCheckoutAddress(value),
      setCheckoutNotes: (value: string) => actions.setCheckoutNotes(value),
      touchCheckoutEmail: () => actions.touchCheckoutField('email'),
      touchCheckoutAddress: () => actions.touchCheckoutField('shippingAddress'),
      touchCheckoutNotes: () => actions.touchCheckoutField('notes'),
    };
  },
});
