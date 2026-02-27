<script>
  import { onMount } from 'svelte';
  import { CounterViewModel } from './viewmodels/CounterViewModel';

  const STACK = ['Vite', 'JavaScript', 'Svelte', '@web-loom/mvvm-core', '@web-loom/signals-core'];

  const vmSnippet = `export class CounterViewModel {
  count = signal(0);
  doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

  const vm = new CounterViewModel();

  let count = 0;
  let doubled = 0;

  onMount(() => {
    const sync = () => {
      count = vm.count.get();
      doubled = vm.doubled.get();
    };

    sync();
    const unsubscribeCount = vm.count.subscribe(sync);
    const unsubscribeDoubled = vm.doubled.subscribe(sync);

    return () => {
      unsubscribeCount();
      unsubscribeDoubled();
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
        <button on:click={() => vm.decrement()}>-</button>
        <button on:click={() => vm.reset()}>Reset</button>
        <button on:click={() => vm.increment()}>+</button>
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
