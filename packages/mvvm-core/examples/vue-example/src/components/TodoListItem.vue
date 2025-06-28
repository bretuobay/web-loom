<template>
  <div v-if="itemData" class="todo-list-item">
    <input type="checkbox" :checked="itemData.isCompleted" @change="handleToggle" />
    <span :class="{ completed: itemData.isCompleted }">
      {{ itemData.text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps } from 'vue';
import type { Subscription } from 'rxjs';
import type { TodoItem, TodoItemData, TodoListViewModel } from 'mvvm-core';

const props = defineProps<{
  todo: TodoItem;
  viewModel: TodoListViewModel;
}>();

const itemData = ref<TodoItemData | null>(null);
let dataSubscription: Subscription | null = null;

onMounted(() => {
  dataSubscription = props.todo.data$.subscribe((data) => {
    itemData.value = data;
  });
});

onUnmounted(() => {
  dataSubscription?.unsubscribe();
});

const handleToggle = () => {
  if (itemData.value) {
    props.viewModel.toggleTodoCommand.execute(itemData.value.id);
  }
};
</script>

<style scoped>
.todo-list-item {
  display: flex;
  align-items: center;
  padding: 0.5em 0;
  border-bottom: 1px solid #eee;
}
.todo-list-item:last-child {
  border-bottom: none;
}
input[type='checkbox'] {
  margin-right: 0.75em;
}
.completed {
  text-decoration: line-through;
  color: #aaa;
}
</style>
