/**
 * Basic usage examples for @web-loom/storage-core
 */

import { createStorage } from '../src/index';

async function basicExample() {
  // Create storage instance
  const storage = await createStorage({
    backend: 'memory',
    name: 'demo-app',
    namespace: 'user-data',
  });

  // Store user preferences
  await storage.set('theme', { mode: 'dark', accent: '#6366f1' });
  await storage.set('language', 'en');

  // Retrieve values
  const theme = await storage.get('theme');
  console.log('Theme:', theme);

  // Check existence
  const hasLanguage = await storage.has('language');
  console.log('Has language:', hasLanguage);

  // Get all keys
  const keys = await storage.keys();
  console.log('All keys:', keys);

  // Delete a value
  await storage.delete('language');

  // Clear all
  await storage.clear();
}

async function ttlExample() {
  const storage = await createStorage({
    backend: 'memory',
    name: 'cache',
    defaultTTL: 60000, // 1 minute default
  });

  // Store with custom TTL (5 seconds)
  await storage.set('session-token', 'abc123', { ttl: 5000 });

  console.log('Token:', await storage.get('session-token'));

  // Wait 6 seconds
  await new Promise((resolve) => setTimeout(resolve, 6000));

  console.log('Token after expiry:', await storage.get('session-token')); // null
}

async function eventsExample() {
  const storage = await createStorage({
    backend: 'memory',
    name: 'app',
  });

  // Subscribe to all changes
  storage.subscribe('*', (event) => {
    console.log(`${event.key} changed:`, event.oldValue, '->', event.newValue);
  });

  // Subscribe to specific pattern
  storage.subscribe('user:*', (event) => {
    console.log('User data changed:', event.key);
  });

  await storage.set('user:123', { name: 'Alice' });
  await storage.set('settings', { notifications: true });
}

async function fallbackExample() {
  const storage = await createStorage({
    backend: ['indexeddb', 'localstorage', 'memory'],
    name: 'resilient-app',
    onFallback: (from, to, reason) => {
      console.warn(`Fell back from ${from} to ${to}: ${reason}`);
    },
  });

  console.log('Active backend:', storage.activeBackend);
  console.log('Features:', storage.features);
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    console.log('=== Basic Example ===');
    await basicExample();

    console.log('\n=== TTL Example ===');
    await ttlExample();

    console.log('\n=== Events Example ===');
    await eventsExample();

    console.log('\n=== Fallback Example ===');
    await fallbackExample();
  })();
}
