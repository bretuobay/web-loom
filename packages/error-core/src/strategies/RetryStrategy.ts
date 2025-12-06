import type { RetryOptions } from '../types/config.types';

export class RetryStrategy {
  private options: Required<RetryOptions>;

  constructor(options: RetryOptions) {
    this.options = {
      maxAttempts: options.maxAttempts,
      baseDelay: options.baseDelay,
      maxDelay: options.maxDelay,
      backoffFactor: options.backoffFactor,
      jitter: options.jitter,
      retryCondition: options.retryCondition || this.defaultRetryCondition,
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (error: Error, attempt: number, delay: number) => void,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry
        if (attempt === this.options.maxAttempts) {
          break;
        }

        if (!this.shouldRetry(error as Error, attempt)) {
          break;
        }

        // Calculate delay with exponential backoff and optional jitter
        const delay = this.calculateDelay(attempt);

        // Notify about retry
        onRetry?.(error as Error, attempt, delay);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    return this.options.retryCondition(error, attempt);
  }

  private defaultRetryCondition(error: Error, _attempt: number): boolean {
    // Default retry condition: retry network errors and 5xx status codes
    const errorMessage = error.message.toLowerCase();
    const isNetworkError =
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      error.name.includes('Network') ||
      error.name.includes('Timeout');

    const statusCode = (error as any).statusCode || (error as any).status;
    const isServerError = statusCode >= 500;
    const isRetryableClientError = statusCode === 408 || statusCode === 429;

    return isNetworkError || isServerError || isRetryableClientError;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.options.baseDelay * Math.pow(this.options.backoffFactor, attempt - 1);

    // Apply maximum delay limit
    delay = Math.min(delay, this.options.maxDelay);

    // Apply jitter if enabled
    if (this.options.jitter) {
      const jitterFactor = 0.8 + Math.random() * 0.4; // ±20% jitter
      delay = delay * jitterFactor;
    }

    return Math.round(delay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Utility methods
  getOptions(): Required<RetryOptions> {
    return { ...this.options };
  }

  updateOptions(newOptions: Partial<RetryOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions,
      retryCondition: newOptions.retryCondition || this.options.retryCondition,
    };
  }
}

// Predefined retry strategies
export const RETRY_STRATEGIES = {
  /**
   * Conservative retry strategy for critical operations
   */
  CONSERVATIVE: new RetryStrategy({
    maxAttempts: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2,
    jitter: true,
  }),

  /**
   * Standard retry strategy for most operations
   */
  STANDARD: new RetryStrategy({
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    jitter: true,
  }),

  /**
   * Aggressive retry strategy for non-critical operations
   */
  AGGRESSIVE: new RetryStrategy({
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 30000,
    backoffFactor: 2.5,
    jitter: true,
  }),

  /**
   * Network-focused retry strategy
   */
  NETWORK: new RetryStrategy({
    maxAttempts: 4,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: (error: Error) => {
      const errorMessage = error.message.toLowerCase();
      return (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        (error as any).statusCode >= 500
      );
    },
  }),
};
