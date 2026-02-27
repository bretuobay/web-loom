<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { CounterViewModel } from './viewmodels/CounterViewModel';

  const vm = new CounterViewModel();

  let count = 0;
  let doubled = 0;
  let unsubscribeCount: () => void = () => {};
  let unsubscribeDoubled: () => void = () => {};

  onMount(() => {
    const sync = () => {
      count = vm.count.get();
      doubled = vm.doubled.get();
    };

    sync();
    unsubscribeCount = vm.count.subscribe(sync);
    unsubscribeDoubled = vm.doubled.subscribe(sync);
  });

  onDestroy(() => {
    unsubscribeCount();
    unsubscribeDoubled();
    vm.dispose();
  });
</script>

<main style="font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 680px">
  <p>Web Loom starter (Svelte + TypeScript)</p>
  <h1>Counter MVVM</h1>
  <p>Count: <strong>{count}</strong></p>
  <p>Doubled: <strong>{doubled}</strong></p>
  <div style="display: flex; gap: 0.5rem">
    <button on:click={() => vm.decrement()}>-</button>
    <button on:click={() => vm.reset()}>Reset</button>
    <button on:click={() => vm.increment()}>+</button>
  </div>
</main>
