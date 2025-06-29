<template>
  <div class="posts-list-container">
    <h1 class="text-center mb-2">Posts</h1>
    <div v-if="isLoading" class="text-center mt-2">Loading posts...</div>
    <div v-else-if="isError" class="text-center mt-2 error-message">
      Error fetching posts: {{ error?.message || 'Unknown error' }}
    </div>
    <ul v-else-if="posts && posts.length > 0" class="posts-list">
      <li v-for="post in posts" :key="post.id">
        <router-link :to="`/posts/${post.id}`">
          {{ post.title }}
        </router-link>
        <!-- Optional: Add a snippet of post.body if desired -->
        <!-- <p>{{ post.body.substring(0, 100) }}...</p> -->
      </li>
    </ul>
    <div v-else class="text-center mt-2">No posts found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { queryCore, fetchPosts, POSTS_ENDPOINT_KEY, type Post, type EndpointState } from '../queryClient'; // Added Post and EndpointState

const postsState = ref<EndpointState<Post[]>>({
  data: undefined,
  isLoading: true,
  isError: false,
  error: undefined,
  lastUpdated: undefined,
});

let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  // Define the endpoint
  await queryCore.defineEndpoint<Post[]>(POSTS_ENDPOINT_KEY, fetchPosts);

  // Subscribe to the endpoint
  unsubscribe = queryCore.subscribe<Post[]>(POSTS_ENDPOINT_KEY, (state) => {
    postsState.value = state;
  });

  // Initial fetch if not already loading or data not present
  const currentState = queryCore.getState<Post[]>(POSTS_ENDPOINT_KEY);
  if (!currentState.isLoading && !currentState.data) {
    queryCore.refetch<Post[]>(POSTS_ENDPOINT_KEY);
  }
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

import { computed } from 'vue'; // Import computed

// Computed properties to be used in the template
const isLoading = computed(() => postsState.value.isLoading);
const isError = computed(() => postsState.value.isError);
const error = computed(() => postsState.value.error);
const posts = computed(() => postsState.value.data);
</script>

<style scoped>
/* Scoped styles for PostsList.vue can be removed if all styling
   is handled by shared-styles.css or global styles.
   The .posts-list class from shared-styles.css should cover the list styling.
   If there are specific styles for this component that don't belong
   in the shared system, they can remain here. */
</style>
