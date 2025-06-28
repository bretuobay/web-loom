<template>
  <header class="header">
    <router-link to="/" class="header-item">Dashboard</router-link>
    <nav class="flex-container">
      <router-link v-for="item in navigationList" :key="item.id" :to="`/${item.id}`" class="header-item">{{
        item.label
      }}</router-link>
    </nav>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useObservable } from '../hooks/useObservable';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';

const navigation = useObservable(navigationViewModel.navigationList.items$, []);
const navigationList = computed(() => navigation.value.map((item) => item));
</script>
<style scoped>
a {
  font-weight: 500;
}
</style>
