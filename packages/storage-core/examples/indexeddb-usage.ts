/**
 * IndexedDB usage examples for @web-loom/storage-core
 */

import { createStorage } from '../src/index';

/**
 * Example 1: Basic IndexedDB usage
 */
async function basicIndexedDB() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'my-app-db',
  });

  // Store large objects (IndexedDB handles large data better than localStorage)
  await storage.set('user-profile', {
    id: '123',
    name: 'Alice',
    avatar: 'base64-encoded-image-data...',
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: true,
    },
  });

  const profile = await storage.get('user-profile');
  console.log('Profile:', profile);

  await storage.dispose();
}

/**
 * Example 2: Storing binary data
 */
async function storeBinaryData() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'media-app',
  });

  // IndexedDB can store ArrayBuffers, Blobs, etc.
  const imageData = new Uint8Array([1, 2, 3, 4, 5]);
  await storage.set('cached-image', imageData);

  const retrieved = await storage.get<Uint8Array>('cached-image');
  console.log('Image data:', retrieved);

  await storage.dispose();
}

/**
 * Example 3: Offline-first application
 */
async function offlineFirstApp() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'offline-notes',
    namespace: 'notes',
  });

  // Store notes for offline access
  const notes = [
    { id: '1', title: 'Meeting Notes', content: 'Discussed project timeline...' },
    { id: '2', title: 'Todo List', content: '1. Review PR\n2. Update docs' },
    { id: '3', title: 'Ideas', content: 'New feature ideas...' },
  ];

  for (const note of notes) {
    await storage.set(`note:${note.id}`, note);
  }

  // Retrieve all notes
  const allNotes = await storage.entries();
  console.log('All notes:', allNotes);

  await storage.dispose();
}

/**
 * Example 4: Caching API responses
 */
async function cacheAPIResponses() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'api-cache',
    defaultTTL: 3600000, // 1 hour
  });

  // Cache API response
  const apiResponse = {
    data: [{ id: 1, name: 'Item 1' }],
    timestamp: Date.now(),
  };

  await storage.set('api:users', apiResponse, { ttl: 1800000 }); // 30 minutes

  // Check cache before making API call
  const cached = await storage.get('api:users');
  if (cached) {
    console.log('Using cached data:', cached);
  } else {
    console.log('Cache expired, fetching fresh data...');
  }

  await storage.dispose();
}

/**
 * Example 5: Progressive Web App (PWA) data storage
 */
async function pwaDataStorage() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'pwa-app',
    version: 1,
  });

  // Store app state
  await storage.set('app-state', {
    lastSync: Date.now(),
    pendingChanges: [],
    userSettings: {
      theme: 'dark',
      fontSize: 16,
    },
  });

  // Store offline queue
  await storage.set('offline-queue', [
    { action: 'create', resource: 'post', data: { title: 'New Post' } },
    { action: 'update', resource: 'user', data: { name: 'Updated Name' } },
  ]);

  await storage.dispose();
}

/**
 * Example 6: Large dataset storage
 */
async function largeDatasetStorage() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'analytics-app',
  });

  // Store analytics events (IndexedDB can handle thousands of entries)
  const events = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    type: 'page_view',
    timestamp: Date.now() - i * 1000,
    data: { page: `/page-${i}` },
  }));

  for (const event of events) {
    await storage.set(`event:${event.id}`, event);
  }

  console.log('Stored 1000 events');

  // Query events
  const allKeys = await storage.keys();
  console.log(`Total events: ${allKeys.length}`);

  await storage.dispose();
}

/**
 * Example 7: Multi-namespace organization
 */
async function multiNamespaceOrganization() {
  // Create separate storage instances for different data types
  const userStorage = await createStorage({
    backend: 'indexeddb',
    name: 'app-db',
    namespace: 'users',
  });

  const postStorage = await createStorage({
    backend: 'indexeddb',
    name: 'app-db',
    namespace: 'posts',
  });

  const commentStorage = await createStorage({
    backend: 'indexeddb',
    name: 'app-db',
    namespace: 'comments',
  });

  // Store data in different namespaces
  await userStorage.set('user:1', { name: 'Alice' });
  await postStorage.set('post:1', { title: 'Hello World' });
  await commentStorage.set('comment:1', { text: 'Great post!' });

  // Each namespace is isolated
  console.log('User keys:', await userStorage.keys());
  console.log('Post keys:', await postStorage.keys());
  console.log('Comment keys:', await commentStorage.keys());

  await userStorage.dispose();
  await postStorage.dispose();
  await commentStorage.dispose();
}

/**
 * Example 8: Fallback from IndexedDB to localStorage
 */
async function fallbackStrategy() {
  const storage = await createStorage({
    backend: ['indexeddb', 'localstorage', 'memory'],
    name: 'resilient-app',
    onFallback: (from, to, reason) => {
      console.warn(`Storage fallback: ${from} -> ${to} (${reason})`);
    },
  });

  console.log('Active backend:', storage.activeBackend);
  console.log('Features:', storage.features);

  await storage.set('data', { value: 'test' });

  await storage.dispose();
}

/**
 * Example 9: Quota management
 */
async function quotaManagement() {
  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'quota-aware-app',
  });

  // Check quota before storing large data
  const quota = await storage.getQuotaUsage();
  console.log(`Storage usage: ${quota.percent.toFixed(2)}%`);
  console.log(`Used: ${(quota.used / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Available: ${(quota.available / 1024 / 1024).toFixed(2)} MB`);

  if (quota.percent < 80) {
    // Safe to store more data
    await storage.set('large-data', new Array(1000).fill({ data: 'test' }));
  } else {
    console.warn('Storage quota nearly full, consider cleanup');
  }

  await storage.dispose();
}

export {
  basicIndexedDB,
  storeBinaryData,
  offlineFirstApp,
  cacheAPIResponses,
  pwaDataStorage,
  largeDatasetStorage,
  multiNamespaceOrganization,
  fallbackStrategy,
  quotaManagement,
};
