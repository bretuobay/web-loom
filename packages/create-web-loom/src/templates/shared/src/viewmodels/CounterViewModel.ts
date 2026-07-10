import { Command } from '@web-loom/mvvm-core';
import { computed, signal, type ReadonlySignal } from '@web-loom/signals-core';

export class CounterViewModel {
  private readonly countState = signal(0);

  readonly count: ReadonlySignal<number> = this.countState.asReadonly();
  readonly doubled = computed(() => this.count.get() * 2);

  readonly incrementCommand = new Command<void, void>(async () => {
    this.countState.update((value) => value + 1);
  });

  readonly decrementCommand = new Command<void, void>(async () => {
    this.countState.update((value) => value - 1);
  });

  readonly resetCommand = new Command<void, void>(async () => {
    this.countState.set(0);
  });

  dispose(): void {
    this.incrementCommand.dispose();
    this.decrementCommand.dispose();
    this.resetCommand.dispose();
  }
}
