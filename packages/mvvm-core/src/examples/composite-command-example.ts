import { Command, ICommand } from '../commands/Command';
import { CompositeCommand } from '../commands/CompositeCommand';
import { BaseViewModel } from '../viewmodels/BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { BusyState } from '../state/BusyState';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Example demonstrating CompositeCommand usage
 */

// Mock data types
interface DashboardData {
  users: any[];
  orders: any[];
  stats: any[];
}

/**
 * Dashboard ViewModel with multiple refresh commands
 */
class DashboardViewModel extends BaseViewModel<BaseModel<DashboardData, any>> {
  public readonly busyState = new BusyState();

  // Individual panel refresh commands
  public readonly refreshUsersCommand: ICommand<void, void>;
  public readonly refreshOrdersCommand: ICommand<void, void>;
  public readonly refreshStatsCommand: ICommand<void, void>;

  // Composite command to refresh all panels
  public readonly refreshAllCommand: CompositeCommand<void, void[]>;

  constructor(model: BaseModel<DashboardData, any>) {
    super(model);

    // Create individual refresh commands
    this.refreshUsersCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.refreshUsers(), 'Refreshing users...');
      }),
    );

    this.refreshOrdersCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.refreshOrders(), 'Refreshing orders...');
      }),
    );

    this.refreshStatsCommand = this.registerCommand(
      new Command(async () => {
        await this.busyState.executeBusy(() => this.refreshStats(), 'Refreshing stats...');
      }),
    );

    // Create composite command and register all refresh commands
    this.refreshAllCommand = new CompositeCommand();
    this.refreshAllCommand.register(this.refreshUsersCommand);
    this.refreshAllCommand.register(this.refreshOrdersCommand);
    this.refreshAllCommand.register(this.refreshStatsCommand);
  }

  private async refreshUsers(): Promise<void> {
    console.log('Refreshing users panel...');
    await new Promise((r) => setTimeout(r, 500));
  }

  private async refreshOrders(): Promise<void> {
    console.log('Refreshing orders panel...');
    await new Promise((r) => setTimeout(r, 700));
  }

  private async refreshStats(): Promise<void> {
    console.log('Refreshing stats panel...');
    await new Promise((r) => setTimeout(r, 300));
  }

  public override dispose(): void {
    this.refreshAllCommand.dispose();
    this.busyState.dispose();
    super.dispose();
  }
}

/**
 * Multi-form wizard with Save All functionality
 */
interface WizardStep {
  name: string;
  isValid: boolean;
  data: any;
}

class WizardViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly step1Valid$ = new BehaviorSubject(false);
  public readonly step2Valid$ = new BehaviorSubject(false);
  public readonly step3Valid$ = new BehaviorSubject(false);

  // Individual step save commands
  public readonly saveStep1Command: ICommand<void, void>;
  public readonly saveStep2Command: ICommand<void, void>;
  public readonly saveStep3Command: ICommand<void, void>;

  // Composite command to save all steps
  public readonly saveAllCommand: CompositeCommand<void, void[]>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Create save commands for each step
    this.saveStep1Command = this.registerCommand(new Command(async () => this.saveStep1(), this.step1Valid$));

    this.saveStep2Command = this.registerCommand(new Command(async () => this.saveStep2(), this.step2Valid$));

    this.saveStep3Command = this.registerCommand(new Command(async () => this.saveStep3(), this.step3Valid$));

    // Create composite - can only save all when ALL steps are valid
    this.saveAllCommand = new CompositeCommand({ executionMode: 'sequential' });
    this.saveAllCommand.register(this.saveStep1Command);
    this.saveAllCommand.register(this.saveStep2Command);
    this.saveAllCommand.register(this.saveStep3Command);
  }

  private async saveStep1(): Promise<void> {
    console.log('Saving step 1...');
    await new Promise((r) => setTimeout(r, 200));
  }

  private async saveStep2(): Promise<void> {
    console.log('Saving step 2...');
    await new Promise((r) => setTimeout(r, 200));
  }

  private async saveStep3(): Promise<void> {
    console.log('Saving step 3...');
    await new Promise((r) => setTimeout(r, 200));
  }

  public override dispose(): void {
    this.saveAllCommand.dispose();
    super.dispose();
  }
}

