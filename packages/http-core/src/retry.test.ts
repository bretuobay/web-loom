import { describe, it, expect } from 'vitest';
import { normalizeRetryConfig, shouldRetryError, calculateRetryDelay, DEFAULT_RETRY_CONFIG } from './retry';
import { createApiError } from './error';

describe('Retry Logic', () => {
  describe('normalizeRetryConfig', () => {
    it('should return null for false', () => {
      expect(normalizeRetryConfig(false)).toBeNull();
    });

    it('should return default config for true', () => {
      expect(normalizeRetryConfig(true)).toEqual(DEFAULT_RETRY_CONFIG);
    });

    it('should merge with defaults', () => {
      const config = normalizeRetryConfig({ maxRetries: 5 });
      expect(config?.maxRetries).toBe(5);
      expect(config?.initialDelay).toBe(DEFAULT_RETRY_CONFIG.initialDelay);
    });
  });

  describe('shouldRetryError', () => {
    it('should not retry after max attempts', () => {
      const error = createApiError('Error', {}, 500);
      const config = { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 };

      const result = shouldRetryError(error, config, 3);
      expect(result.shouldRetry).toBe(false);
    });

    it('should retry 5xx errors', () => {
      const error = createApiError('Error', {}, 500);
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(true);
    });

    it('should retry 429 errors', () => {
      const error = createApiError('Rate limited', {}, 429);
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(true);
    });

    it('should not retry 4xx errors (except 429)', () => {
      const error = createApiError('Not found', {}, 404);
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(false);
    });

    it('should retry network errors', () => {
      const error = createApiError('Network error', {});
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(true);
    });

    it('should extract Retry-After header from 429 errors', () => {
      const error = createApiError('Rate limited', {}, 429, undefined, { _retryAfter: '60' });
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(true);
      expect(result.retryAfter).toBe(60000); // 60 seconds in milliseconds
    });

    it('should extract Retry-After header from 503 errors', () => {
      const error = createApiError('Service Unavailable', {}, 503, undefined, { _retryAfter: '30' });
      const config = DEFAULT_RETRY_CONFIG;

      const result = shouldRetryError(error, config, 0);
      expect(result.shouldRetry).toBe(true);
      expect(result.retryAfter).toBe(30000); // 30 seconds in milliseconds
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, jitter: false };

      const delay0 = calculateRetryDelay(0, config);
      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should cap at max delay', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxDelay: 5000, jitter: false };

      const delay = calculateRetryDelay(10, config);

      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should add jitter when enabled', () => {
      const config = { ...DEFAULT_RETRY_CONFIG, jitter: true };

      const delays = Array.from({ length: 10 }, () => calculateRetryDelay(1, config));

      // With jitter, delays should vary
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });
});
