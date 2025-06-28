import QueryCore from './QueryCore';

// Example usage (optional, can be removed or moved to an example file)
const main = async () => {
  // Make main async
  const queryCore = new QueryCore({
    // Example: use IndexedDB for all endpoints by default for this instance
    // cacheProvider: 'indexedDB'
  });

  console.log('QueryCore Example: Defining endpoint...');
  // Use await for defineEndpoint as it now interacts with cache providers asynchronously
  await queryCore.defineEndpoint(
    'todos',
    async () => {
      console.log('QueryCore Example: Fetching todos...');
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    { refetchAfter: 5000 },
  );

  const unsubscribe = queryCore.subscribe('todos', (state) => {
    console.log('Todos state:', state);
  });

  console.log('QueryCore Example: Un Subscribed to todos endpoint.', unsubscribe);

  // To test refetch
  // setTimeout(() => queryCore.refetch('todos'), 2000);

  // To test unsubscribe
  // setTimeout(unsubscribe, 10000);
};

// Check if running in a browser environment before executing example code
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  // Also check process to avoid running in Node for Vite build/dev server if not careful
  main().catch((error) => {
    console.error('Error in QueryCore example main function:', error);
  });
}
