<template>
  <footer class="footer">
    <p>&copy; {{ currentYear }} Dashboard Demo. All rights reserved.</p>
  </footer>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'Footer',
  computed: {
    currentYear() {
      return new Date().getFullYear();
    },
  },
};
</script>

<style scoped></style>
