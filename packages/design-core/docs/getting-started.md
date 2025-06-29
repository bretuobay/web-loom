# Getting Started with QueryCore

This guide will walk you through installing QueryCore and setting up your first data-fetching endpoint.

## Installation

```bash
npm install query-core
# or
yarn add query-core
```

_(Assuming package name will be 'query-core')_

## Basic Usage

```typescript
import { QueryCore } from 'query-core';

// 1. Initialize QueryCore
const qc = new QueryCore({
  // Optional global configurations
  // cacheProvider: 'indexedDB', // Default is 'localStorage'
  // defaultRefetchAfter: 60000 // 1 minute
});

// 2. Define an API endpoint
const fetchTodos = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

await qc.defineEndpoint('todos', fetchTodos, {
  refetchAfter: 5 * 60 * 1000, // Refetch todos every 5 minutes
});

// 3. Subscribe to endpoint state in your component/module
const unsubscribeTodos = qc.subscribe('todos', (state) => {
  if (state.isLoading) {
    console.log('Todos are loading...');
  } else if (state.isError) {
    console.error('Error fetching todos:', state.error);
  } else if (state.data) {
    console.log('Todos data:', state.data);
    // Update your UI here
  }
});

// 4. (Optional) Manually trigger a refetch
// qc.refetch('todos');

// 5. (Optional) Invalidate cache for an endpoint
// qc.invalidate('todos');

// 6. Remember to unsubscribe when your component unmounts or is no longer needed
// unsubscribeTodos();
```

Next, learn about [Core Concepts](./core-concepts.md) or dive into the [API Reference](./api-reference.md).
