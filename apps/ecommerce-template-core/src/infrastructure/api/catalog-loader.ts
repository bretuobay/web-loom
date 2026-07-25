import { PREGENERATED_MOCK_PRODUCTS } from './fixtures/pregenerated-mock-products';
import type { CatalogProductDto } from './ports/ecommerce-api-port';

/** Server-safe catalog source: no localStorage, timers, signals, or mutable shared state. */
export async function loadCatalogForRequest(): Promise<CatalogProductDto[]> {
  return PREGENERATED_MOCK_PRODUCTS.map((product) => ({ ...product }));
}
