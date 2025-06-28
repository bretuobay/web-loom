import { QueryCore } from 'query-core-client';
import type { EndpointState } from 'query-core-client'; // Use type-only import for interfaces

// Define the type for a Post
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// Create a single QueryCore instance to be used throughout the app
export const queryCore = new QueryCore({
  // global options if any, e.g.
  // defaultRefetchAfter: 1000 * 60 * 5, // 5 minutes
  cacheProvider: 'indexedDB', // Use in-memory cache for simplicity
});

// Endpoint keys
export const POSTS_ENDPOINT_KEY = 'posts';
export const POST_DETAIL_ENDPOINT_KEY_PREFIX = 'postDetail_';

// Fetcher functions
export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts');
  if (!response.ok) {
    throw new Error('Network response was not ok for posts');
  }
  return response.json();
}

export async function fetchPostById(id: string | number): Promise<Post> {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  if (!response.ok) {
    throw new Error(`Network response was not ok for post ${id}`);
  }
  return response.json();
}

// Re-export EndpointState if needed by components, though often it's used internally by hooks/composables
export type { EndpointState };
