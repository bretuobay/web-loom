<template>
  <div id="app-container">
    <header>
      <h1>Vue 3 Todo App (MVVM)</h1>
    </header>
    <main>
      <AddTodoForm :viewModel="viewModel" />
      <TodoList :viewModel="viewModel" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue';
import { TodoListViewModel } from 'mvvm-core';
import AddTodoForm from './components/AddTodoForm.vue';
import TodoList from './components/TodoList.vue';

const viewModel = shallowRef(new TodoListViewModel());

onUnmounted(() => {
  viewModel.value.dispose();
});
</script>

<style>
body {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 20px;
}

#app-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header {
  text-align: center;
  margin-bottom: 20px;
}

header h1 {
  color: #333;
}
</style>
