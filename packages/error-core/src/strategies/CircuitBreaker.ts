import type { CircuitState, CircuitBreakerOptions } from '../types/config.types';
import { BaseError } from '../errors/BaseError';

export class CircuitOpenError extends BaseError {
  constructor(message: string = 'Circuit breaker is open') {
    super(message, {
      name: 'CircuitOpenError',
      code: 'CIRCUIT_BREAKER_OPEN',
      category: 'runtime',
      severity: 'warn',
      retryable: false,
      recoverable: true,
      userFacing: false,
    });
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private nextAttempt?: Date;

  constructor(
    private options: Required<CircuitBreakerOptions> = {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenMaxAttempts: 3,
    },
  ) {}

  async execute<T>(operation: () => Promise<T>, operationName?: string): Promise<T> {
    this.updateStateIfNeeded();

    switch (this.state) {
      case 'OPEN':
        throw new CircuitOpenError(
          `Circuit breaker is OPEN${operationName ? ` for ${operationName}` : ''}. Next attempt at ${this.nextAttempt?.toISOString()}`,
        );

      case 'HALF_OPEN':
        if (this.successes >= this.options.halfOpenMaxAttempts) {
          this.reset();
        }
        break;

      case 'CLOSED':
      default:
        // Continue with execution
        break;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private updateStateIfNeeded(): void {
    if (this.state === 'OPEN' && this.nextAttempt && new Date() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.successes = 0;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = undefined;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.options.halfOpenMaxAttempts) {
        this.reset();
      }
    }
  }

  private onFailure(_error: Error): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.state === 'CLOSED' && this.failures >= this.options.failureThreshold) {
      this.trip();
    } else if (this.state === 'HALF_OPEN') {
      this.trip();
    }
  }

  private trip(): void {
    this.state = 'OPEN';
    this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
    this.successes = 0;
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttempt = undefined;
  }

  // Public API methods
  getState(): CircuitState {
    this.updateStateIfNeeded();
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  getSuccesses(): number {
    return this.successes;
  }

  getLastFailureTime(): Date | undefined {
    return this.lastFailureTime;
  }

  getNextAttemptTime(): Date | undefined {
    return this.nextAttempt;
  }

  getOptions(): Required<CircuitBreakerOptions> {
    return { ...this.options };
  }

  // Manual control methods
  forceOpen(): void {
    this.state = 'OPEN';
    this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
  }

  forceClose(): void {
    this.reset();
  }

  forceHalfOpen(): void {
    this.state = 'HALF_OPEN';
    this.successes = 0;
    this.nextAttempt = undefined;
  }

  // Statistics
  getStatistics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttempt,
      failureThreshold: this.options.failureThreshold,
      resetTimeout: this.options.resetTimeout,
    };
  }

  // Configuration updates
  updateOptions(newOptions: Partial<CircuitBreakerOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions,
    };
  }
}

// Predefined circuit breaker configurations
export const CIRCUIT_BREAKER_PRESETS = {
  /**
   * Fast-fail circuit breaker for external services
   */
  EXTERNAL_SERVICE: new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 30000,
    halfOpenMaxAttempts: 2,
  }),

  /**
   * Database operation circuit breaker
   */
  DATABASE: new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenMaxAttempts: 3,
  }),

  /**
   * API call circuit breaker
   */
  API: new CircuitBreaker({
    failureThreshold: 4,
    resetTimeout: 45000,
    halfOpenMaxAttempts: 2,
  }),

  /**
   * Conservative circuit breaker for critical operations
   */
  CRITICAL: new CircuitBreaker({
    failureThreshold: 2,
    resetTimeout: 120000,
    halfOpenMaxAttempts: 1,
  }),
};
