import { Command } from '@web-loom/mvvm-core';
import { ActiveAwareViewModel, ConfirmationRequest, NotificationRequest } from '@web-loom/mvvm-patterns';
import { computed, signal, type ReadonlySignal } from '@web-loom/signals-core';
import { createFormBehavior, type FormBehavior } from '@web-loom/ui-core';
import type { CartDto, CheckoutRequestDto } from '../../infrastructure/api/ports/ecommerce-api-port';
import { emptyCart } from '../../infrastructure/api/ports/ecommerce-api-port';
import { CartModel } from './CartModel';

export interface AddToCartInput {
  productId: string;
  quantity?: number;
}

export interface UpdateCartQuantityInput {
  productId: string;
  quantity: number;
}

export interface CheckoutFormValues {
  email: string;
  shippingAddress: string;
  notes: string;
}

export class CartViewModel extends ActiveAwareViewModel<CartModel> {
  private readonly cartState = signal<CartDto>(emptyCart());

  readonly cart: ReadonlySignal<CartDto> = this.cartState.asReadonly();
  readonly itemCount = computed(() => this.cartState.get().itemCount);
  readonly subtotalCents = computed(() => this.cartState.get().subtotalCents);

  readonly confirmClearCart = new ConfirmationRequest();
  readonly confirmCheckout = new ConfirmationRequest();
  readonly notifications = new NotificationRequest();

  readonly checkoutForm: FormBehavior<CheckoutFormValues> = createFormBehavior<CheckoutFormValues>({
    initialValues: {
      email: '',
      shippingAddress: '',
      notes: '',
    },
    fields: {
      email: {
        validate: (value) => {
          if (!value.trim()) return 'Email is required.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
          return null;
        },
      },
      shippingAddress: {
        validate: (value) => {
          if (!value.trim()) return 'Shipping address is required.';
          if (value.trim().length < 12) return 'Shipping address should be at least 12 characters.';
          return null;
        },
      },
      notes: {
        validate: (value) => {
          if (value.length > 300) return 'Notes must not exceed 300 characters.';
          return null;
        },
      },
    },
    validateOnBlur: true,
    validateOnChange: false,
  });

  readonly loadCartCommand = this.registerCommand(
    new Command(async () => {
      await this.model.fetchCart();
    }),
  );

  readonly addToCartCommand = this.registerCommand(
    new Command(async ({ productId, quantity = 1 }: AddToCartInput) => {
      await this.model.addToCart(productId, quantity);
      this.notifications.raise({
        content: 'Item added to cart.',
      });
    }),
  );

  readonly updateQuantityCommand = this.registerCommand(
    new Command(async ({ productId, quantity }: UpdateCartQuantityInput) => {
      await this.model.updateCartItem(productId, quantity);
    }),
  );

  readonly removeItemCommand = this.registerCommand(
    new Command(async (productId: string) => {
      await this.model.removeCartItem(productId);
      this.notifications.raise({
        content: 'Item removed from cart.',
      });
    }),
  );

  readonly clearCartCommand = this.registerCommand(
    new Command(async () => {
      if (this.cartState.get().itemCount === 0) {
        this.notifications.raise({ content: 'Cart is already empty.' });
        return;
      }

      const confirmation = await this.confirmClearCart.raiseAsync({
        title: 'Clear Cart',
        content: 'Remove all items from your cart?',
        confirmText: 'Clear cart',
        cancelText: 'Keep items',
      });

      if (!confirmation.confirmed) {
        return;
      }

      await this.model.clearCart();
      this.notifications.raise({ content: 'Cart cleared.' });
    }),
  );

  readonly checkoutCommand = this.registerCommand(
    new Command(async (request?: CheckoutRequestDto) => {
      if (request) {
        this.checkoutForm.actions.setFieldValue('email', request.email);
        this.checkoutForm.actions.setFieldValue('shippingAddress', request.shippingAddress);
        this.checkoutForm.actions.setFieldValue('notes', request.notes ?? '');
      }

      const isValid = await this.checkoutForm.actions.validateForm();
      if (!isValid) {
        this.notifications.raise({ content: 'Complete the checkout form before placing your order.' });
        return;
      }

      const confirmation = await this.confirmCheckout.raiseAsync({
        title: 'Place Order',
        content: 'Confirm checkout with the current cart items?',
        confirmText: 'Place order',
        cancelText: 'Review cart',
      });

      if (!confirmation.confirmed) {
        return;
      }

      const values = this.checkoutForm.getState().values;
      const result = await this.model.checkout({
        email: values.email,
        shippingAddress: values.shippingAddress,
        notes: values.notes,
      });

      this.checkoutForm.actions.resetForm();

      this.notifications.raise({
        content: `Order ${result.orderId} placed successfully.`,
      });
    }),
  );

  constructor(model: CartModel) {
    super(model);

    this.addSubscription(
      this.model.data$.subscribe((cart) => {
        this.cartState.set(cart ?? emptyCart());
      }),
    );
  }

  protected override onIsActiveChanged(isActive: boolean, _wasActive: boolean): void {
    if (isActive) {
      void this.loadCartCommand.execute();
    }
  }

  override dispose(): void {
    this.confirmClearCart.dispose();
    this.confirmCheckout.dispose();
    this.notifications.dispose();
    this.checkoutForm.destroy();
    super.dispose();
  }
}
