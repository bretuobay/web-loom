/**
 * Migration examples for @web-loom/storage-core
 */

import { createStorage } from '../src/index';
import type { MigrationFunction } from '../src/types';

/**
 * Example 1: Simple schema migration
 */
async function simpleSchemaChange() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {
      // Initial schema - no migration needed
    },
    2: async (store) => {
      // Rename 'userName' to 'displayName'
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.userName) {
          value.displayName = value.userName;
          delete value.userName;
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'user-app',
    version: 2,
    migrations,
  });

  console.log('Storage ready with migrations applied');
  await storage.dispose();
}

/**
 * Example 2: Adding default values
 */
async function addDefaultValues() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      // Add default 'role' field to all users
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (key.startsWith('user:') && !value.role) {
          value.role = 'member';
          await store.set(key, value);
        }
      }
    },
    3: async (store) => {
      // Add 'createdAt' timestamp
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (!value.createdAt) {
          value.createdAt = Date.now();
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'user-app',
    version: 3,
    migrations,
  });

  return storage;
}

/**
 * Example 3: Data transformation
 */
async function transformData() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      // Convert string dates to timestamps
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.dateOfBirth && typeof value.dateOfBirth === 'string') {
          value.dateOfBirth = new Date(value.dateOfBirth).getTime();
          await store.set(key, value);
        }
      }
    },
    3: async (store) => {
      // Normalize email addresses
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.email && typeof value.email === 'string') {
          value.email = value.email.toLowerCase().trim();
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'contacts-app',
    version: 3,
    migrations,
  });

  return storage;
}

/**
 * Example 4: Restructuring nested data
 */
async function restructureData() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      // Flatten nested address structure
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.address && typeof value.address === 'object') {
          value.street = value.address.street;
          value.city = value.address.city;
          value.zipCode = value.address.zipCode;
          delete value.address;
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'address-book',
    version: 2,
    migrations,
  });

  return storage;
}

/**
 * Example 5: Removing deprecated fields
 */
async function cleanupDeprecatedFields() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      // Remove deprecated 'legacyId' field
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.legacyId) {
          delete value.legacyId;
          await store.set(key, value);
        }
      }
    },
    3: async (store) => {
      // Remove temporary flags
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (value.tempFlag !== undefined) {
          delete value.tempFlag;
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'clean-app',
    version: 3,
    migrations,
  });

  return storage;
}

/**
 * Example 6: Conditional migrations
 */
async function conditionalMigrations() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      // Only migrate items that match certain criteria
      const entries = await store.entries();
      for (const [key, value] of entries) {
        // Only update premium users
        if (value.isPremium) {
          value.features = ['advanced-analytics', 'priority-support'];
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'premium-app',
    version: 2,
    migrations,
  });

  return storage;
}

/**
 * Example 7: Migration with progress tracking
 */
async function migrationWithProgress() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {},
    2: async (store) => {
      const entries = await store.entries();
      let processed = 0;
      for (const [key, value] of entries) {
        value.version = 2;
        await store.set(key, value);
        processed++;
        console.log(`Migrated ${processed}/${entries.length} items`);
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'progress-app',
    version: 2,
    migrations,
  });

  return storage;
}

/**
 * Example 8: Real-world e-commerce migration
 */
async function ecommerceMigration() {
  const migrations: Record<number, MigrationFunction> = {
    1: async () => {
      // Initial schema
    },
    2: async (store) => {
      // Add cart items structure
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (key.startsWith('cart:')) {
          if (!value.items) {
            value.items = [];
          }
          if (!value.total) {
            value.total = 0;
          }
          await store.set(key, value);
        }
      }
    },
    3: async (store) => {
      // Add order history
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (key.startsWith('user:')) {
          if (!value.orderHistory) {
            value.orderHistory = [];
          }
          await store.set(key, value);
        }
      }
    },
    4: async (store) => {
      // Migrate pricing to include tax
      const entries = await store.entries();
      for (const [key, value] of entries) {
        if (key.startsWith('product:') && value.price) {
          value.priceWithTax = value.price * 1.1; // 10% tax
          await store.set(key, value);
        }
      }
    },
  };

  const storage = await createStorage({
    backend: 'indexeddb',
    name: 'ecommerce-app',
    version: 4,
    migrations,
  });

  return storage;
}

export {
  simpleSchemaChange,
  addDefaultValues,
  transformData,
  restructureData,
  cleanupDeprecatedFields,
  conditionalMigrations,
  migrationWithProgress,
  ecommerceMigration,
};
