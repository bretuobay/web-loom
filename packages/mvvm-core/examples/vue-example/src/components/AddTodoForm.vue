<template>
  <div>
    <input type="text" v-model="newTodoInputValue" placeholder="Enter new todo" @keyup.enter="handleAddClick" />
    <button @click="handleAddClick" :disabled="!canAdd">Add Todo</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, watch } from 'vue'; // Added watch
import type { Subscription } from 'rxjs';
import type { TodoListViewModel } from 'mvvm-core';

const props = defineProps<{
  viewModel: TodoListViewModel;
}>();

const newTodoInputValue = ref(props.viewModel.newTodoText);
const canAdd = ref(false);

let textSubscription: Subscription | null = null;
let canExecuteSubscription: Subscription | null = null;

onMounted(() => {
  textSubscription = props.viewModel.newTodoText$.subscribe((text) => {
    newTodoInputValue.value = text;
  });

  canExecuteSubscription = props.viewModel.addTodoCommand.canExecute$.subscribe((canEx) => {
    canAdd.value = canEx;
  });
});

onUnmounted(() => {
  textSubscription?.unsubscribe();
  canExecuteSubscription?.unsubscribe();
});

watch(newTodoInputValue, (newValue) => {
  props.viewModel.setNewTodoText(newValue);
});

const handleAddClick = () => {
  if (canAdd.value) {
    props.viewModel.addTodoCommand.execute();
  }
};
</script>

<style scoped>
div {
  display: flex;
  margin-bottom: 1em;
}
input[type='text'] {
  flex-grow: 1;
  padding: 0.5em;
  margin-right: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 0.5em 1em;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
