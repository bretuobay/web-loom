import type { FormBehavior } from '@web-loom/ui-core';
import { useBehaviorState } from '../hooks/useBehaviorState';
import type { CartDto } from '../infrastructure/api/ports/ecommerce-api-port';
import type { CheckoutFormValues } from '../features/cart/CartViewModel';
import { formatMoney } from '../utils/money';

interface CheckoutPanelProps {
  cart: CartDto;
  checkoutForm: FormBehavior<CheckoutFormValues>;
  onSubmit: () => void;
}

export function CheckoutPanel({ cart, checkoutForm, onSubmit }: CheckoutPanelProps) {
  const state = useBehaviorState(checkoutForm);

  return (
    <section className="checkout-panel">
      <div>
        <h2>Checkout</h2>
        <p>Submit a mock order. You can later swap the adapter to a real backend.</p>
      </div>

      <div className="checkout-summary">
        <p>
          <span>Items</span>
          <strong>{cart.itemCount}</strong>
        </p>
        <p>
          <span>Total</span>
          <strong>{formatMoney(cart.subtotalCents)}</strong>
        </p>
      </div>

      <label htmlFor="checkout-email" className="field-label">
        Email
      </label>
      <input
        id="checkout-email"
        className="text-input"
        value={state.values.email}
        onChange={(event) => checkoutForm.actions.setFieldValue('email', event.target.value)}
        onBlur={() => checkoutForm.actions.setFieldTouched('email', true)}
        placeholder="you@example.com"
      />
      {state.errors.email ? <p className="field-error">{state.errors.email}</p> : null}

      <label htmlFor="checkout-address" className="field-label">
        Shipping Address
      </label>
      <textarea
        id="checkout-address"
        className="text-input text-area"
        value={state.values.shippingAddress}
        onChange={(event) => checkoutForm.actions.setFieldValue('shippingAddress', event.target.value)}
        onBlur={() => checkoutForm.actions.setFieldTouched('shippingAddress', true)}
        placeholder="Street, city, state, zip"
      />
      {state.errors.shippingAddress ? <p className="field-error">{state.errors.shippingAddress}</p> : null}

      <label htmlFor="checkout-notes" className="field-label">
        Notes (optional)
      </label>
      <textarea
        id="checkout-notes"
        className="text-input text-area"
        value={state.values.notes}
        onChange={(event) => checkoutForm.actions.setFieldValue('notes', event.target.value)}
        onBlur={() => checkoutForm.actions.setFieldTouched('notes', true)}
        placeholder="Delivery instructions"
      />
      {state.errors.notes ? <p className="field-error">{state.errors.notes}</p> : null}

      <button className="brand-btn" type="button" disabled={cart.itemCount === 0} onClick={onSubmit}>
        Place order
      </button>
    </section>
  );
}
