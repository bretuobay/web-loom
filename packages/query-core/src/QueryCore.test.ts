import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import QueryCore, { QueryCoreOptions } from './QueryCore';
import { LocalStorageCacheProvider } from './cacheProviders/LocalStorageCacheProvider';
import { IndexedDBCacheProvider } from './cacheProviders/IndexedDBCacheProvider';
import { InMemoryCacheProvider } from './cacheProviders/InMemoryCacheProvider'; // Added import
import { MockSimpleCacheProvider } from './mocks/MockSimpleCacheProvider';
import { mockFetch, resetFetch } from './mocks/mockFetch'; // Assuming mockFetch is still useful for some fetcher tests

describe('QueryCore', () => {
  let qc: QueryCore;

  beforeEach(() => {
    // Basic setup that might be common
    vi.useFakeTimers();
    mockFetch(); // Setup a default pass-through mock fetch
  });

  afterEach(() => {
    resetFetch();
    vi.restoreAllMocks(); // Restore any vi.spyOn or vi.mock
    vi.useRealTimers();
  });

  describe('Constructor & Setup', () => {
    it('should initialize with default global options if none provided', () => {
      qc = new QueryCore();
      // @ts-expect-error private property, but we can check it
      expect(qc.globalOptions.cacheProvider).toBe('inMemory');
      // @ts-expect-error private property, but we can check it
      expect(qc.globalOptions.defaultRefetchAfter).toBeUndefined();
    });

    it('should initialize with custom global options', () => {
      const options: QueryCoreOptions = {
        cacheProvider: 'indexedDB',
        defaultRefetchAfter: 10000,
      };
      qc = new QueryCore(options);
      // @ts-expect-error private property or method access
      expect(qc.globalOptions.cacheProvider).toBe('indexedDB');
      // @ts-expect-error private property or method access
      expect(qc.globalOptions.defaultRefetchAfter).toBe(10000);
    });

    it('should accept a custom cache provider instance in global options', () => {
      const customCache = new MockSimpleCacheProvider();
      const options: QueryCoreOptions = {
        cacheProvider: customCache,
      };
      qc = new QueryCore(options);
      // @ts-expect-error private property or method access
      expect(qc.globalOptions.cacheProvider).toBe(customCache);
    });

    it('should setup global event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      qc = new QueryCore(); // Constructor calls _setupGlobalEventListeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Endpoint Definition (defineEndpoint)', () => {
    let mockFetcher: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetcher = vi.fn(async () => ({ message: 'data' }));
      qc = new QueryCore();
    });

    it('should define an endpoint with a fetcher and default options', async () => {
      await qc.defineEndpoint('testEp', mockFetcher);
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint).toBeDefined();
      expect(endpoint?.fetcher).toBe(mockFetcher);
      expect(endpoint?.options.refetchAfter).toBeUndefined(); // Global default
      expect(endpoint?.cache).toBeInstanceOf(InMemoryCacheProvider); // Global default
      expect(endpoint?.state.isLoading).toBe(false);
    });

    it('should use global defaultRefetchAfter if not specified at endpoint level', async () => {
      qc = new QueryCore({ defaultRefetchAfter: 5000 });
      await qc.defineEndpoint('testEp', mockFetcher);
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint?.options.refetchAfter).toBe(5000);
    });

    it('should override global defaultRefetchAfter with endpoint-specific option', async () => {
      qc = new QueryCore({ defaultRefetchAfter: 5000 });
      await qc.defineEndpoint('testEp', mockFetcher, { refetchAfter: 1000 });
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint?.options.refetchAfter).toBe(1000);
    });

    it('should use global cacheProvider if not specified at endpoint level', async () => {
      qc = new QueryCore({ cacheProvider: 'indexedDB' });
      // Need to ensure IndexedDBCacheProvider mock/spy is in place if we test its instantiation
      // For now, let's use MockSimpleCacheProvider to simplify
      const simpleCache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: simpleCache });
      await qc.defineEndpoint('testEp', mockFetcher);
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint?.cache).toBe(simpleCache);
    });

    it('should override global cacheProvider with endpoint-specific option (string)', async () => {
      qc = new QueryCore({ cacheProvider: 'localStorage' });
      // This will try to instantiate IndexedDBCacheProvider.
      // For a unit test, we might want to spy/mock its constructor or use MockSimpleCacheProvider.
      // Let's assume the internal _getCacheProvider works for now.
      await qc.defineEndpoint('testEp', mockFetcher, { cacheProvider: 'indexedDB' });
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint?.cache).toBeInstanceOf(IndexedDBCacheProvider);
    });

    it('should override global cacheProvider with endpoint-specific option (instance)', async () => {
      const globalCache = new MockSimpleCacheProvider();
      const endpointCache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: globalCache });
      await qc.defineEndpoint('testEp', mockFetcher, { cacheProvider: endpointCache });
      // @ts-expect-error private property or method access
      const endpoint = qc.endpoints.get('testEp');
      expect(endpoint?.cache).toBe(endpointCache);
      expect(endpoint?.cache).not.toBe(globalCache);
    });

    it('should load initial data from cache if available during defineEndpoint', async () => {
      const cache = new MockSimpleCacheProvider();
      const initialData = { message: 'cached data' };
      const lastUpdated = Date.now() - 1000;
      cache.setInternalCache('testEp', { data: initialData, lastUpdated });

      qc = new QueryCore({ cacheProvider: cache });
      await qc.defineEndpoint('testEp', mockFetcher);

      const state = qc.getState('testEp');
      expect(state.data).toEqual(initialData);
      expect(state.lastUpdated).toBe(lastUpdated);
      expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('should notify subscribers with initial state after defineEndpoint', async () => {
      const cache = new MockSimpleCacheProvider();
      const initialData = { message: 'cached data' };
      const lastUpdated = Date.now();
      cache.setInternalCache('testEp', { data: initialData, lastUpdated });
      qc = new QueryCore({ cacheProvider: cache });

      const subscriber = vi.fn();
      // Define endpoint first
      await qc.defineEndpoint('testEp', mockFetcher);
      // Then subscribe
      qc.subscribe('testEp', subscriber);

      expect(subscriber).toHaveBeenCalledTimes(1); // Immediate call with current state
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          data: initialData,
          lastUpdated: lastUpdated,
          isLoading: false,
        }),
      );
    });
  });

  describe('Fetching Logic (refetch)', () => {
    let mockFetcher: ReturnType<typeof vi.fn>;
    const endpointKey = 'fetchTestEp';
    let cache: MockSimpleCacheProvider;

    beforeEach(async () => {
      mockFetcher = vi.fn();
      cache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: cache });
      // Define endpoint before each fetch test
      await qc.defineEndpoint(endpointKey, mockFetcher);
    });

    it('should call the fetcher function on refetch', async () => {
      mockFetcher.mockResolvedValueOnce({ message: 'fetched data' });
      await qc.refetch(endpointKey);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    it('should update state correctly on successful fetch', async () => {
      const data = { message: 'success' };
      mockFetcher.mockResolvedValueOnce(data);

      const refetchPromise = qc.refetch(endpointKey);

      let state = qc.getState(endpointKey);
      expect(state.isLoading).toBe(true);
      expect(state.isError).toBe(false);
      expect(state.error).toBeUndefined();

      await refetchPromise;

      state = qc.getState(endpointKey);
      expect(state.isLoading).toBe(false);
      expect(state.data).toEqual(data);
      expect(state.lastUpdated).toBeDefined();
      expect(state.isError).toBe(false);
      expect(state.error).toBeUndefined();
    });

    it('should save fetched data to cache on success', async () => {
      const data = { message: 'cached on success' };
      mockFetcher.mockResolvedValueOnce(data);
      const cacheSetSpy = vi.spyOn(cache, 'set');

      await qc.refetch(endpointKey);

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      const cachedItem = await cache.get(endpointKey);
      expect(cachedItem?.data).toEqual(data);
      expect(cachedItem?.lastUpdated).toBe(qc.getState(endpointKey).lastUpdated);
    });

    it('should update state correctly on fetch error', async () => {
      const error = new Error('Fetch failed');
      mockFetcher.mockRejectedValueOnce(error);

      const refetchPromise = qc.refetch(endpointKey);

      let state = qc.getState(endpointKey);
      expect(state.isLoading).toBe(true);

      await refetchPromise;

      state = qc.getState(endpointKey);
      expect(state.isLoading).toBe(false);
      expect(state.isError).toBe(true);
      expect(state.error).toBe(error);
      expect(state.data).toBeUndefined();
      const originalLastUpdated = qc.getState(endpointKey).lastUpdated;
      expect(state.lastUpdated).toBe(originalLastUpdated);
    });

    it('should be ignored if a fetch is already in progress', async () => {
      const data = { message: 'first fetch' };
      mockFetcher.mockImplementationOnce(async () => {
        await new Promise((r) => setTimeout(r, 100));
        return data;
      });

      const p1 = qc.refetch(endpointKey);
      expect(qc.getState(endpointKey).isLoading).toBe(true);

      const p2 = qc.refetch(endpointKey);

      expect(mockFetcher).toHaveBeenCalledTimes(1);

      await vi.runAllTimersAsync();

      await p1;
      await p2;

      expect(qc.getState(endpointKey).data).toEqual(data);
      expect(mockFetcher).toHaveBeenCalledTimes(1);
    });

    describe('refetchAfter logic', () => {
      beforeEach(() => {
        cache = new MockSimpleCacheProvider();
        qc = new QueryCore({ cacheProvider: cache });
      });

      it('should not refetch if data is fresh and forceRefetch is false', async () => {
        const initialData = { message: 'fresh data' };
        const now = Date.now();
        vi.setSystemTime(now);

        await cache.set(endpointKey, { data: initialData, lastUpdated: now - 1000 });
        await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

        mockFetcher.mockResolvedValueOnce({ message: 'new data' });
        await qc.refetch(endpointKey, false);

        expect(mockFetcher).not.toHaveBeenCalled();
        expect(qc.getState(endpointKey).data).toEqual(initialData);
      });

      it('should refetch if data is stale and forceRefetch is false', async () => {
        const initialData = { message: 'stale data' };
        const newData = { message: 'newly fetched' };
        const now = Date.now();
        vi.setSystemTime(now);

        await cache.set(endpointKey, { data: initialData, lastUpdated: now - 6000 });
        await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

        mockFetcher.mockResolvedValueOnce(newData);
        await qc.refetch(endpointKey, false);

        expect(mockFetcher).toHaveBeenCalledTimes(1);
        expect(qc.getState(endpointKey).data).toEqual(newData);
      });

      it('should refetch if forceRefetch is true, even if data is fresh', async () => {
        const initialData = { message: 'fresh data but forced' };
        const newData = { message: 'force fetched' };
        const now = Date.now();
        vi.setSystemTime(now);

        await cache.set(endpointKey, { data: initialData, lastUpdated: now - 1000 });
        await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

        mockFetcher.mockResolvedValueOnce(newData);
        await qc.refetch(endpointKey, true);

        expect(mockFetcher).toHaveBeenCalledTimes(1);
        expect(qc.getState(endpointKey).data).toEqual(newData);
      });

      it('should refetch if data is present but lastUpdated is undefined (treat as stale), and forceRefetch is false', async () => {
        const initialData = { message: 'data with no lastUpdated' };
        const newData = { message: 'fetched due to no lastUpdated' };
        // @ts-expect-error lastUpdated is intentionally undefined
        await cache.set(endpointKey, { data: initialData, lastUpdated: undefined });
        await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

        mockFetcher.mockResolvedValueOnce(newData);
        await qc.refetch(endpointKey, false);

        expect(mockFetcher).toHaveBeenCalledTimes(1);
        expect(qc.getState(endpointKey).data).toEqual(newData);
      });
      it('should refetch if no data and no lastUpdated, and forceRefetch is false', async () => {
        const newData = { message: 'fetched due to no data' };
        await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

        mockFetcher.mockResolvedValueOnce(newData);
        await qc.refetch(endpointKey, false);

        expect(mockFetcher).toHaveBeenCalledTimes(1);
        expect(qc.getState(endpointKey).data).toEqual(newData);
      });
    });
  });

  describe('State Retrieval (getState)', () => {
    const endpointKey = 'getStateTestEp';
    let mockFetcher: ReturnType<typeof vi.fn>;
    let cache: MockSimpleCacheProvider;

    beforeEach(async () => {
      mockFetcher = vi.fn(async () => ({ message: 'data' }));
      cache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: cache });
      await qc.defineEndpoint(endpointKey, mockFetcher);
    });

    it('should return the current state of an endpoint', async () => {
      const data = { message: 'current data' };
      mockFetcher.mockResolvedValueOnce(data);
      await qc.refetch(endpointKey);

      const state = qc.getState(endpointKey);
      expect(state.data).toEqual(data);
      expect(state.isLoading).toBe(false);
      expect(state.lastUpdated).toBeDefined();
    });

    it('should return a copy of the state, not a direct reference', async () => {
      const data = { message: 'original data', nested: { value: 1 } };
      mockFetcher.mockResolvedValueOnce(data);
      await qc.refetch(endpointKey);

      const state1 = qc.getState<{ message: string; nested: { value: number } }>(endpointKey);
      expect(state1.data).toEqual(data);

      if (state1.data) {
        state1.data.message = 'mutated data';
        state1.data.nested.value = 2;
      }

      const state2 = qc.getState(endpointKey);
      // @ts-expect-error data is typed, but we can check its structure
      expect(state2.data?.message).toBe('original data');
      // @ts-expect-error data is typed, but we can check its structure
      expect(state2.data?.nested?.value).toBe(1);
    });

    it('should return a default initial-like state for an undefined endpoint', () => {
      const unknownState = qc.getState('unknownEndpoint');
      expect(unknownState.data).toBeUndefined();
      expect(unknownState.isLoading).toBe(false);
      expect(unknownState.isError).toBe(false);
      expect(unknownState.error).toBeUndefined();
      expect(unknownState.lastUpdated).toBeUndefined();
    });
  });

  describe('Subscriptions (subscribe/unsubscribe)', () => {
    const endpointKey = 'subscribeTestEp';
    let mockFetcher: ReturnType<typeof vi.fn>;
    let cache: MockSimpleCacheProvider;

    beforeEach(async () => {
      mockFetcher = vi.fn(); // Default mock for the suite
      cache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: cache });
    });

    it('should call subscriber immediately with initial state, then with loading state for auto-fetch', async () => {
      let resolveAutoFetch: (value: any) => void = () => {};
      mockFetcher.mockImplementationOnce(
        () =>
          new Promise((res) => {
            resolveAutoFetch = res;
          }),
      );

      await qc.defineEndpoint(endpointKey, mockFetcher);

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      expect(subscriber).toHaveBeenCalledTimes(2);

      expect(subscriber).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          data: undefined,
          isLoading: false,
          isError: false,
        }),
      );

      expect(subscriber).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          data: undefined,
          isLoading: true,
          isError: false,
        }),
      );

      resolveAutoFetch({ message: 'cleanup auto-fetch' });
      mockFetcher.mockImplementation(async () => ({ message: 'default post-cleanup resolution' }));
      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);
    });

    it('should call subscriber immediately with cached data if available', async () => {
      const cachedData = { message: 'from cache' };
      const lastUpdated = Date.now();
      cache.setInternalCache(endpointKey, { data: cachedData, lastUpdated });
      await qc.defineEndpoint(endpointKey, mockFetcher);

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          data: cachedData,
          lastUpdated: lastUpdated,
          isLoading: false,
        }),
      );
    });

    it('should notify subscriber of state changes during a successful refetch', async () => {
      mockFetcher.mockResolvedValueOnce({ message: 'initial auto-fetch for define/subscribe' });
      await qc.defineEndpoint(endpointKey, mockFetcher);

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);

      subscriber.mockClear();

      const manualFetchData = { message: 'manual fetch success' };
      mockFetcher.mockResolvedValueOnce(manualFetchData);

      const refetchPromise = qc.refetch(endpointKey);
      await vi.advanceTimersByTimeAsync(0);
      expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ isLoading: true }));

      await refetchPromise;

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: false,
          data: manualFetchData,
          isError: false,
        }),
      );
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it('should notify subscriber of state changes during a manual refetch (failure)', async () => {
      mockFetcher.mockResolvedValueOnce({ message: 'initial auto-fetch for define/subscribe' });
      await qc.defineEndpoint(endpointKey, mockFetcher);

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);
      subscriber.mockClear();

      const error = new Error('manual fetch failed');
      mockFetcher.mockRejectedValueOnce(error);
      const refetchPromise = qc.refetch(endpointKey);
      await vi.advanceTimersByTimeAsync(0);
      expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ isLoading: true }));

      await refetchPromise;

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          isLoading: false,
          isError: true,
          error: error,
        }),
      );
      expect(subscriber).toHaveBeenCalledTimes(2);
    });

    it('unsubscribe should prevent further notifications', async () => {
      mockFetcher.mockResolvedValueOnce({ message: 'initial auto-fetch' });
      await qc.defineEndpoint(endpointKey, mockFetcher);
      const subscriber = vi.fn();
      const unsubscribe = qc.subscribe(endpointKey, subscriber);

      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);
      subscriber.mockClear();

      unsubscribe();

      mockFetcher.mockResolvedValueOnce({ message: 'data after unsubscribe' });
      await qc.refetch(endpointKey);
      await vi.runAllTimersAsync();

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('should refetch on subscribe if data is initially missing (no cache)', async () => {
      const fetchedResult = { message: 'fetched on subscribe' };
      mockFetcher.mockResolvedValueOnce(fetchedResult);
      await qc.defineEndpoint(endpointKey, mockFetcher);

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      // Calls expected:
      // 1. initial (isLoading: false from define)
      // 2. isLoading: true (from auto-refetch start)
      // 3. data + isLoading: false (from auto-refetch end)
      expect(subscriber).toHaveBeenCalledTimes(2); // Before fetch completes, isLoading:false then isLoading:true
      expect(subscriber).toHaveBeenNthCalledWith(1, expect.objectContaining({ isLoading: false, data: undefined }));
      expect(subscriber).toHaveBeenNthCalledWith(2, expect.objectContaining({ isLoading: true, data: undefined }));

      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);

      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: false,
          data: fetchedResult,
        }),
      );
      expect(mockFetcher).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledTimes(3); // Total calls
    });

    it('should refetch on subscribe if data is stale (refetchAfter)', async () => {
      const staleData = { message: 'stale' };
      const freshData = { message: 'fresh' };

      const initialTime = Date.now();
      vi.setSystemTime(initialTime - 5000);
      const fiveSecAgo = vi.getMockedSystemTime();
      // @ts-expect-error lastUpdated is intentionally set to simulate staleness
      await cache.setInternalCache(endpointKey, { data: staleData, lastUpdated: fiveSecAgo });

      vi.setSystemTime(initialTime);

      mockFetcher.mockResolvedValueOnce(freshData);
      await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 3000 });

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      // Calls expected:
      // 1. initial (staleData, isLoading: false from define)
      // 2. isLoading: true (from auto-refetch start due to staleness)
      // 3. freshData + isLoading: false (from auto-refetch end)
      expect(subscriber).toHaveBeenCalledTimes(2);
      expect(subscriber).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: staleData, isLoading: false }));
      expect(subscriber).toHaveBeenNthCalledWith(2, expect.objectContaining({ data: staleData, isLoading: true }));
      expect(mockFetcher).toHaveBeenCalledTimes(1);

      await vi.runAllTimersAsync();
      await new Promise(process.nextTick);

      expect(subscriber).toHaveBeenLastCalledWith(expect.objectContaining({ data: freshData, isLoading: false }));
      expect(subscriber).toHaveBeenCalledTimes(3);
    });

    it('should NOT refetch on subscribe if data is fresh', async () => {
      const freshCachedData = { message: 'fresh cache' };
      const now = Date.now();
      vi.setSystemTime(now - 1000);
      await cache.setInternalCache(endpointKey, { data: freshCachedData, lastUpdated: now - 1000 });

      vi.setSystemTime(now);

      await qc.defineEndpoint(endpointKey, mockFetcher, { refetchAfter: 5000 });

      const subscriber = vi.fn();
      qc.subscribe(endpointKey, subscriber);

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ data: freshCachedData, isLoading: false }));
      expect(mockFetcher).not.toHaveBeenCalled();
    });
  });

  describe('Cache Invalidation (invalidate)', () => {
    const endpointKey = 'invalidateTestEp';
    let mockFetcher: ReturnType<typeof vi.fn>;
    let cache: MockSimpleCacheProvider;
    let subscriber: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      mockFetcher = vi.fn(async (data = { message: 'data' }) => data);
      cache = new MockSimpleCacheProvider();
      qc = new QueryCore({ cacheProvider: cache });
      subscriber = vi.fn();

      // Define endpoint and populate cache/state
      mockFetcher.mockResolvedValueOnce({ message: 'initial data' });
      await qc.defineEndpoint(endpointKey, mockFetcher);
      await qc.refetch(endpointKey); // Populate state and cache
      qc.subscribe(endpointKey, subscriber); // Attach subscriber
      subscriber.mockClear(); // Clear calls from setup
    });

    it('should call cache provider remove method', async () => {
      const cacheRemoveSpy = vi.spyOn(cache, 'remove');
      await qc.invalidate(endpointKey);
      expect(cacheRemoveSpy).toHaveBeenCalledWith(endpointKey);
    });

    it('should clear in-memory state (data, lastUpdated, error)', async () => {
      await qc.invalidate(endpointKey);
      const state = qc.getState(endpointKey);
      expect(state.data).toBeUndefined();
      expect(state.lastUpdated).toBeUndefined();
      expect(state.error).toBeUndefined();
      expect(state.isError).toBe(false);
    });

    it('should notify subscribers of state change after invalidation', async () => {
      await qc.invalidate(endpointKey);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined,
          lastUpdated: undefined,
          isLoading: false, // Should not be loading after invalidate
          isError: false,
        }),
      );
    });

    it('should allow refetching data after invalidation', async () => {
      await qc.invalidate(endpointKey);

      const newData = { message: 'new data after invalidation' };
      mockFetcher.mockResolvedValueOnce(newData);
      await qc.refetch(endpointKey);

      const state = qc.getState(endpointKey);
      expect(state.data).toEqual(newData);
      expect(state.lastUpdated).toBeDefined();
    });
  });
});
