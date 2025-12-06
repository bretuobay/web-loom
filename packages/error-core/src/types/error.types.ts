export type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business'
  | 'runtime'
  | 'third_party'
  | 'unknown';

export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  userFacing: boolean;
}

export interface ErrorContext {
  // User context
  userId?: string;
  sessionId?: string;

  // Application context
  appVersion?: string;
  environment?: string;

  // Request context
  requestId?: string;
  correlationId?: string;
  endpoint?: string;

  // Browser/Device context
  userAgent?: string;
  url?: string;

  // Custom context
  [key: string]: unknown;
}

export interface CapturedError {
  error: Error;
  metadata: ErrorMetadata;
  context: ErrorContext;
  stack?: string;
  breadcrumbs: ErrorBreadcrumb[];
}

export interface ErrorBreadcrumb {
  message: string;
  category: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export interface NormalizedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  [key: string]: unknown;
}

export interface ErrorConstructorOptions {
  name?: string;
  code?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  recoverable?: boolean;
  retryable?: boolean;
  userFacing?: boolean;
  cause?: Error;
  context?: Partial<ErrorContext>;
}
