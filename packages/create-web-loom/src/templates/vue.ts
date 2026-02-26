export const useObservableTemplate = `import { ref, onUnmounted } from 'vue';
import type { Signal } from '@web-loom/signals-core';

export function useSignal<T>(signal: Signal<T>) {
  const value = ref<T>(signal.get() as T);
  const unsub = signal.subscribe((next: T) => {
    value.value = next;
  });
  onUnmounted(unsub);
  return value;
}
`;

export const counterComponentTemplate = `<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useSignal } from '../composables/useObservable';
import { CounterViewModel } from '../viewmodels/CounterViewModel';

const vm = new CounterViewModel();
onUnmounted(() => vm.dispose());

const count = useSignal(vm.count);
const doubled = useSignal(vm.doubled);
</script>

<template>
  <div style="font-family: sans-serif; text-align: center; padding: 2rem">
    <h2>Web Loom Counter</h2>
    <p>Count: <strong>{{ count }}</strong></p>
    <p>Doubled: <strong>{{ doubled }}</strong></p>
    <div style="display: flex; gap: 0.5rem; justify-content: center">
      <button @click="vm.decrement()">-</button>
      <button @click="vm.reset()">Reset</button>
      <button @click="vm.increment()">+</button>
    </div>
  </div>
</template>
`;
