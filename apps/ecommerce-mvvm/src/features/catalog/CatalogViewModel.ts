import { Command } from '@web-loom/mvvm-core';
import { ActiveAwareViewModel } from '@web-loom/mvvm-patterns';
import { createMasterDetail, type MasterDetailBehavior } from '@web-loom/ui-patterns';
import { computed, signal, type ReadonlySignal } from '@web-loom/signals-core';
import type { CatalogProductDto } from '../../infrastructure/api/ports/ecommerce-api-port';
import { CatalogModel } from './CatalogModel';

export class CatalogViewModel extends ActiveAwareViewModel<CatalogModel> {
  private readonly productsState = signal<CatalogProductDto[]>([]);
  private readonly searchState = signal('');
  private readonly selectedState = signal<CatalogProductDto | null>(null);
  private readonly masterDetailVersionState = signal(0);

  private masterDetail: MasterDetailBehavior<CatalogProductDto> = createMasterDetail<CatalogProductDto>({
    items: [],
    getId: (item) => item.id,
    onSelectionChange: (item) => {
      this.selectedState.set(item);
    },
  });

  readonly searchQuery: ReadonlySignal<string> = this.searchState.asReadonly();
  readonly selectedProduct: ReadonlySignal<CatalogProductDto | null> = this.selectedState.asReadonly();
  readonly masterDetailVersion: ReadonlySignal<number> = this.masterDetailVersionState.asReadonly();
  readonly totalProducts = computed(() => this.productsState.get().length);

  readonly filteredProducts = computed(() => {
    const query = this.searchState.get().trim().toLowerCase();
    const all = this.productsState.get();

    if (!query) {
      return all;
    }

    return all.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    });
  });

  readonly loadCatalogCommand = this.registerCommand(
    new Command(async () => {
      await this.model.fetchAll();
    }),
  );

  readonly refreshCatalogCommand = this.registerCommand(
    new Command(async () => {
      await this.model.refresh();
    }),
  );

  constructor(model: CatalogModel) {
    super(model);

    this.addSubscription(
      this.model.data$.subscribe((products) => {
        const list = products ?? [];
        this.productsState.set(list);
        this.rebuildMasterDetail(list);
      }),
    );
  }

  setSearchQuery(value: string): void {
    this.searchState.set(value);
  }

  selectProduct(product: CatalogProductDto): void {
    this.masterDetail.actions.selectItem(product);
  }

  clearSelection(): void {
    this.masterDetail.actions.clearSelection();
    this.selectedState.set(null);
  }

  getMasterDetail(): MasterDetailBehavior<CatalogProductDto> {
    return this.masterDetail;
  }

  protected override onIsActiveChanged(isActive: boolean, _wasActive: boolean): void {
    if (isActive) {
      this.searchState.set('');
      void this.refreshCatalogCommand.execute();
    }
  }

  override dispose(): void {
    this.masterDetail.destroy();
    super.dispose();
  }

  private rebuildMasterDetail(products: CatalogProductDto[]): void {
    const selectedId = this.selectedState.get()?.id;
    this.masterDetail.destroy();

    this.masterDetail = createMasterDetail<CatalogProductDto>({
      items: products,
      getId: (item) => item.id,
      onSelectionChange: (item) => {
        this.selectedState.set(item);
      },
    });

    if (selectedId) {
      const selected = products.find((item) => item.id === selectedId);
      if (selected) {
        this.masterDetail.actions.selectItem(selected);
      }
    }

    this.masterDetailVersionState.update((value) => value + 1);
  }
}
