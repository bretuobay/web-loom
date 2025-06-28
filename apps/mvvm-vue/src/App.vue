<template>
  <div id="app">
    <Header />
    <Container>
      <router-view />
    </Container>
    <Footer />
  </div>
</template>
<script setup lang="ts">
import Header from './layout/Header.vue';
import Footer from './layout/Footer.vue';
import Container from './layout/Container.vue';
</script>

<style scoped></style>
