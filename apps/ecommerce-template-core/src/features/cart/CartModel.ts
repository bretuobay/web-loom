import { BaseModel } from '@web-loom/mvvm-core';
import type {
  CartDto,
  CheckoutRequestDto,
  CheckoutResultDto,
  EcommerceApiPort,
} from '../../infrastructure/api/ports/ecommerce-api-port';
import { emptyCart } from '../../infrastructure/api/ports/ecommerce-api-port';
import { appBus } from '../../infrastructure/events/app-bus';

export class CartModel extends BaseModel<CartDto, any> {
  constructor(private readonly api: EcommerceApiPort) {
    super({ initialData: emptyCart() });
  }

  async fetchCart(): Promise<void> {
    this.setLoading(true);
    this.clearError();
    try {
      const cart = await this.api.getCart();
      this.applyCart(cart);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async addToCart(productId: string, quantity: number): Promise<void> {
    this.setLoading(true);
    this.clearError();
    try {
      const cart = await this.api.addToCart(productId, quantity);
      this.applyCart(cart);
      appBus.emit('cart:item-added', productId, quantity);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async updateCartItem(productId: string, quantity: number): Promise<void> {
    this.setLoading(true);
    this.clearError();
    try {
      const cart = await this.api.updateCartItem(productId, quantity);
      this.applyCart(cart);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async removeCartItem(productId: string): Promise<void> {
    this.setLoading(true);
    this.clearError();
    try {
      const cart = await this.api.removeCartItem(productId);
      this.applyCart(cart);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async clearCart(): Promise<void> {
    this.setLoading(true);
    this.clearError();
    try {
      const cart = await this.api.clearCart();
      this.applyCart(cart);
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  async checkout(request: CheckoutRequestDto): Promise<CheckoutResultDto> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await this.api.checkout(request);
      const cart = await this.api.getCart();
      this.applyCart(cart);
      appBus.emit('checkout:completed', result.orderId, result.totalCents);
      return result;
    } catch (error) {
      this.setError(error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private applyCart(cart: CartDto): void {
    this.setData(cart);
    appBus.emit('cart:updated', cart.itemCount, cart.subtotalCents);
  }
}
