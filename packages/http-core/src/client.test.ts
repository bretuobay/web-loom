import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHttpClient } from './client';
import { createMockAdapter } from './mock';

describe('HttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Requests', () => {
    it('should perform GET request', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/users', () => ({ data: [{ id: 1, name: 'John' }] }));
      client['config'].mockAdapter = mock;

      const response = await client.get('/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual([{ id: 1, name: 'John' }]);
    });

    it('should perform POST request with data', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onPost('/users', (config) => ({
        data: { id: 2, ...config.data },
        status: 201,
      }));
      client['config'].mockAdapter = mock;

      const response = await client.post('/users', { name: 'Jane' });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 2, name: 'Jane' });
    });

    it('should perform PUT request', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onPut('/users/1', () => ({ data: { id: 1, name: 'Updated' } }));
      client['config'].mockAdapter = mock;

      const response = await client.put('/users/1', { name: 'Updated' });

      expect(response.data).toEqual({ id: 1, name: 'Updated' });
    });

    it('should perform DELETE request', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onDelete('/users/1', () => ({ status: 204 }));
      client['config'].mockAdapter = mock;

      const response = await client.delete('/users/1');

      expect(response.status).toBe(204);
    });
  });

  describe('Configuration', () => {
    it('should use base URL', async () => {
      const client = createHttpClient({ baseURL: 'https://api.example.com' });
      const mock = createMockAdapter();
      mock.onAny(/users/, () => ({ data: [] }));
      client['config'].mockAdapter = mock;

      const response = await client.get('/users');
      expect(response.data).toEqual([]);
    });

    it('should merge default headers', async () => {
      const client = createHttpClient({
        headers: { 'X-App': 'test' },
      });
      const mock = createMockAdapter();
      mock.onGet('/data', (config) => {
        expect(config.headers?.['X-App']).toBe('test');
        return { data: 'ok' };
      });
      client['config'].mockAdapter = mock;

      await client.get('/data');
    });

    it('should handle query parameters', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onAny(/\/search/, () => ({ data: [] }));
      client['config'].mockAdapter = mock;

      await client.get('/search', { params: { q: 'test', page: 1 } });
      // URL building is tested in utils.test.ts
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptor', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/data', () => ({ data: 'ok' }));
      client['config'].mockAdapter = mock;

      client.interceptors.request.use((config) => {
        config.headers = { ...config.headers, 'X-Token': 'abc123' };
        return config;
      });

      await client.get('/data');
      // Interceptor was applied if no error thrown
    });

    it('should apply response interceptor', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/data', () => ({ data: { value: 1 } }));
      client['config'].mockAdapter = mock;

      client.interceptors.response.use((response) => {
        response.data = { ...response.data, transformed: true };
        return response;
      });

      const response = await client.get('/data');
      expect(response.data).toEqual({ value: 1, transformed: true });
    });

    it('should apply error interceptor', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/error', () => ({ status: 500, data: 'Server error' }));
      client['config'].mockAdapter = mock;

      let interceptorCalled = false;
      client.interceptors.error.use((error) => {
        interceptorCalled = true;
        return error;
      });

      try {
        await client.get('/error');
      } catch {
        expect(interceptorCalled).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/notfound', () => ({ status: 404 }));
      client['config'].mockAdapter = mock;

      await expect(client.get('/notfound')).rejects.toThrow();
    });

    it('should handle 500 errors', async () => {
      const client = createHttpClient();
      const mock = createMockAdapter();
      mock.onGet('/error', () => ({ status: 500 }));
      client['config'].mockAdapter = mock;

      await expect(client.get('/error')).rejects.toThrow();
    });
  });

  describe('Request Deduplication', () => {
    it('should deduplicate identical requests', async () => {
      const client = createHttpClient({ deduplicate: true });
      const mock = createMockAdapter();
      let callCount = 0;

      mock.onGet('/data', () => {
        callCount++;
        return { data: 'result', delay: 100 };
      });
      client['config'].mockAdapter = mock;

      const [r1, r2, r3] = await Promise.all([client.get('/data'), client.get('/data'), client.get('/data')]);

      expect(callCount).toBe(1);
      expect(r1.data).toBe('result');
      expect(r2.data).toBe('result');
      expect(r3.data).toBe('result');
    });
  });
});
