<script setup>
import { onUnmounted } from 'vue';
import { useSignal } from './composables/useObservable';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const vm = new CounterViewModel();
const count = useSignal(vm.count);
const doubled = useSignal(vm.doubled);

onUnmounted(() => vm.dispose());
</script>

<template>
  <main style="font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 680px">
    <p>Web Loom starter (Vue + JavaScript)</p>
    <h1>Counter MVVM</h1>
    <p>Count: <strong>{{ count }}</strong></p>
    <p>Doubled: <strong>{{ doubled }}</strong></p>
    <div style="display: flex; gap: 0.5rem">
      <button @click="vm.decrement()">-</button>
      <button @click="vm.reset()">Reset</button>
      <button @click="vm.increment()">+</button>
    </div>
  </main>
</template>
