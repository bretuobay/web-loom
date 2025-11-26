import type { State } from './index';

/**
 * Interface for persistence adapters that handle saving/loading state to different storage backends.
 */
export interface PersistenceAdapter<S extends State> {
  /**
   * Saves the state to the storage backend.
   * @param key The storage key
   * @param state The state to save
   * @returns Promise that resolves when save is complete
   */
  save(key: string, state: S): Promise<void>;

  /**
   * Loads the state from the storage backend.
   * @param key The storage key
   * @returns Promise that resolves with the loaded state, or null if not found
   */
  load(key: string): Promise<S | null>;

  /**
   * Removes the state from the storage backend.
   * @param key The storage key
   * @returns Promise that resolves when removal is complete
   */
  remove(key: string): Promise<void>;

  /**
   * Checks if a key exists in storage.
   * @param key The storage key
   * @returns Promise that resolves with true if key exists
   */
  has(key: string): Promise<boolean>;
}

/**
 * Configuration for store persistence.
 */
export interface PersistenceConfig<S extends State> {
  /**
   * The persistence adapter to use
   */
  adapter: PersistenceAdapter<S>;

  /**
   * The key/name used to store the state
   */
  key: string;

  /**
   * Whether to automatically sync state changes (default: true)
   */
  autoSync?: boolean;

  /**
   * Custom serializer (default: JSON.stringify)
   */
  serialize?: (state: S) => string;

  /**
   * Custom deserializer (default: JSON.parse)
   */
  deserialize?: (data: string) => S;

  /**
   * Whether to merge loaded state with initial state (default: false)
   * If true, loaded state is merged with initialState
   * If false, loaded state replaces initialState completely
   */
  merge?: boolean;
}

/**
 * In-memory persistence adapter (useful for testing or temporary persistence)
 */
export class MemoryAdapter<S extends State> implements PersistenceAdapter<S> {
  private storage: Map<string, string> = new Map();

  async save(key: string, state: S): Promise<void> {
    const serialized = JSON.stringify(state);
    this.storage.set(key, serialized);
  }

  async load(key: string): Promise<S | null> {
    const serialized = this.storage.get(key);
    if (!serialized) {
      return null;
    }
    try {
      return JSON.parse(serialized) as S;
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  /**
   * Clear all data from memory (useful for testing)
   */
  clear(): void {
    this.storage.clear();
  }
}

/**
 * Browser localStorage persistence adapter
 */
export class LocalStorageAdapter<S extends State> implements PersistenceAdapter<S> {
  async save(key: string, state: S): Promise<void> {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(key, serialized);
    } catch (error) {
      // Handle quota exceeded or other localStorage errors
      console.error(`LocalStorageAdapter: Failed to save state for key "${key}"`, error);
      throw error;
    }
  }

  async load(key: string): Promise<S | null> {
    try {
      const serialized = localStorage.getItem(key);
      if (serialized === null) {
        return null;
      }
      return JSON.parse(serialized) as S;
    } catch (error) {
      console.error(`LocalStorageAdapter: Failed to load state for key "${key}"`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`LocalStorageAdapter: Failed to remove state for key "${key}"`, error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}

/**
 * Browser IndexedDB persistence adapter (for larger datasets)
 */
export class IndexedDBAdapter<S extends State> implements PersistenceAdapter<S> {
  private dbName: string;
  private storeName: string = 'store-state';
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(dbName: string = 'store-core-db') {
    this.dbName = dbName;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error(`IndexedDB: Failed to open database "${this.dbName}"`));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });

    return this.dbPromise;
  }

  async save(key: string, state: S): Promise<void> {
    try {
      const db = await this.getDB();
      const serialized = JSON.stringify(state);

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(serialized, key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`IndexedDB: Failed to save state for key "${key}"`));
      });
    } catch (error) {
      console.error(`IndexedDBAdapter: Failed to save state for key "${key}"`, error);
      throw error;
    }
  }

  async load(key: string): Promise<S | null> {
    try {
      const db = await this.getDB();

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          const serialized = request.result;
          if (serialized === undefined) {
            resolve(null);
          } else {
            try {
              resolve(JSON.parse(serialized) as S);
            } catch {
              resolve(null);
            }
          }
        };

        request.onerror = () => {
          console.error(`IndexedDB: Failed to load state for key "${key}"`);
          resolve(null);
        };
      });
    } catch (error) {
      console.error(`IndexedDBAdapter: Failed to load state for key "${key}"`, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`IndexedDB: Failed to remove state for key "${key}"`));
      });
    } catch (error) {
      console.error(`IndexedDBAdapter: Failed to remove state for key "${key}"`, error);
      throw error;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result !== undefined);
        };

        request.onerror = () => {
          reject(new Error(`IndexedDB: Failed to check existence for key "${key}"`));
        };
      });
    } catch {
      return false;
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }
}
