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
 * Retry decision result
 */
export interface RetryDecision {
  /** Whether to retry the request */
  shouldRetry: boolean;
  /** Custom delay in milliseconds (from Retry-After header) */
  retryAfter?: number;
}

/**
 * Check if an error should be retried and extract Retry-After header
 */
export function shouldRetryError(error: ApiError, config: RetryConfig, attempt: number): RetryDecision {
  // Check max retries
  if (attempt >= config.maxRetries) {
    return { shouldRetry: false };
  }

  // Check custom retry condition
  if (config.shouldRetry && !config.shouldRetry(error, attempt)) {
    return { shouldRetry: false };
  }

  // Check if error has a status code
  if (error.status) {
    const isRetryable = config.retryableStatuses?.includes(error.status) ?? false;
    if (!isRetryable) {
      return { shouldRetry: false };
    }

    // Check for Retry-After header (429 and 503 typically include this)
    if (error.status === 429 || error.status === 503) {
      const retryAfter = parseRetryAfterHeader(error);
      if (retryAfter !== null) {
        return { shouldRetry: true, retryAfter };
      }
    }

    return { shouldRetry: true };
  }

  // Network errors are retryable
  return { shouldRetry: true };
}

/**
 * Parse Retry-After header from error
 * Returns delay in milliseconds or null if not present
 */
function parseRetryAfterHeader(error: ApiError): number | null {
  // Try to get Retry-After from response headers
  // Note: This requires the error to have access to the response
  // We'll need to update error handling to include this
  if (!error.data || typeof error.data !== 'object') {
    return null;
  }

  // Check if error data includes headers (we'll need to pass this through)
  const retryAfterValue = error.data._retryAfter;
  if (!retryAfterValue) {
    return null;
  }

  // Retry-After can be in seconds or HTTP date
  const seconds = parseInt(retryAfterValue, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP date
  const retryDate = new Date(retryAfterValue);
  if (!isNaN(retryDate.getTime())) {
    const delayMs = retryDate.getTime() - Date.now();
    return Math.max(0, delayMs);
  }

  return null;
}

/**
 * Calculate retry delay with exponential backoff and optional jitter
 * Respects Retry-After header if provided
 */
export function calculateRetryDelay(attempt: number, config: RetryConfig, retryAfter?: number): number {
  // If Retry-After header specified a delay, use it (capped at maxDelay)
  if (retryAfter !== undefined) {
    const maxDelay = config.maxDelay || 30000;
    return Math.min(retryAfter, maxDelay);
  }

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
