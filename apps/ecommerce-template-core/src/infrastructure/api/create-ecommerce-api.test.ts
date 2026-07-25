import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEcommerceApi } from './create-ecommerce-api';
import { MockEcommerceApiAdapter } from './adapters/mock-ecommerce-api-adapter';
import { HttpEcommerceApiAdapter } from './adapters/http-ecommerce-api-adapter';

describe('createEcommerceApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to mock mode', () => {
    const api = createEcommerceApi();
    expect(api).toBeInstanceOf(MockEcommerceApiAdapter);
  });

  it('uses http adapter when explicitly configured', () => {
    vi.stubEnv('VITE_ECOM_BACKEND_MODE', 'http');
    vi.stubEnv('VITE_ECOM_API_BASE_URL', 'http://localhost:8787');

    const api = createEcommerceApi();

    expect(api).toBeInstanceOf(HttpEcommerceApiAdapter);
  });

  it('throws when http mode misses base url', () => {
    vi.stubEnv('VITE_ECOM_BACKEND_MODE', 'http');
    vi.stubEnv('VITE_ECOM_API_BASE_URL', '');

    expect(() => createEcommerceApi()).toThrow('VITE_ECOM_API_BASE_URL must be configured');
  });
});
