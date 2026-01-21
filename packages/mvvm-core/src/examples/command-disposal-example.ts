import { BaseViewModel } from '../viewmodels/BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { Command } from '../commands/Command';
import { BusyState } from '../state/BusyState';
import { map } from 'rxjs/operators';

/**
 * Example demonstrating automatic command disposal in ViewModels
 */

// Mock data types
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Product ViewModel demonstrating command registration and automatic disposal
 */
class ProductViewModel extends BaseViewModel<BaseModel<Product, any>> {
  // BusyState for loading indicators
  public readonly busyState = new BusyState();
  public readonly isBusy$ = this.busyState.isBusy$;

  // Commands registered for automatic disposal
  public readonly loadCommand: Command<void, void>;
  public readonly saveCommand: Command<void, void>;
  public readonly deleteCommand: Command<void, void>;
  public readonly incrementStockCommand: Command<number, void>;

  // Computed observables for command enablement
  private readonly canSave$ = this.data$.pipe(map((data) => data !== null && data.name.length > 0 && data.price > 0));

  private readonly canDelete$ = this.data$.pipe(map((data) => data !== null && data.id.length > 0));

  private readonly canModifyStock$ = this.data$.pipe(map((data) => data !== null));

  constructor(model: BaseModel<Product, any>) {
    super(model);

    // Register commands - they will be automatically disposed when ViewModel is disposed
    this.loadCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.loadProduct(), 'Loading product...');
      }),
    );

    this.saveCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.saveProduct(), 'Saving product...');
      }, this.canSave$),
    );

    this.deleteCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.deleteProduct(), 'Deleting product...');
      }, this.canDelete$),
    );

    this.incrementStockCommand = this.registerCommand(
      new Command(async (amount: number) => {
        await this.incrementStock(amount);
      }, this.canModifyStock$),
    );
  }

  private async loadProduct(): Promise<void> {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 500));
    this.model.setData({
      id: '1',
      name: 'Sample Product',
      price: 29.99,
      stock: 100,
    });
  }

  private async saveProduct(): Promise<void> {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 300));
    console.log('Product saved:', this.model['_data$'].value);
  }

  private async deleteProduct(): Promise<void> {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 200));
    this.model.setData(null);
  }

  private async incrementStock(amount: number): Promise<void> {
    const currentData = this.model['_data$'].value;
    if (currentData) {
      this.model.setData({
        ...currentData,
        stock: currentData.stock + amount,
      });
    }
  }

  public override dispose(): void {
    // BusyState disposal
    this.busyState.dispose();

    // Commands are automatically disposed by BaseViewModel
    super.dispose();
  }
}

/**
 * Example: Shopping Cart ViewModel with multiple commands
 */
class ShoppingCartViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly addItemCommand: Command<string, void>;
  public readonly removeItemCommand: Command<string, void>;
  public readonly clearCartCommand: Command<void, void>;
  public readonly checkoutCommand: Command<void, void>;

  private readonly hasItems$ = this.data$.pipe(map((data) => data !== null && data.items && data.items.length > 0));

  constructor(model: BaseModel<any, any>) {
    super(model);

    // All commands automatically disposed
    this.addItemCommand = this.registerCommand(
      new Command(async (productId: string) => {
        await this.addItem(productId);
      }),
    );

    this.removeItemCommand = this.registerCommand(
      new Command(async (productId: string) => {
        await this.removeItem(productId);
      }, this.hasItems$),
    );

    this.clearCartCommand = this.registerCommand(
      new Command(async () => {
        await this.clearCart();
      }, this.hasItems$),
    );

    this.checkoutCommand = this.registerCommand(
      new Command(async () => {
        await this.checkout();
      }, this.hasItems$),
    );
  }

  private async addItem(productId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    console.log('Added item:', productId);
  }

  private async removeItem(productId: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    console.log('Removed item:', productId);
  }

  private async clearCart(): Promise<void> {
    await new Promise((r) => setTimeout(r, 100));
    this.model.setData({ items: [] });
  }

  private async checkout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
    console.log('Checkout complete');
  }
}

/**
 * Example: React component usage (pseudo-code)
 */
/*
function ProductView() {
  const [vm] = useState(() => new ProductViewModel(new BaseModel({ initialData: null })));

  useEffect(() => {
    // Load product on mount
    vm.loadCommand.execute();

    return () => {
      // All commands automatically disposed
      vm.dispose();
    };
  }, []);

  return (
    <div>
      <button onClick={() => vm.loadCommand.execute()}>Load</button>
      <button onClick={() => vm.saveCommand.execute()}>Save</button>
      <button onClick={() => vm.deleteCommand.execute()}>Delete</button>
      <button onClick={() => vm.incrementStockCommand.execute(10)}>
        Add 10 to Stock
      </button>
    </div>
  );
}
*/

/**
 * Example: Angular component usage (pseudo-code)
 */
/*
@Component({
  selector: 'app-product',
  template: `
    <button (click)="vm.loadCommand.execute()">Load</button>
    <button (click)="vm.saveCommand.execute()">Save</button>
    <button (click)="vm.deleteCommand.execute()">Delete</button>
    <button (click)="vm.incrementStockCommand.execute(10)">
      Add 10 to Stock
    </button>
  `
})
export class ProductComponent implements OnInit, OnDestroy {
  vm = new ProductViewModel(new BaseModel({ initialData: null }));

  ngOnInit() {
    this.vm.loadCommand.execute();
  }

  ngOnDestroy() {
    // All commands automatically disposed
    this.vm.dispose();
  }
}
*/

/**
 * Example: Vue component usage (pseudo-code)
 */
/*
<template>
  <div>
    <button @click="vm.loadCommand.execute()">Load</button>
    <button @click="vm.saveCommand.execute()">Save</button>
    <button @click="vm.deleteCommand.execute()">Delete</button>
    <button @click="vm.incrementStockCommand.execute(10)">
      Add 10 to Stock
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const vm = new ProductViewModel(new BaseModel({ initialData: null }));

onMounted(() => {
  vm.loadCommand.execute();
});

onUnmounted(() => {
  // All commands automatically disposed
  vm.dispose();
});
</script>
*/

/**
 * Example: Manual disposal (old pattern - still works but not recommended)
 */
class LegacyViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Old pattern: command not registered
  public readonly myCommand = new Command(async () => {
    console.log('Executing command');
  });

  // Must manually dispose
  public override dispose(): void {
    if (this.myCommand && typeof this.myCommand.dispose === 'function') {
      this.myCommand.dispose();
    }
    super.dispose();
  }
}

/**
 * Example: Mixed pattern (both registered and manual commands)
 */
class MixedViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Registered command - automatic disposal
  public readonly autoCommand: Command<void, void>;

  // Manual command - must dispose manually
  public readonly manualCommand = new Command(async () => {
    console.log('Manual command');
  });

  constructor(model: BaseModel<any, any>) {
    super(model);

    this.autoCommand = this.registerCommand(
      new Command(async () => {
        console.log('Auto command');
      }),
    );
  }

  public override dispose(): void {
    // Manual command disposal
    if (this.manualCommand && typeof this.manualCommand.dispose === 'function') {
      this.manualCommand.dispose();
    }

    // Auto command disposed by BaseViewModel
    super.dispose();
  }
}

export { ProductViewModel, ShoppingCartViewModel, LegacyViewModel, MixedViewModel };
