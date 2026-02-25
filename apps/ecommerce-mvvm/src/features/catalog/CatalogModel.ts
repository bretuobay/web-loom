import { BaseModel } from '@web-loom/mvvm-core';
import { QueryCore, type EndpointState } from '@web-loom/query-core';
import type { CatalogProductDto, EcommerceApiPort } from '../../infrastructure/api/ports/ecommerce-api-port';
import { appBus } from '../../infrastructure/events/app-bus';

export class CatalogModel extends BaseModel<CatalogProductDto[], any> {
  private readonly query = new QueryCore({
    cacheProvider: 'localStorage',
    defaultRefetchAfter: 2 * 60 * 1000,
  });
  private queryUnsubscribe: (() => void) | null = null;
  private initialized = false;

  constructor(private readonly api: EcommerceApiPort) {
    super({ initialData: [] });
  }

  async fetchAll(forceRefetch = false): Promise<void> {
    await this.ensureInitialized();

    const state = this.query.getState<CatalogProductDto[]>('catalog:products:v3');
    if (state.isLoading) {
      await this.waitForIdle();
      await this.ensureCatalogPopulated();
      return;
    }

    const cachedList = state.data ?? [];
    const needsBootstrapFetch = cachedList.length === 0;
    await this.query.refetch('catalog:products:v3', forceRefetch || needsBootstrapFetch);
    await this.waitForIdle();
    await this.ensureCatalogPopulated();
  }

  async refresh(): Promise<void> {
    await this.ensureInitialized();
    await this.query.invalidate('catalog:products:v3');
    await this.query.refetch('catalog:products:v3', true);
    await this.waitForIdle();
    await this.ensureCatalogPopulated();
  }

  override dispose(): void {
    if (this.queryUnsubscribe) {
      this.queryUnsubscribe();
      this.queryUnsubscribe = null;
    }
    super.dispose();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.query.defineEndpoint('catalog:products:v3', async () => this.api.listProducts());

    this.queryUnsubscribe = this.query.subscribe<CatalogProductDto[]>('catalog:products:v3', (state) => {
      this.syncFromQueryState(state);
    });

    this.initialized = true;
  }

  private syncFromQueryState(state: EndpointState<CatalogProductDto[]>): void {
    this.setLoading(state.isLoading);
    if (state.error) {
      this.setError(state.error);
    } else {
      this.clearError();
    }

    if (state.data) {
      this.setData(state.data);
      appBus.emit('catalog:reloaded', state.data.length);
    }
  }

  private async waitForIdle(): Promise<void> {
    let state = this.query.getState<CatalogProductDto[]>('catalog:products:v3');
    while (state.isLoading) {
      await new Promise<void>((resolve) => setTimeout(resolve, 8));
      state = this.query.getState<CatalogProductDto[]>('catalog:products:v3');
    }
  }

  private async ensureCatalogPopulated(): Promise<void> {
    const current = this.getCurrentData() ?? [];
    if (current.length > 0) {
      return;
    }

    const products = await this.api.listProducts();
    this.setData(products);
    this.clearError();
    this.setLoading(false);
    appBus.emit('catalog:reloaded', products.length);
  }
}
