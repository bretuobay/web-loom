import type {
  CartDto,
  CatalogProductDto,
  CheckoutRequestDto,
  CheckoutResultDto,
  EcommerceApiPort,
} from '../ports/ecommerce-api-port';

export class HttpEcommerceApiAdapter implements EcommerceApiPort {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async listProducts(): Promise<CatalogProductDto[]> {
    return this.request<CatalogProductDto[]>('/products');
  }

  async getCart(): Promise<CartDto> {
    return this.request<CartDto>('/cart');
  }

  async addToCart(productId: string, quantity: number): Promise<CartDto> {
    return this.request<CartDto>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number): Promise<CartDto> {
    return this.request<CartDto>(`/cart/items/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(productId: string): Promise<CartDto> {
    return this.request<CartDto>(`/cart/items/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart(): Promise<CartDto> {
    return this.request<CartDto>('/cart', { method: 'DELETE' });
  }

  async checkout(request: CheckoutRequestDto): Promise<CheckoutResultDto> {
    return this.request<CheckoutResultDto>('/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const message = await this.getErrorMessage(response);
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  private async getErrorMessage(response: Response): Promise<string> {
    const fallback = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        return payload.message;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }
}
