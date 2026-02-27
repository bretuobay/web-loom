<script setup lang="ts">
import { onUnmounted } from 'vue';
import { useSignal } from './composables/useObservable';
import { CounterViewModel } from './viewmodels/CounterViewModel';

const STACK = ['Vite', 'TypeScript', 'Vue', '@web-loom/mvvm-core', '@web-loom/signals-core'];

const vmSnippet = `export class CounterViewModel {
  readonly count = signal(0);
  readonly doubled = computed(() => this.count.get() * 2);

  increment() { this.count.set(this.count.get() + 1); }
  decrement() { this.count.set(this.count.get() - 1); }
  reset() { this.count.set(0); }
}`;

const vm = new CounterViewModel();
const count = useSignal(vm.count);
const doubled = useSignal(vm.doubled);

onUnmounted(() => vm.dispose());
</script>

<template>
  <main class="starter-root">
    <section class="hero">
      <p class="kicker">Web Loom starter (Vue + TypeScript)</p>
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
          <button @click="vm.decrement()">-</button>
          <button @click="vm.reset()">Reset</button>
          <button @click="vm.increment()">+</button>
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
