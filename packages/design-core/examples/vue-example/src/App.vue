<template>
  <div class="app-container">
    <nav>
      <router-link to="/" class="nav-link" active-class="active">Dashboard</router-link>
      <router-link to="/posts" class="nav-link" active-class="active">Posts</router-link>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// No script logic needed in App.vue
</script>

<style>
/* Remove component-specific styles from App.vue if they are now covered by shared-styles.css */
/* For example, if #app-container and nav styles from shared-styles.css are sufficient,
   the <style> block in App.vue can be emptied or removed. */

/* If style.css or main.css (imported in main.ts) handles global body styles,
   those can also be removed from here. */

/* Keep this style block if there are styles specific ONLY to App.vue's template
   that aren't part of the shared design system. */

/* It's good practice to rely on the cascade and specificity from shared-styles.css
   and global style sheets (like style.css) first. */
</style>
