<template>
  <div class="todo-list">
    <TodoListItem v-for="todo in todos" :key="todo.id" :todo="todo" :viewModel="viewModel" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps } from 'vue';
import type { Subscription } from 'rxjs';
import type { TodoListViewModel, TodoItem } from 'mvvm-core';
import TodoListItem from './TodoListItem.vue';

const props = defineProps<{
  viewModel: TodoListViewModel;
}>();

const todos = ref<TodoItem[]>(props.viewModel.todos.toArray());
let todosSubscription: Subscription | null = null;

onMounted(() => {
  todosSubscription = props.viewModel.todos.items$.subscribe((updatedTodos) => {
    todos.value = updatedTodos;
  });
});

onUnmounted(() => {
  todosSubscription?.unsubscribe();
});
</script>

<style scoped>
.todo-list {
  margin-top: 1em;
}
</style>
