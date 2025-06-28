// tests/mocks/mockIndexedDB.ts
import { CachedItem } from '../cacheProviders/CacheProvider'; // Adjusted path

interface MockIDBStore {
  [key: string]: { key: string; value: CachedItem<any> };
}

let originalIndexedDB: IDBFactory | null = null;
let mockDBStore: MockIDBStore = {};
let dbShouldFail = false; // Global switch to make DB operations fail
let operationDelay = 0; // Simulate async delay

const MOCK_DB_NAME = 'QueryCoreDB'; // Must match what provider uses
const MOCK_STORE_NAME = 'QueryCoreCache'; // Must match

class MockIDBRequest {
  public result: any;
  public error: DOMException | null = null;
  public onsuccess: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  private eventTarget: EventTarget;

  constructor(result?: any, error?: DOMException) {
    this.result = result;
    this.error = error || null;
    this.eventTarget = new EventTarget(); // Basic event target
  }

  // Helper to dispatch events
  _dispatch(type: 'success' | 'error') {
    const event = new Event(type);
    Object.defineProperty(event, 'target', { value: this, writable: false });
    if (type === 'success' && this.onsuccess) {
      setTimeout(() => this.onsuccess!(event), operationDelay);
    } else if (type === 'error' && this.onerror) {
      setTimeout(() => this.onerror!(event), operationDelay);
    }
  }
}

class MockIDBObjectStore {
  constructor(private storeName: string /*, private transaction: MockIDBTransaction*/) {}

  get(key: any): IDBRequest {
    const request = new MockIDBRequest();
    if (dbShouldFail) {
      request.error = new DOMException('Mocked DB get error', 'AbortError');
      request._dispatch('error');
    } else {
      request.result = mockDBStore[key];
      request._dispatch('success');
    }
    return request as unknown as IDBRequest;
  }

  put(value: any, key?: any): IDBRequest {
    // key is part of value for QueryCore
    const request = new MockIDBRequest();
    const itemKey = value.key || key;
    if (dbShouldFail) {
      request.error = new DOMException('Mocked DB put error', 'AbortError');
      request._dispatch('error');
    } else {
      mockDBStore[itemKey] = value; // In QueryCore, value is { key: string, value: CachedItem }
      request.result = itemKey; // Standard put returns the key
      request._dispatch('success');
    }
    return request as unknown as IDBRequest;
  }

  delete(key: any): IDBRequest {
    const request = new MockIDBRequest();
    if (dbShouldFail) {
      request.error = new DOMException('Mocked DB delete error', 'AbortError');
      request._dispatch('error');
    } else {
      delete mockDBStore[key];
      request._dispatch('success');
    }
    return request as unknown as IDBRequest;
  }

  clear(): IDBRequest {
    const request = new MockIDBRequest();
    if (dbShouldFail) {
      request.error = new DOMException('Mocked DB clear error', 'AbortError');
      request._dispatch('error');
    } else {
      mockDBStore = {};
      request._dispatch('success');
    }
    return request as unknown as IDBRequest;
  }
  // Add other methods like createIndex, openCursor if needed by QueryCore later
}

class MockIDBTransaction {
  public oncomplete: ((event: Event) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  public onabort: ((event: Event) => void) | null = null;
  private eventTarget: EventTarget;

  constructor(
    private storeNames: string | string[],
    public mode: IDBTransactionMode,
    private db: MockIDBDatabase,
  ) {
    this.eventTarget = new EventTarget();
  }

  objectStore(name: string): IDBObjectStore {
    if (this.storeNames !== name && !(Array.isArray(this.storeNames) && this.storeNames.includes(name))) {
      throw new DOMException('Store not in transaction scope', 'NotFoundError');
    }
    if (name !== MOCK_STORE_NAME) {
      throw new DOMException(`Mock store "${name}" not found`, 'NotFoundError');
    }
    return new MockIDBObjectStore(name /*, this*/) as unknown as IDBObjectStore;
  }

  // These are typically called by the browser after requests complete.
  // For simplicity, we might not need to fully simulate this unless tests depend on it.
  _commit() {
    if (this.oncomplete) setTimeout(() => this.oncomplete(new Event('complete')), operationDelay + 10);
  }
  _abort(error?: DOMException) {
    if (this.onerror && error) {
      const event = new Event('error') as any;
      event.target = { error };
      setTimeout(() => this.onerror!(event), operationDelay + 10);
    } else if (this.onabort) {
      setTimeout(() => this.onabort!(new Event('abort')), operationDelay + 10);
    }
  }
}

class MockIDBDatabase {
  public objectStoreNames: DOMStringList = {
    length: 1,
    item: (index: number) => (index === 0 ? MOCK_STORE_NAME : null),
    contains: (name: string) => name === MOCK_STORE_NAME,
  } as DOMStringList;
  public onversionchange: ((event: IDBVersionChangeEvent) => void) | null = null;

