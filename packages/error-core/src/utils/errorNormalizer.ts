import { BaseError } from '../errors/BaseError';
import type { NormalizedError } from '../types/config.types';

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    const normalized: NormalizedError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    // Add error code if available
    if ('code' in error && typeof error.code === 'string') {
      normalized.code = error.code;
    }

    // Add additional properties for BaseError instances
    if (error instanceof BaseError) {
      normalized.category = error.category;
      normalized.severity = error.severity;
      normalized.recoverable = error.recoverable;
      normalized.retryable = error.retryable;
      normalized.userFacing = error.userFacing;
      normalized.timestamp = error.timestamp;
      normalized.context = error.context;
      normalized.breadcrumbs = error.breadcrumbs;
    }

    // Add status code for HTTP errors
    if ('status' in error && typeof error.status === 'number') {
      normalized.statusCode = error.status;
    }
    if ('statusCode' in error && typeof error.statusCode === 'number') {
      normalized.statusCode = error.statusCode;
    }

    return normalized;
  }

  if (typeof error === 'string') {
    return {
      name: 'StringError',
      message: error,
    };
  }

  if (typeof error === 'number') {
    return {
      name: 'NumberError',
      message: `Numeric error: ${error}`,
    };
  }

  if (typeof error === 'object' && error !== null) {
    try {
      const serialized = JSON.stringify(error);
      return {
        name: 'ObjectError',
        message: `Object error: ${serialized}`,
        originalObject: error,
      };
    } catch {
      return {
        name: 'ObjectError',
        message: 'Object error: [Circular or non-serializable object]',
        originalObject: '[Object]',
      };
    }
  }

  return {
    name: 'UnknownError',
    message: `Unknown error type: ${String(error)}`,
  };
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network-related errors that are typically retryable
    if (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      name.includes('timeout') ||
      name.includes('network')
    ) {
      return true;
    }

    // HTTP status codes that are retryable
    const statusCode = (error as any).statusCode || (error as any).status;
    if (typeof statusCode === 'number') {
      return statusCode >= 500 || statusCode === 408 || statusCode === 429;
    }
  }

  return false;
}

export function isRecoverableError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.recoverable;
  }

  if (error instanceof Error) {
    const name = error.name.toLowerCase();

    // Non-recoverable errors
    const nonRecoverableErrors = ['syntaxerror', 'referenceerror', 'typeerror', 'rangeerror'];

    if (nonRecoverableErrors.includes(name)) {
      return false;
    }

    // HTTP errors are generally recoverable
    const statusCode = (error as any).statusCode || (error as any).status;
    if (typeof statusCode === 'number') {
      return true;
    }
  }

  return true; // Default to recoverable
}

export function isUserFacingError(error: unknown): boolean {
  if (error instanceof BaseError) {
    return error.userFacing;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Errors that should typically be shown to users
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      name.includes('validation')
    ) {
      return true;
    }

    // HTTP client errors (4xx) are usually user-facing
    const statusCode = (error as any).statusCode || (error as any).status;
    if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
      return true;
    }
  }

  return false; // Default to not user-facing
}

export function categorizeError(error: unknown): string {
  if (error instanceof BaseError) {
    return error.category;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      name.includes('network')
    ) {
      return 'network';
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      name.includes('validation')
    ) {
      return 'validation';
    }

    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('authentication')) {
      return 'authentication';
    }

    if (name.includes('reference') || name.includes('type') || name.includes('syntax') || name.includes('range')) {
      return 'runtime';
    }

    // Check status codes
    const statusCode = (error as any).statusCode || (error as any).status;
    if (typeof statusCode === 'number') {
      if (statusCode === 401 || statusCode === 403) {
        return 'authentication';
      }
      if (statusCode >= 400 && statusCode < 500) {
        return 'validation';
      }
      if (statusCode >= 500) {
        return 'third_party';
      }
    }
  }

  return 'unknown';
}

export function createErrorChain(errors: Error[]): Error {
  if (errors.length === 0) {
    return new Error('Empty error chain');
  }

  if (errors.length === 1) {
    return errors[0];
  }

  const primary = errors[0];
  let current = primary;

  for (let i = 1; i < errors.length; i++) {
    (current as any).cause = errors[i];
    current = errors[i];
  }

  return primary;
}

export function flattenErrorChain(error: Error): Error[] {
  const chain: Error[] = [error];
  let current = error;

  while ((current as any).cause) {
    current = (current as any).cause;
    chain.push(current);
  }

  return chain;
}

export function getErrorFingerprint(error: Error): string {
  // Create a consistent fingerprint for grouping similar errors
  const components = [
    error.name,
    error.message.replace(/\d+/g, 'N'), // Replace numbers with 'N'
    error.stack?.split('\n')[1] || '', // First stack frame
  ];

  return btoa(components.join('|'))
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 16);
}
