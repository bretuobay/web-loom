# BusyState - Centralized Busy State Management

The `BusyState` class provides centralized busy state management for ViewModels, tracking multiple concurrent operations with individual reasons.

## Features

- **Stacked Operations**: Track multiple concurrent operations simultaneously
- **Operation Reasons**: Each operation can have a descriptive reason for UI feedback
- **Automatic Cleanup**: `executeBusy()` automatically manages busy state lifecycle
- **Manual Control**: `setBusy()` returns a cleanup function for fine-grained control
- **RxJS Observables**: Reactive streams for `isBusy$`, `operations$`, `busyReasons$`, and `currentReason$`
- **Memory Safe**: Implements `IDisposable` for proper cleanup

## Basic Usage

### Automatic Busy State Management

```typescript
import { BusyState } from '@web-loom/mvvm-core';

const busyState = new BusyState();

// Execute operation with automatic busy state
const data = await busyState.executeBusy(
  () => fetchData(),
  'Loading data...'
);
```

### Manual Busy State Management

```typescript
const clearBusy = busyState.setBusy('Saving changes...');
try {
  await saveData();
} finally {
  clearBusy();
}
```

## ViewModel Integration

```typescript
import { BaseViewModel, BaseModel, BusyState, Command } from '@web-loom/mvvm-core';

class DashboardViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly busyState = new BusyState();
  public readonly isBusy$ = this.busyState.isBusy$;
  public readonly loadingReason$ = this.busyState.currentReason$;

  public readonly loadCommand = new Command(async () => {
    await this.busyState.executeBusy(
      () => this.loadData(),
      'Loading dashboard...'
    );
  });

  private async loadData(): Promise<void> {
    // Load data logic
  }

  public override dispose(): void {
    this.busyState.dispose();
    super.dispose();
  }
}
```

## Multiple Concurrent Operations

```typescript
// All operations tracked independently
await Promise.all([
  busyState.executeBusy(() => loadUsers(), 'Loading users...'),
  busyState.executeBusy(() => loadOrders(), 'Loading orders...'),
  busyState.executeBusy(() => loadAnalytics(), 'Loading analytics...'),
]);
```

## Observables

### `isBusy$: Observable<boolean>`
Emits `true` when any operation is in progress, `false` otherwise.

```typescript
busyState.isBusy$.subscribe(isBusy => {
  console.log('Busy:', isBusy);
});
```

### `operations$: Observable<BusyOperation[]>`
Emits array of all active operations with details (id, reason, startTime).

```typescript
busyState.operations$.subscribe(operations => {
  console.log('Active operations:', operations.length);
});
```

### `busyReasons$: Observable<string[]>`
Emits array of all current operation reasons.

```typescript
busyState.busyReasons$.subscribe(reasons => {
  console.log('Loading:', reasons.join(', '));
});
```

### `currentReason$: Observable<string | null>`
Emits the most recent operation reason (useful for single loading indicator).

```typescript
busyState.currentReason$.subscribe(reason => {
  console.log('Current operation:', reason);
});
```

## Framework Examples

### React

```tsx
function DashboardView() {
  const [vm] = useState(() => new DashboardViewModel(new BaseModel({})));
  const [isBusy, setIsBusy] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const sub1 = vm.isBusy$.subscribe(setIsBusy);
    const sub2 = vm.loadingReason$.subscribe(setReason);

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      vm.dispose();
    };
  }, []);

  return (
    <div>
      {isBusy && <LoadingOverlay message={reason || 'Loading...'} />}
      <button disabled={isBusy} onClick={() => vm.loadCommand.execute()}>
        Load Data
      </button>
    </div>
  );
}
```

### Angular

```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <app-loading-overlay 
      *ngIf="vm.isBusy$ | async" 
      [message]="vm.loadingReason$ | async">
    </app-loading-overlay>
    
    <button 
      [disabled]="vm.isBusy$ | async" 
      (click)="vm.loadCommand.execute()">
      Load Data
    </button>
  `
})
export class DashboardComponent implements OnDestroy {
  vm = new DashboardViewModel(new BaseModel({}));

  ngOnDestroy() {
    this.vm.dispose();
  }
}
```

### Vue

```vue
<template>
  <div>
    <LoadingOverlay v-if="isBusy" :message="reason" />
    <button :disabled="isBusy" @click="vm.loadCommand.execute()">
      Load Data
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const vm = new DashboardViewModel(new BaseModel({}));
const isBusy = ref(false);
const reason = ref<string | null>(null);

let sub1: Subscription;
let sub2: Subscription;

onMounted(() => {
  sub1 = vm.isBusy$.subscribe(val => isBusy.value = val);
  sub2 = vm.loadingReason$.subscribe(val => reason.value = val);
});

onUnmounted(() => {
  sub1?.unsubscribe();
  sub2?.unsubscribe();
  vm.dispose();
});
</script>
```

## API Reference

### Methods

#### `setBusy(reason?: string): () => void`
Marks the state as busy and returns a cleanup function.

**Parameters:**
- `reason` (optional): Description of the operation (default: 'Loading')

**Returns:** Cleanup function to clear this busy state

#### `executeBusy<T>(operation: () => Promise<T>, reason?: string): Promise<T>`
Executes an async operation with automatic busy state management.

**Parameters:**
- `operation`: Async function to execute
- `reason` (optional): Description of the operation (default: 'Loading')

**Returns:** Promise resolving to the operation result

#### `clearAll(): void`
Clears all busy states (use with caution).

#### `dispose(): void`
Cleans up resources and completes observables.

### Properties

#### `isBusy: boolean`
Synchronous check if currently busy.

#### `operationCount: number`
Number of active operations.

## Best Practices

1. **Always dispose**: Call `dispose()` when the ViewModel is destroyed
2. **Use executeBusy**: Prefer `executeBusy()` over manual `setBusy()` for automatic cleanup
3. **Descriptive reasons**: Provide clear operation descriptions for better UX
4. **Error handling**: `executeBusy()` clears busy state even on errors
5. **Avoid clearAll**: Only use `clearAll()` in exceptional cases (e.g., navigation away)

## Testing

```typescript
import { BusyState } from '@web-loom/mvvm-core';
import { firstValueFrom } from 'rxjs';

describe('MyViewModel', () => {
  it('should set busy during load', async () => {
    const vm = new MyViewModel();
    
    const loadPromise = vm.loadCommand.execute();
    const isBusy = await firstValueFrom(vm.busyState.isBusy$);
    
    expect(isBusy).toBe(true);
    
    await loadPromise;
    
    const isBusyAfter = await firstValueFrom(vm.busyState.isBusy$);
    expect(isBusyAfter).toBe(false);
  });
});
```

## See Also

- [BusyState Example](../examples/busy-state-example.ts)
- [MVVM Core Prism Enhancements](../../../../docs/MVVM-CORE-PRISM-ENHANCEMENTS.md)
- [BaseViewModel](../viewmodels/BaseViewModel.ts)