  constructor(
    public name: string,
    public version: number,
  ) {}

  transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction {
    if (dbShouldFail && mode === 'readwrite') {
      // Make transactions fail if dbShouldFail
      const tx = new MockIDBTransaction(storeNames, mode || 'readonly', this);
      setTimeout(() => tx._abort(new DOMException('Mocked transaction error', 'AbortError')), 0);
      return tx as unknown as IDBTransaction;
    }
    const tx = new MockIDBTransaction(storeNames, mode || 'readonly', this);
    // Auto-commit for simplicity in mock, real IDB waits for requests.
    // setTimeout(() => tx._commit(), operationDelay + 50); // Simplified auto-commit
    return tx as unknown as IDBTransaction;
  }

  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore {
    if (name !== MOCK_STORE_NAME) throw new Error('Mock supports only one store: ' + MOCK_STORE_NAME);
    // For QueryCore, keyPath is 'key'.
    if (options?.keyPath !== 'key') console.warn('MockIDB: QueryCore expects keyPath "key"');
    // Object store creation is part of onupgradeneeded, already "created" for mock.
    return new MockIDBObjectStore(name) as unknown as IDBObjectStore;
  }

  close() {
    /* no-op for mock */
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  public onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null = null;
  private dbInstance: MockIDBDatabase;

  constructor(name: string, version: number) {
    super();
    this.dbInstance = new MockIDBDatabase(name, version);
    this.result = this.dbInstance; // `open` request result is the database
  }

  _dispatchOpen(currentVersion: number, newVersion: number) {
    if (dbShouldFail) {
      this.error = new DOMException('Mocked DB open error', 'AbortError');
      super._dispatch('error');
      return;
    }

    if (newVersion > currentVersion && this.onupgradeneeded) {
      const event = new Event('upgradeneeded') as IDBVersionChangeEvent;
      Object.defineProperty(event, 'target', { value: this, writable: false });
      Object.defineProperty(event, 'oldVersion', { value: currentVersion, writable: false });
      Object.defineProperty(event, 'newVersion', { value: newVersion, writable: false });

      // In a real scenario, transaction is auto-created for onupgradeneeded
      // For mock, we can directly call it.
      setTimeout(() => {
        this.onupgradeneeded!(event);
        // After onupgradeneeded, onsuccess should fire for the open request
        if (this.onsuccess) {
          super._dispatch('success');
        }
      }, operationDelay);
    } else if (this.onsuccess) {
      super._dispatch('success');
    }
  }
}

export function setupMockIndexedDB() {
  if (!originalIndexedDB) {
    originalIndexedDB = window.indexedDB;
  }
  mockDBStore = {};
  dbShouldFail = false;
  operationDelay = 0;

  const mockIDBFactory: IDBFactory = {
    open: (name: string, version?: number): IDBOpenDBRequest => {
      if (name !== MOCK_DB_NAME) {
        throw new Error(`MockIDB: QueryCore expects DB name "${MOCK_DB_NAME}"`);
      }
      const request = new MockIDBOpenDBRequest(name, version || 1);
      // Simulate the open process: potentially call onupgradeneeded then onsuccess
      // For simplicity, we'll assume version 1 for now. If version increases, onupgradeneeded is called.
      // Let's assume current mock DB version is 0 to always trigger upgradeneeded for version 1.
      request._dispatchOpen(0, version || 1);
      return request as unknown as IDBOpenDBRequest;
    },
    deleteDatabase: (name: string): IDBOpenDBRequest => {
      const request = new MockIDBOpenDBRequest(name, 1); // Version doesn't matter much for delete
      if (name === MOCK_DB_NAME) {
        mockDBStore = {}; // Effectively deletes the data
      }
      setTimeout(() => request._dispatch('success'), operationDelay);
      return request as unknown as IDBOpenDBRequest;
    },
    cmp: (first: any, second: any): number => {
      // Basic comparison, not fully spec compliant
      if (first < second) return -1;
      if (first > second) return 1;
      return 0;
    },
  };

  Object.defineProperty(window, 'indexedDB', {
    value: mockIDBFactory,
    writable: true,
    configurable: true,
  });
}

export function resetMockIndexedDB() {
  if (originalIndexedDB) {
    Object.defineProperty(window, 'indexedDB', {
      value: originalIndexedDB,
      writable: true, // Assuming original might have specific descriptor
      configurable: true,
    });
  }
  mockDBStore = {};
  dbShouldFail = false;
  operationDelay = 0;
  originalIndexedDB = null;
}

export function getMockIndexedDBStore(): Readonly<MockIDBStore> {
  return { ...mockDBStore };
}

export function setMockIndexedDBStore(store: MockIDBStore) {
  mockDBStore = { ...store };
}

export function setMockIndexedDBShouldFail(shouldFail: boolean) {
  dbShouldFail = shouldFail;
}

export function setMockIndexedDBOperationDelay(delay: number) {
  operationDelay = delay;
}
