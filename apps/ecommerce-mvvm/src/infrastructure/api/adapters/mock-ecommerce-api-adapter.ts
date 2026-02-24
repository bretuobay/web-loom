import {
  type CartDto,
  type CatalogProductDto,
  type CheckoutRequestDto,
  type CheckoutResultDto,
  type EcommerceApiPort,
  emptyCart,
} from '../ports/ecommerce-api-port';
import { PREGENERATED_MOCK_PRODUCTS } from '../fixtures/pregenerated-mock-products';

const DELAYS = {
  listProducts: 120,
  getCart: 80,
  addToCart: 100,
  updateCartItem: 100,
  removeCartItem: 100,
  clearCart: 100,
  checkout: 180,
} as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MockEcommerceApiAdapter implements EcommerceApiPort {
  private readonly products: CatalogProductDto[];
  private readonly cartQuantities = new Map<string, number>();
  private orderCounter = 1;

  constructor(products: CatalogProductDto[] = PREGENERATED_MOCK_PRODUCTS) {
    this.products = clone(products);
  }

  async listProducts(): Promise<CatalogProductDto[]> {
    await delay(DELAYS.listProducts);
    return clone(this.products);
  }

  async getCart(): Promise<CartDto> {
    await delay(DELAYS.getCart);
    return this.buildCart();
  }

  async addToCart(productId: string, quantity: number): Promise<CartDto> {
    await delay(DELAYS.addToCart);
    const product = this.requireProduct(productId);
    const normalized = Math.max(1, Math.floor(quantity));
    const current = this.cartQuantities.get(productId) ?? 0;
    const next = Math.min(current + normalized, product.stock);
    this.cartQuantities.set(productId, next);
    return this.buildCart();
  }

  async updateCartItem(productId: string, quantity: number): Promise<CartDto> {
    await delay(DELAYS.updateCartItem);
    const product = this.requireProduct(productId);
    const normalized = Math.max(0, Math.floor(quantity));

    if (normalized === 0) {
      this.cartQuantities.delete(productId);
      return this.buildCart();
    }

    this.cartQuantities.set(productId, Math.min(normalized, product.stock));
    return this.buildCart();
  }

  async removeCartItem(productId: string): Promise<CartDto> {
    await delay(DELAYS.removeCartItem);
    this.cartQuantities.delete(productId);
    return this.buildCart();
  }

  async clearCart(): Promise<CartDto> {
    await delay(DELAYS.clearCart);
    this.cartQuantities.clear();
    return this.buildCart();
  }

  async checkout(request: CheckoutRequestDto): Promise<CheckoutResultDto> {
    await delay(DELAYS.checkout);
    const cart = this.buildCart();

    if (!request.email.trim() || !request.shippingAddress.trim()) {
      throw new Error('Checkout form is incomplete.');
    }

    if (cart.itemCount === 0) {
      throw new Error('Cannot checkout with an empty cart.');
    }

    const result: CheckoutResultDto = {
      orderId: `MOCK-ORDER-${String(this.orderCounter).padStart(4, '0')}`,
      totalCents: cart.subtotalCents,
      currency: cart.currency,
      placedAtIso: new Date().toISOString(),
    };

    this.orderCounter += 1;
    this.cartQuantities.clear();

    return result;
  }

  private requireProduct(productId: string): CatalogProductDto {
    const product = this.products.find((item) => item.id === productId);
    if (!product) {
      throw new Error(`Product ${productId} was not found.`);
    }
    return product;
  }

  private buildCart(): CartDto {
    if (this.cartQuantities.size === 0) {
      return emptyCart();
    }

    let subtotalCents = 0;
    let itemCount = 0;

    const items = Array.from(this.cartQuantities.entries())
      .map(([productId, quantity]) => {
        const product = this.requireProduct(productId);
        const lineTotalCents = product.priceCents * quantity;

        subtotalCents += lineTotalCents;
        itemCount += quantity;

        return {
          productId,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPriceCents: product.priceCents,
          quantity,
          lineTotalCents,
          currency: product.currency,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      items,
      itemCount,
      subtotalCents,
      currency: 'USD',
    };
  }
}
