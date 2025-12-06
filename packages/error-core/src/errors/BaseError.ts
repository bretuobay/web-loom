import type {
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
  ErrorBreadcrumb,
  ErrorConstructorOptions,
} from '../types/error.types';

export abstract class BaseError extends Error {
  public readonly name: string;
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly userFacing: boolean;
  public readonly timestamp: Date;
  public readonly context: ErrorContext;
  public readonly originalError?: Error;
  public readonly breadcrumbs: ErrorBreadcrumb[] = [];

  constructor(message: string, options: ErrorConstructorOptions = {}) {
    super(message);

    this.name = options.name || this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.category = options.category || 'unknown';
    this.severity = options.severity || 'error';
    this.recoverable = options.recoverable ?? true;
    this.retryable = options.retryable ?? false;
    this.userFacing = options.userFacing ?? true;
    this.timestamp = new Date();
    this.context = options.context || {};
    this.originalError = options.cause;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      retryable: this.retryable,
      userFacing: this.userFacing,
      stack: this.stack,
      context: this.context,
      breadcrumbs: this.breadcrumbs,
      cause:
        this.originalError?.name === 'BaseError'
          ? (this.originalError as BaseError).toJSON()
          : this.originalError?.message,
    };
  }

  public addBreadcrumb(breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: new Date(),
    });
  }

  public toString(): string {
    return `${this.name}: ${this.message} [${this.code}]`;
  }
}
