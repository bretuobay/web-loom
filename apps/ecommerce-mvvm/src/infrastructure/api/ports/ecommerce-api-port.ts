export type CurrencyCode = 'USD';

export interface CatalogProductDto {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  priceCents: number;
  currency: CurrencyCode;
  stock: number;
}

export interface CartItemDto {
  productId: string;
  name: string;
  imageUrl: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  currency: CurrencyCode;
}

export interface CartDto {
  items: CartItemDto[];
  itemCount: number;
  subtotalCents: number;
  currency: CurrencyCode;
}

export interface CheckoutRequestDto {
  email: string;
  shippingAddress: string;
  notes?: string;
}

export interface CheckoutResultDto {
  orderId: string;
  totalCents: number;
  currency: CurrencyCode;
  placedAtIso: string;
}

export interface EcommerceApiPort {
  listProducts(): Promise<CatalogProductDto[]>;
  getCart(): Promise<CartDto>;
  addToCart(productId: string, quantity: number): Promise<CartDto>;
  updateCartItem(productId: string, quantity: number): Promise<CartDto>;
  removeCartItem(productId: string): Promise<CartDto>;
  clearCart(): Promise<CartDto>;
  checkout(request: CheckoutRequestDto): Promise<CheckoutResultDto>;
}

export const emptyCart = (): CartDto => ({
  items: [],
  itemCount: 0,
  subtotalCents: 0,
  currency: 'USD',
});
