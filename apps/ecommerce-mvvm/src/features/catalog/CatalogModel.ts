import { BaseModel } from '@web-loom/mvvm-core';
import type { CatalogProductDto, EcommerceApiPort } from '../../infrastructure/api/ports/ecommerce-api-port';
import { appBus } from '../../infrastructure/events/app-bus';

export class CatalogModel extends BaseModel<CatalogProductDto[], any> {
  private inFlightLoad: Promise<void> | null = null;

  constructor(private readonly api: EcommerceApiPort) {
    super({ initialData: [] });
  }

  async fetchAll(_forceRefetch = false): Promise<void> {
    await this.loadProducts();
  }

  async refresh(): Promise<void> {
    await this.loadProducts();
  }

  override dispose(): void {
    super.dispose();
  }

  private async loadProducts(): Promise<void> {
    if (this.inFlightLoad) {
      await this.inFlightLoad;
      return;
    }

    this.inFlightLoad = (async () => {
      this.setLoading(true);
      this.clearError();

      try {
        const products = await this.api.listProducts();
        this.setData(products);
        appBus.emit('catalog:reloaded', products.length);
      } catch (error) {
        this.setError(error);
        if (!this.getCurrentData()) {
          this.setData([]);
        }
      } finally {
        this.setLoading(false);
        this.inFlightLoad = null;
      }
    })();

    await this.inFlightLoad;
  }
}
