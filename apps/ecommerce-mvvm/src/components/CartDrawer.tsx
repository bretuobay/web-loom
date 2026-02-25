import type { CartDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { formatMoney } from '../utils/money';

interface CartDrawerProps {
  open: boolean;
  cart: CartDto;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartDrawer({
  open,
  cart,
  onClose,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCheckout,
}: CartDrawerProps) {
  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`cart-drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Cart</h2>
          <button className="ghost-btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="empty-card">Your cart is empty.</div>
        ) : (
          <ul className="cart-items">
            {cart.items.map((item) => (
              <li key={item.productId}>
                <img src={item.imageUrl} alt={item.name} loading="lazy" />
                <div>
                  <h3>{item.name}</h3>
                  <p>{formatMoney(item.unitPriceCents)}</p>
                </div>
                <div className="qty-controls">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, Math.max(item.quantity - 1, 0))}
                    aria-label={`Decrease quantity for ${item.name}`}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    aria-label={`Increase quantity for ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <button className="text-btn" type="button" onClick={() => onRemove(item.productId)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="drawer-footer">
          <p>
            <span>Items:</span>
            <strong>{cart.itemCount}</strong>
          </p>
          <p>
            <span>Subtotal:</span>
            <strong>{formatMoney(cart.subtotalCents)}</strong>
          </p>
          <div className="drawer-actions">
            <button className="ghost-btn" type="button" onClick={onClear}>
              Clear cart
            </button>
            <button className="brand-btn" type="button" onClick={onCheckout} disabled={cart.itemCount === 0}>
              Checkout
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