/**
 * Data table with batch operations
 */
interface TableItem {
  id: string;
  name: string;
  selected: boolean;
}

class DataTableViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly items$ = new BehaviorSubject<TableItem[]>([]);
  public readonly selectedItems$ = this.items$.pipe(map((items) => items.filter((item) => item.selected)));

  public readonly hasSelection$ = this.selectedItems$.pipe(map((items) => items.length > 0));

  // Individual item operations
  public readonly deleteItemCommand: ICommand<string, void>;
  public readonly exportItemCommand: ICommand<string, void>;
  public readonly archiveItemCommand: ICommand<string, void>;

  // Batch operations using composite commands
  public readonly deleteSelectedCommand: CompositeCommand<void, void[]>;
  public readonly exportSelectedCommand: CompositeCommand<void, void[]>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Create individual item commands
    this.deleteItemCommand = this.registerCommand(new Command(async (id: string) => this.deleteItem(id)));

    this.exportItemCommand = this.registerCommand(new Command(async (id: string) => this.exportItem(id)));

    this.archiveItemCommand = this.registerCommand(new Command(async (id: string) => this.archiveItem(id)));

    // Create composite commands for batch operations
    this.deleteSelectedCommand = new CompositeCommand({ executionMode: 'parallel' });
    this.exportSelectedCommand = new CompositeCommand({ executionMode: 'sequential' });

    // Subscribe to selection changes to update composite commands
    this.selectedItems$.subscribe((items) => {
      this.updateBatchCommands(items);
    });
  }

  private updateBatchCommands(selectedItems: TableItem[]): void {
    // Clear existing commands
    this.deleteSelectedCommand.registeredCommands.forEach((cmd) => {
      this.deleteSelectedCommand.unregister(cmd);
    });
    this.exportSelectedCommand.registeredCommands.forEach((cmd) => {
      this.exportSelectedCommand.unregister(cmd);
    });

    // Register commands for each selected item
    selectedItems.forEach((item) => {
      const deleteCmd = new Command(async () => this.deleteItem(item.id));
      const exportCmd = new Command(async () => this.exportItem(item.id));

      this.deleteSelectedCommand.register(deleteCmd);
      this.exportSelectedCommand.register(exportCmd);
    });
  }

  private async deleteItem(id: string): Promise<void> {
    console.log('Deleting item:', id);
    await new Promise((r) => setTimeout(r, 100));
  }

  private async exportItem(id: string): Promise<void> {
    console.log('Exporting item:', id);
    await new Promise((r) => setTimeout(r, 150));
  }

  private async archiveItem(id: string): Promise<void> {
    console.log('Archiving item:', id);
    await new Promise((r) => setTimeout(r, 100));
  }

  public override dispose(): void {
    this.deleteSelectedCommand.dispose();
    this.exportSelectedCommand.dispose();
    super.dispose();
  }
}

/**
 * Tab container with active awareness
 */
interface Tab {
  id: string;
  title: string;
  isActive: boolean;
  refreshCommand: Command<void, void> & { isActive: boolean };
}

class TabContainerViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly tabs$ = new BehaviorSubject<Tab[]>([]);

  // Composite command that only refreshes active tabs
  public readonly refreshActiveTabsCommand: CompositeCommand<void, void[]>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Create composite with active awareness
    this.refreshActiveTabsCommand = new CompositeCommand({
      monitorCommandActivity: true,
      executionMode: 'parallel',
    });

    // Initialize tabs
    this.initializeTabs();
  }

  private initializeTabs(): void {
    const tabs: Tab[] = [
      this.createTab('tab1', 'Users', true),
      this.createTab('tab2', 'Orders', false),
      this.createTab('tab3', 'Reports', false),
    ];

    this.tabs$.next(tabs);

    // Register all tab refresh commands
    tabs.forEach((tab) => {
      this.refreshActiveTabsCommand.register(tab.refreshCommand);
    });
  }

  private createTab(id: string, title: string, isActive: boolean): Tab {
    const refreshCommand = new Command(async () => {
      console.log(`Refreshing ${title} tab...`);
      await new Promise((r) => setTimeout(r, 300));
    }) as Command<void, void> & { isActive: boolean };

    // Add isActive property for IActiveAware
    refreshCommand.isActive = isActive;

    return {
      id,
      title,
      isActive,
      refreshCommand,
    };
  }

  public activateTab(tabId: string): void {
    const currentTabs = this.tabs$.value;
    currentTabs.forEach((tab) => {
      tab.isActive = tab.id === tabId;
      tab.refreshCommand.isActive = tab.id === tabId;
    });

    this.tabs$.next([...currentTabs]);
  }

  public override dispose(): void {
    this.refreshActiveTabsCommand.dispose();
    super.dispose();
  }
}

