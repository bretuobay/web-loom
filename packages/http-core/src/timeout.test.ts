import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHttpClient } from './client';
import { createMockAdapter } from './mock';

describe('Timeout and Cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Timeout', () => {
    it('should timeout if request takes too long', async () => {
      const client = createHttpClient({ timeout: 100 });
      const mock = createMockAdapter();

      mock.onGet('/slow', () => ({
        data: 'result',
        delay: 500, // Delay longer than timeout
      }));

      client['config'].mockAdapter = mock;

      await expect(client.get('/slow')).rejects.toThrow();
    });

    it('should succeed if request completes within timeout', async () => {
      const client = createHttpClient({ timeout: 500 });
      const mock = createMockAdapter();

      mock.onGet('/fast', () => ({
        data: 'result',
        delay: 50, // Delay shorter than timeout
      }));

      client['config'].mockAdapter = mock;

      const response = await client.get('/fast');
      expect(response.data).toBe('result');
    });

    it('should allow per-request timeout override', async () => {
      const client = createHttpClient({ timeout: 100 });
      const mock = createMockAdapter();

      mock.onGet('/slow', () => ({
        data: 'result',
        delay: 200,
      }));

      client['config'].mockAdapter = mock;

      // Should timeout with default
      await expect(client.get('/slow')).rejects.toThrow();

      // Should succeed with override
      const response = await client.get('/slow', { timeout: 500 });
      expect(response.data).toBe('result');
    });
  });

  describe('Request Cancellation', () => {
    it('should cancel request using AbortController', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      const controller = new AbortController();

      mock.onGet('/cancellable', () => ({
        data: 'result',
        delay: 500,
      }));

      client['config'].mockAdapter = mock;

      const promise = client.get('/cancellable', { signal: controller.signal });

      // Cancel after 100ms
      setTimeout(() => controller.abort(), 100);

      await expect(promise).rejects.toThrow();
    });

    it('should handle already aborted signal', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      const controller = new AbortController();

      controller.abort(); // Abort before request

      mock.onGet('/data', () => ({ data: 'result' }));
      client['config'].mockAdapter = mock;

      await expect(client.get('/data', { signal: controller.signal })).rejects.toThrow();
    });
  });

  describe('Concurrent Requests with Timeout', () => {
    it('should handle multiple requests with different timeouts', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();

      mock.onGet('/fast', () => ({ data: 'fast', delay: 50 }));
      mock.onGet('/slow', () => ({ data: 'slow', delay: 300 }));

      client['config'].mockAdapter = mock;

      const results = await Promise.allSettled([
        client.get('/fast', { timeout: 200 }),
        client.get('/slow', { timeout: 100 }), // Will timeout
        client.get('/slow', { timeout: 500 }), // Will succeed
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });
});
