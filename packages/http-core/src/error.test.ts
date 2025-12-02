import { describe, it, expect } from 'vitest';
import { createApiError, isRetryableError, transformFetchError } from './error';

describe('Error Handling', () => {
  describe('createApiError', () => {
    it('should create ApiError with all fields', () => {
      const config = { url: '/test', method: 'GET' as const };
      const originalError = new Error('Network error');

      const error = createApiError(
        'Request failed',
        config,
        500,
        'Internal Server Error',
        { message: 'Server error' },
        originalError,
      );

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Request failed');
      expect(error.config).toEqual(config);
      expect(error.status).toBe(500);
      expect(error.statusText).toBe('Internal Server Error');
      expect(error.data).toEqual({ message: 'Server error' });
      expect(error.originalError).toBe(originalError);
      expect(error.isRetryable).toBe(true);
    });

    it('should create minimal ApiError', () => {
      const error = createApiError('Error');

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Error');
      expect(error.config).toBeUndefined();
      expect(error.status).toBeUndefined();
    });
  });

  describe('isRetryableError', () => {
    it('should mark 429 as retryable', () => {
      expect(isRetryableError(429)).toBe(true);
    });

    it('should mark 5xx as retryable', () => {
      expect(isRetryableError(500)).toBe(true);
      expect(isRetryableError(502)).toBe(true);
      expect(isRetryableError(503)).toBe(true);
      expect(isRetryableError(504)).toBe(true);
    });

    it('should mark 4xx (except 429) as not retryable', () => {
      expect(isRetryableError(400)).toBe(false);
      expect(isRetryableError(401)).toBe(false);
      expect(isRetryableError(403)).toBe(false);
      expect(isRetryableError(404)).toBe(false);
    });

    it('should mark network errors (no status) as retryable', () => {
      expect(isRetryableError(undefined)).toBe(true);
      expect(isRetryableError()).toBe(true);
    });
  });

  describe('transformFetchError', () => {
    it('should handle AbortError', () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';

      const apiError = transformFetchError(abortError, { url: '/test' });

      expect(apiError.message).toBe('Request was cancelled');
      expect(apiError.originalError).toBe(abortError);
    });

    it('should handle TimeoutError', () => {
      const timeoutError = new Error('TimeoutError');
      timeoutError.name = 'TimeoutError';

      const apiError = transformFetchError(timeoutError, { url: '/test' });

      expect(apiError.message).toBe('Request timeout');
      expect(apiError.originalError).toBe(timeoutError);
    });

    it('should handle generic network errors', () => {
      const networkError = new Error('Failed to fetch');

      const apiError = transformFetchError(networkError, { url: '/test' });

      expect(apiError.message).toBe('Failed to fetch');
      expect(apiError.originalError).toBe(networkError);
    });
  });

  describe('HTTP Status Code Messages', () => {
    it('should provide user-friendly messages for common status codes', () => {
      const statuses = [
        { code: 400, message: 'Bad Request' },
        { code: 401, message: 'Unauthorized' },
        { code: 403, message: 'Forbidden' },
        { code: 404, message: 'Not Found' },
        { code: 429, message: 'Too Many Requests' },
        { code: 500, message: 'Internal Server Error' },
        { code: 502, message: 'Bad Gateway' },
        { code: 503, message: 'Service Unavailable' },
        { code: 504, message: 'Gateway Timeout' },
      ];

      statuses.forEach(({ code }) => {
        const error = createApiError('', {}, code);
        expect(error.isRetryable).toBeDefined();
      });
    });
  });
});
