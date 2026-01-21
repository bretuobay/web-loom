import { BusyState } from '../state/BusyState';
import { BaseViewModel } from '../viewmodels/BaseViewModel';
import { BaseModel } from '../models/BaseModel';
import { Command } from '../commands/Command';

/**
 * Example demonstrating BusyState usage in a ViewModel
 */

// Mock data types
interface User {
  id: string;
  name: string;
}

interface Order {
  id: string;
  total: number;
}

interface Analytics {
  revenue: number;
  users: number;
}

/**
 * Dashboard ViewModel demonstrating centralized busy state management
 */
class DataDashboardViewModel extends BaseViewModel<BaseModel<any, any>> {
  // Centralized busy state for this ViewModel
  public readonly busyState = new BusyState();

  // Expose isBusy$ for view binding
  public readonly isBusy$ = this.busyState.isBusy$;
  public readonly loadingReason$ = this.busyState.currentReason$;
  public readonly allReasons$ = this.busyState.busyReasons$;

  // Commands that use busy state
  public readonly loadAllCommand = new Command(async () => {
    // Multiple concurrent operations with individual busy reasons
    await Promise.all([
      this.busyState.executeBusy(() => this.loadUsers(), 'Loading users...'),
      this.busyState.executeBusy(() => this.loadOrders(), 'Loading orders...'),
      this.busyState.executeBusy(() => this.loadAnalytics(), 'Loading analytics...'),
    ]);
  });

  public readonly saveCommand = new Command(async () => {
    // Manual busy state management with try/finally
    const clearBusy = this.busyState.setBusy('Saving changes...');
    try {
      await this.saveChanges();
    } finally {
      clearBusy();
    }
  });

  public readonly refreshCommand = new Command(async () => {
    // Using executeBusy for automatic cleanup
    await this.busyState.executeBusy(async () => {
      await this.loadUsers();
      await this.loadOrders();
    }, 'Refreshing data...');
  });

  // Simulated async operations
  private async loadUsers(): Promise<User[]> {
    await new Promise((r) => setTimeout(r, 1000));
    return [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
  }

  private async loadOrders(): Promise<Order[]> {
    await new Promise((r) => setTimeout(r, 1500));
    return [
      { id: '1', total: 100 },
      { id: '2', total: 200 },
    ];
  }

  private async loadAnalytics(): Promise<Analytics> {
    await new Promise((r) => setTimeout(r, 800));
    return { revenue: 5000, users: 150 };
  }

  private async saveChanges(): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
  }

  public override dispose(): void {
    this.busyState.dispose();
    super.dispose();
  }
}

/**
 * Example: Form ViewModel with validation and save
 */
class FormViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly busyState = new BusyState();
  public readonly isBusy$ = this.busyState.isBusy$;

  public readonly validateCommand = new Command(async (data: any) => {
    return await this.busyState.executeBusy(async () => {
      // Simulate async validation (e.g., check email uniqueness)
      await new Promise((r) => setTimeout(r, 300));
      return { isValid: true };
    }, 'Validating...');
  });

  public readonly submitCommand = new Command(async (data: any) => {
    // Multiple steps with different busy reasons
    const clearValidation = this.busyState.setBusy('Validating form...');
    try {
      await this.validateForm(data);
    } finally {
      clearValidation();
    }

    const clearSubmit = this.busyState.setBusy('Submitting form...');
    try {
      await this.submitForm(data);
    } finally {
      clearSubmit();
    }
  });

  private async validateForm(data: any): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
  }

  private async submitForm(data: any): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
  }

  public override dispose(): void {
    this.busyState.dispose();
    super.dispose();
  }
}

/**
 * Example: React component usage (pseudo-code)
 */
/*
function DashboardView() {
  const [vm] = useState(() => new DataDashboardViewModel(new BaseModel({})));
  const [isBusy, setIsBusy] = useState(false);
  const [loadingReason, setLoadingReason] = useState<string | null>(null);

  useEffect(() => {
    const sub1 = vm.isBusy$.subscribe(setIsBusy);
    const sub2 = vm.loadingReason$.subscribe(setLoadingReason);

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      vm.dispose();
    };
  }, []);

  return (
    <div>
      {isBusy && (
        <LoadingOverlay message={loadingReason || 'Loading...'} />
      )}
      
      <button 
        disabled={isBusy} 
        onClick={() => vm.loadAllCommand.execute()}
      >
        Refresh All
      </button>

      <button 
        disabled={isBusy} 
        onClick={() => vm.saveCommand.execute()}
      >
        Save Changes
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
  selector: 'app-dashboard',
  template: `
    <div>
      <app-loading-overlay 
        *ngIf="vm.isBusy$ | async" 
        [message]="vm.loadingReason$ | async">
      </app-loading-overlay>
      
      <button 
        [disabled]="vm.isBusy$ | async" 
        (click)="vm.loadAllCommand.execute()">
        Refresh All
      </button>

      <button 
        [disabled]="vm.isBusy$ | async" 
        (click)="vm.saveCommand.execute()">
        Save Changes
      </button>
    </div>
  `
})
export class DashboardComponent implements OnDestroy {
  vm = new DataDashboardViewModel(new BaseModel({}));

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
    <LoadingOverlay v-if="isBusy" :message="loadingReason" />
    
    <button :disabled="isBusy" @click="vm.loadAllCommand.execute()">
      Refresh All
    </button>

    <button :disabled="isBusy" @click="vm.saveCommand.execute()">
      Save Changes
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const vm = new DataDashboardViewModel(new BaseModel({}));
const isBusy = ref(false);
const loadingReason = ref<string | null>(null);

let sub1: Subscription;
let sub2: Subscription;

onMounted(() => {
  sub1 = vm.isBusy$.subscribe(val => isBusy.value = val);
  sub2 = vm.loadingReason$.subscribe(val => loadingReason.value = val);
});

onUnmounted(() => {
  sub1?.unsubscribe();
  sub2?.unsubscribe();
  vm.dispose();
});
</script>
*/

export { DataDashboardViewModel, FormViewModel };
