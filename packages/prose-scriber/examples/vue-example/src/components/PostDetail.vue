<template>
  <div class="post-detail-container">
    <div v-if="isLoading" class="text-center mt-2">Loading post details...</div>
    <div v-else-if="isError" class="text-center mt-2 error-message">
      Error fetching post: {{ error?.message || 'Unknown error' }}
    </div>
    <div v-else-if="post">
      <h1>{{ post.title }}</h1>
      <p>{{ post.body }}</p>
      <small class="post-meta">User ID: {{ post.userId }}</small>
      <small class="post-meta">Post ID: {{ post.id }}</small>
    </div>
    <div v-else class="text-center mt-2">Post not found.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  queryCore,
  fetchPostById,
  POST_DETAIL_ENDPOINT_KEY_PREFIX,
  type Post,
  type EndpointState,
} from '../queryClient';

const route = useRoute();
const postId = computed(() => route.params.id as string);

const postState = ref<EndpointState<Post>>({
  data: undefined,
  isLoading: true,
  isError: false,
  error: undefined,
  lastUpdated: undefined,
});

let unsubscribe: (() => void) | undefined;
const currentEndpointKey = ref('');

async function setupEndpoint(id: string) {
  if (!id) {
    postState.value = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Post ID is missing'),
      lastUpdated: undefined,
    };
    return;
  }

  const endpointKey = `${POST_DETAIL_ENDPOINT_KEY_PREFIX}${id}`;
  currentEndpointKey.value = endpointKey;

  // Clean up previous subscription if any
  if (unsubscribe) {
    unsubscribe();
  }

  await queryCore.defineEndpoint<Post>(endpointKey, () => fetchPostById(id));

  unsubscribe = queryCore.subscribe<Post>(endpointKey, (state) => {
    postState.value = state;
  });

  const currentState = queryCore.getState<Post>(endpointKey);
  if (!currentState.isLoading && !currentState.data) {
    queryCore.refetch<Post>(endpointKey);
  }
}

watch(
  postId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      setupEndpoint(newId);
    }
  },
  { immediate: true },
); // immediate: true to run on component mount

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
  // Optional: Invalidate or clean up the specific post detail endpoint
  // if (currentEndpointKey.value) {
  //   queryCore.invalidate(currentEndpointKey.value);
  // }
});

// Computed properties for the template
const isLoading = computed(() => postState.value.isLoading);
const isError = computed(() => postState.value.isError);
const error = computed(() => postState.value.error);
const post = computed(() => postState.value.data);
</script>

<style scoped>
/* Scoped styles for PostDetail.vue can be removed if all styling
   is handled by shared-styles.css or global styles.
   The .post-detail-container class from shared-styles.css should cover the container styling.
   If there are specific styles for this component that don't belong
   in the shared system, they can remain here. */

/* .post-meta styling is now in shared-styles.css */
</style>
