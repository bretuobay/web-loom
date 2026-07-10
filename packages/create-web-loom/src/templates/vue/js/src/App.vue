<script setup>
import { onUnmounted } from 'vue';
import { useSignal } from './composables/useSignal';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const STACK = ['Vite', 'JavaScript', 'Vue', '@web-loom/mvvm-core', '@web-loom/signals-core'];

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
const count = useSignal(vm.count);
const doubled = useSignal(vm.doubled);

onUnmounted(() => vm.dispose());
</script>

<template>
  <main class="starter-root">
    <section class="hero">
      <p class="kicker">Web Loom starter (Vue + JavaScript)</p>
      <h1>MVVM Starter Kit</h1>
      <p class="lead">Signals-driven ViewModel state with Vue composition ergonomics.</p>
      <div class="stack" role="list" aria-label="Starter technologies">
        <span v-for="item in STACK" :key="item" role="listitem" class="chip">{{ item }}</span>
      </div>
    </section>

    <section class="grid">
      <article class="card counter-card">
        <h2>Live Counter Demo</h2>
        <p class="meta">CounterViewModel + composable signal bridge</p>
        <div class="metrics">
          <div><span>Count</span><strong>{{ count }}</strong></div>
          <div><span>Doubled</span><strong>{{ doubled }}</strong></div>
        </div>
        <div class="controls">
          <button @click="vm.decrementCommand.execute()">-</button>
          <button @click="vm.resetCommand.execute()">Reset</button>
          <button @click="vm.incrementCommand.execute()">+</button>
        </div>
      </article>

      <article class="card code-card">
        <h2>MVVM Wiring</h2>
        <p class="meta">Generated starter files in src/</p>
        <h3>src/viewmodels/CounterViewModel.ts</h3>
        <pre><code>{{ vmSnippet }}</code></pre>
      </article>
    </section>
  </main>
</template>
