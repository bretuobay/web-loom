import type { EcommerceApiPort } from './ports/ecommerce-api-port';
import { MockEcommerceApiAdapter } from './adapters/mock-ecommerce-api-adapter';
import { HttpEcommerceApiAdapter } from './adapters/http-ecommerce-api-adapter';

type BackendMode = 'mock' | 'http';

function getBackendMode(): BackendMode {
  const mode = import.meta.env.VITE_ECOM_BACKEND_MODE as BackendMode | undefined;
  if (mode === 'http') {
    return 'http';
  }
  return 'mock';
}

export function createEcommerceApi(): EcommerceApiPort {
  const mode = getBackendMode();

  if (mode === 'http') {
    const baseUrl = import.meta.env.VITE_ECOM_API_BASE_URL || '';
    if (!baseUrl) {
      throw new Error('VITE_ECOM_API_BASE_URL must be configured when VITE_ECOM_BACKEND_MODE=http');
    }
    return new HttpEcommerceApiAdapter(baseUrl);
  }

  return new MockEcommerceApiAdapter();
}
