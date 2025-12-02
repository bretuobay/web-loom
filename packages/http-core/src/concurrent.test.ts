import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHttpClient } from './client';
import { createMockAdapter } from './mock';

describe('Concurrent Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Multiple Simultaneous Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();

      mock.onGet('/users', () => ({ data: [{ id: 1 }] }));
      mock.onGet('/posts', () => ({ data: [{ id: 1 }] }));
      mock.onGet('/comments', () => ({ data: [{ id: 1 }] }));

      client['config'].mockAdapter = mock;

      const [users, posts, comments] = await Promise.all([
        client.get('/users'),
        client.get('/posts'),
        client.get('/comments'),
      ]);

      expect(users.data).toEqual([{ id: 1 }]);
      expect(posts.data).toEqual([{ id: 1 }]);
      expect(comments.data).toEqual([{ id: 1 }]);
    });

    it('should handle mixed success and failure', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();

      mock.onGet('/success', () => ({ data: 'ok' }));
      mock.onGet('/error', () => ({ status: 500 }));

      client['config'].mockAdapter = mock;

      const results = await Promise.allSettled([client.get('/success'), client.get('/error'), client.get('/success')]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Request Deduplication with Concurrent Requests', () => {
    it('should deduplicate identical concurrent requests', async () => {
      const client = createHttpClient({ deduplicate: true });
      const mock = createMockAdapter();
      let callCount = 0;

      mock.onGet('/data', () => {
        callCount++;
        return { data: 'result', delay: 100 };
      });

      client['config'].mockAdapter = mock;

      // Fire 5 identical requests concurrently
      const results = await Promise.all([
        client.get('/data'),
        client.get('/data'),
        client.get('/data'),
        client.get('/data'),
        client.get('/data'),
      ]);

      // Should only make 1 actual call
      expect(callCount).toBe(1);

      // All should get the same data
      results.forEach((result) => {
        expect(result.data).toBe('result');
      });
    });

    it('should NOT deduplicate requests with different params', async () => {
      const client = createHttpClient({ deduplicate: true });
      const mock = createMockAdapter();
      let callCount = 0;

      mock.onAny(/\/data/, () => {
        callCount++;
        return { data: 'result' };
      });

      client['config'].mockAdapter = mock;

      await Promise.all([
        client.get('/data', { params: { page: 1 } }),
        client.get('/data', { params: { page: 2 } }),
        client.get('/data', { params: { page: 3 } }),
      ]);

      // Should make 3 calls (different params)
      expect(callCount).toBe(3);
    });

    it('should NOT deduplicate requests with different methods', async () => {
      const client = createHttpClient({ deduplicate: true });
      const mock = createMockAdapter();
      let callCount = 0;

      mock.onAny(/\/data/, () => {
        callCount++;
        return { data: 'result' };
      });

      client['config'].mockAdapter = mock;

      await Promise.all([client.get('/data'), client.post('/data', {}), client.put('/data', {})]);

      // Should make 3 calls (different methods)
      expect(callCount).toBe(3);
    });
  });

  describe('Concurrent Requests with Retries', () => {
    it('should retry failed requests independently', async () => {
      const client = createHttpClient({ retry: { maxRetries: 2, initialDelay: 10 } });
      const mock = createMockAdapter();
      let attempt1 = 0;
      let attempt2 = 0;

      mock.onGet('/fail-once', () => {
        attempt1++;
        if (attempt1 === 1) {
          return { status: 500 };
        }
        return { data: 'success' };
      });

      mock.onGet('/fail-twice', () => {
        attempt2++;
        if (attempt2 <= 2) {
          return { status: 500 };
        }
        return { data: 'success' };
      });

      client['config'].mockAdapter = mock;

      const results = await Promise.all([client.get('/fail-once'), client.get('/fail-twice')]);

      expect(results[0].data).toBe('success');
      expect(results[1].data).toBe('success');
      expect(attempt1).toBe(2); // 1 initial + 1 retry
      expect(attempt2).toBe(3); // 1 initial + 2 retries
    });
  });

  describe('Concurrent Requests with Interceptors', () => {
    it('should apply interceptors to all concurrent requests', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      const interceptedUrls: string[] = [];

      client.interceptors.request.use((config) => {
        interceptedUrls.push(config.url || '');
        return config;
      });

      mock.onAny(/\/.*/, () => ({ data: 'ok' }));
      client['config'].mockAdapter = mock;

      await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);

      expect(interceptedUrls).toContain('/a');
      expect(interceptedUrls).toContain('/b');
      expect(interceptedUrls).toContain('/c');
      expect(interceptedUrls.length).toBe(3);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up deduplication cache after requests complete', async () => {
      const client = createHttpClient({ deduplicate: true });
      const mock = createMockAdapter();

      mock.onGet('/data', () => ({ data: 'result', delay: 50 }));
      client['config'].mockAdapter = mock;

      // Fire concurrent requests
      await Promise.all([client.get('/data'), client.get('/data'), client.get('/data')]);

      // Check that pending requests map is empty
      expect(client['pendingRequests'].size).toBe(0);
    });

    it('should handle rapid sequential requests without deduplication', async () => {
      const client = createHttpClient({ deduplicate: false });
      const mock = createMockAdapter();
      let callCount = 0;

      mock.onGet('/data', () => {
        callCount++;
        return { data: callCount };
      });

      client['config'].mockAdapter = mock;

      // Fire requests sequentially (very fast)
      const r1 = await client.get('/data');
      const r2 = await client.get('/data');
      const r3 = await client.get('/data');

      expect(r1.data).toBe(1);
      expect(r2.data).toBe(2);
      expect(r3.data).toBe(3);
      expect(callCount).toBe(3);
    });
  });
});
