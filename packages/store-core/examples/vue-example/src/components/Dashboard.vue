<template>
  <div class="dashboard-container">
    <div v-if="isLoadingPosts" class="text-center mt-2">Loading dashboard data...</div>
    <div v-else-if="isErrorPosts" class="text-center mt-2 error-message">
      Error loading dashboard: {{ errorPosts?.message || 'Unknown error' }}
    </div>
    <template v-else>
      <div class="card">
        <h2 class="card-title">Total Posts</h2>
        <div class="card-content dashboard-total-posts">
          <p>{{ postsCount }} posts</p>
        </div>
      </div>
      <div class="card">
        <h2 class="card-title">Posts per User</h2>
        <div class="card-content">
          <ul v-if="Object.keys(userPostCounts).length > 0" class="list">
            <li v-for="(count, userId) in userPostCounts" :key="userId">User ID {{ userId }}: {{ count }} posts</li>
          </ul>
          <p v-else>No user post data available.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { queryCore, fetchPosts, POSTS_ENDPOINT_KEY, type Post, type EndpointState } from '../queryClient';

interface UserPostCounts {
  [userId: number]: number;
}

const postsState = ref<EndpointState<Post[]>>({
  data: undefined,
  isLoading: true,
  isError: false,
  error: undefined,
  lastUpdated: undefined,
});

let unsubscribe: (() => void) | undefined;

onMounted(async () => {
  await queryCore.defineEndpoint<Post[]>(POSTS_ENDPOINT_KEY, fetchPosts);

  unsubscribe = queryCore.subscribe<Post[]>(POSTS_ENDPOINT_KEY, (state) => {
    postsState.value = state;
  });

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

const isLoadingPosts = computed(() => postsState.value.isLoading);
const isErrorPosts = computed(() => postsState.value.isError);
const errorPosts = computed(() => postsState.value.error);

const postsCount = computed(() => {
  return postsState.value.data ? postsState.value.data.length : 0;
});

const userPostCounts = computed<UserPostCounts>(() => {
  if (!postsState.value.data) {
    return {};
  }
  const counts: UserPostCounts = {};
  postsState.value.data.forEach((post) => {
    counts[post.userId] = (counts[post.userId] || 0) + 1;
  });
  return counts;
});
</script>

<style scoped>
/* Scoped styles for Dashboard.vue can be removed if all styling
   is handled by shared-styles.css or global styles.
   If there are dashboard-specific styles that don't belong in the shared system,
   they can remain here. For this task, we assume shared styles cover card layout. */
</style>