/**
 * Example: React component usage (pseudo-code)
 */
/*
function DashboardView() {
  const [vm] = useState(() => new DashboardViewModel(new BaseModel({ initialData: null })));
  const [canRefreshAll, setCanRefreshAll] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const sub1 = vm.refreshAllCommand.canExecute$.subscribe(setCanRefreshAll);
    const sub2 = vm.refreshAllCommand.isExecuting$.subscribe(setIsRefreshing);

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      vm.dispose();
    };
  }, []);

  return (
    <div>
      <button 
        disabled={!canRefreshAll || isRefreshing}
        onClick={() => vm.refreshAllCommand.execute()}
      >
        {isRefreshing ? 'Refreshing All...' : 'Refresh All'}
      </button>

      <div className="panels">
        <Panel title="Users" onRefresh={() => vm.refreshUsersCommand.execute()} />
        <Panel title="Orders" onRefresh={() => vm.refreshOrdersCommand.execute()} />
        <Panel title="Stats" onRefresh={() => vm.refreshStatsCommand.execute()} />
      </div>
    </div>
  );
}
*/

/**
 * Example: Angular component usage (pseudo-code)
 */
/*
@Component({
  selector: 'app-dashboard',
  template: `
    <button 
      [disabled]="!(vm.refreshAllCommand.canExecute$ | async) || (vm.refreshAllCommand.isExecuting$ | async)"
      (click)="vm.refreshAllCommand.execute()">
      {{ (vm.refreshAllCommand.isExecuting$ | async) ? 'Refreshing All...' : 'Refresh All' }}
    </button>

    <div class="panels">
      <app-panel title="Users" (refresh)="vm.refreshUsersCommand.execute()"></app-panel>
      <app-panel title="Orders" (refresh)="vm.refreshOrdersCommand.execute()"></app-panel>
      <app-panel title="Stats" (refresh)="vm.refreshStatsCommand.execute()"></app-panel>
    </div>
  `
})
export class DashboardComponent implements OnDestroy {
  vm = new DashboardViewModel(new BaseModel({ initialData: null }));

  ngOnDestroy() {
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
    <button 
      :disabled="!canRefreshAll || isRefreshing"
      @click="vm.refreshAllCommand.execute()">
      {{ isRefreshing ? 'Refreshing All...' : 'Refresh All' }}
    </button>

    <div class="panels">
      <Panel title="Users" @refresh="vm.refreshUsersCommand.execute()" />
      <Panel title="Orders" @refresh="vm.refreshOrdersCommand.execute()" />
      <Panel title="Stats" @refresh="vm.refreshStatsCommand.execute()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const vm = new DashboardViewModel(new BaseModel({ initialData: null }));
const canRefreshAll = ref(true);
const isRefreshing = ref(false);

let sub1: Subscription;
let sub2: Subscription;

onMounted(() => {
  sub1 = vm.refreshAllCommand.canExecute$.subscribe(val => canRefreshAll.value = val);
  sub2 = vm.refreshAllCommand.isExecuting$.subscribe(val => isRefreshing.value = val);
});

onUnmounted(() => {
  sub1?.unsubscribe();
  sub2?.unsubscribe();
  vm.dispose();
});
</script>
*/

export { DashboardViewModel, WizardViewModel, DataTableViewModel, TabContainerViewModel };
