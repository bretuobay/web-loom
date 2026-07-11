<script>
  import { onMount } from 'svelte';
  import { observe } from '@web-loom/signals-core';
  import { CounterViewModel } from './viewmodels/CounterViewModel';

  const STACK = ['Vite', 'JavaScript', 'Svelte', '@web-loom/mvvm-core', '@web-loom/signals-core'];

  const vmSnippet = `import { Command } from "@web-loom/mvvm-core";
import { computed, signal } from "@web-loom/signals-core";

export class CounterViewModel {
  countState = signal(0);
  count = this.countState.asReadonly();
  doubled = computed(() => this.count.get() * 2);

  incrementCommand = new Command(async () => {
    this.countState.update((value) => value + 1);
  });
  decrementCommand = new Command(async () => {
    this.countState.update((value) => value - 1);
  });
  resetCommand = new Command(async () => {
    this.countState.set(0);
  });
}`;

  const vm = new CounterViewModel();

  let count = 0;
  let doubled = 0;

  onMount(() => {
    const stopCount = observe(vm.count, (value) => {
      count = value;
    });
    const stopDoubled = observe(vm.doubled, (value) => {
      doubled = value;
    });

    return () => {
      stopCount();
      stopDoubled();
      vm.dispose();
    };
  });
</script>

<main class="starter-root">
  <section class="hero">
    <p class="kicker">Web Loom starter (Svelte + JavaScript)</p>
    <h1>MVVM Starter Kit</h1>
    <p class="lead">Signals-driven ViewModel state with Svelte bindings and framework-agnostic domain logic.</p>
    <div class="stack" role="list" aria-label="Starter technologies">
      {#each STACK as item}
        <span role="listitem" class="chip">{item}</span>
      {/each}
    </div>
  </section>

  <section class="grid">
    <article class="card counter-card">
      <h2>Live Counter Demo</h2>
      <p class="meta">CounterViewModel + Svelte subscription bridge</p>
      <div class="metrics">
        <div><span>Count</span><strong>{count}</strong></div>
        <div><span>Doubled</span><strong>{doubled}</strong></div>
      </div>
      <div class="controls">
        <button on:click={() => void vm.decrementCommand.execute()}>-</button>
        <button on:click={() => void vm.resetCommand.execute()}>Reset</button>
        <button on:click={() => void vm.incrementCommand.execute()}>+</button>
      </div>
    </article>

    <article class="card code-card">
      <h2>MVVM Wiring</h2>
      <p class="meta">Generated starter files in src/</p>
      <h3>src/viewmodels/CounterViewModel.ts</h3>
      <pre><code>{vmSnippet}</code></pre>
    </article>
  </section>
</main>
