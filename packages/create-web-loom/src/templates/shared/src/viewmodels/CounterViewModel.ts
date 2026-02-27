import { computed, signal } from '@web-loom/signals-core';

export class CounterViewModel {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count.get() * 2);

  increment(): void {
    this.count.set(this.count.get() + 1);
  }

  decrement(): void {
    this.count.set(this.count.get() - 1);
  }

  reset(): void {
    this.count.set(0);
  }

  dispose(): void {
    // Placeholder for future cleanup logic.
  }
}
