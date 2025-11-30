/**
 * Retry Logic
 * Exponential backoff with jitter
 */

import type { RetryConfig, ApiError } from './types';

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableStatuses: [429, 500, 502, 503, 504],
  shouldRetry: () => true,
};

/**
 * Normalize retry configuration
 */
export function normalizeRetryConfig(retry?: RetryConfig | boolean): RetryConfig | null {
  if (retry === false) return null;
  if (retry === true) return DEFAULT_RETRY_CONFIG;
  if (!retry) return null;

  return {
    ...DEFAULT_RETRY_CONFIG,
    ...retry,
  };
}

/**
 * Check if an error should be retried
 */
export function shouldRetryError(error: ApiError, config: RetryConfig, attempt: number): boolean {
  // Check max retries
  if (attempt >= config.maxRetries) return false;

  // Check custom retry condition
  if (config.shouldRetry && !config.shouldRetry(error, attempt)) return false;

  // Check if error has a status code
  if (error.status) {
    return config.retryableStatuses?.includes(error.status) ?? false;
  }

  // Network errors are retryable
  return true;
}

/**
 * Calculate retry delay with exponential backoff and optional jitter
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const { initialDelay = 1000, maxDelay = 30000, backoffMultiplier = 2, jitter = true } = config;

  // Calculate exponential backoff
  let delay = initialDelay * Math.pow(backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, maxDelay);

  // Add jitter to prevent thundering herd
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.floor(delay);
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
