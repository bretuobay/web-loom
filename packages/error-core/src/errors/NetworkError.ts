import { BaseError } from './BaseError';

export class NetworkError extends BaseError {
  constructor(
    message: string,
    options: {
      statusCode?: number;
      endpoint?: string;
      method?: string;
      cause?: Error;
      timeout?: boolean;
      offline?: boolean;
    } = {},
  ) {
    super(message, {
      name: 'NetworkError',
      code: `NETWORK_${options.statusCode || 'ERROR'}`,
      category: 'network',
      severity: options.statusCode && options.statusCode >= 500 ? 'error' : 'warn',
      retryable: options.statusCode ? options.statusCode >= 500 : true,
      recoverable: true,
      userFacing: true,
      cause: options.cause,
      context: {
        statusCode: options.statusCode,
        endpoint: options.endpoint,
        method: options.method,
        timeout: options.timeout,
        offline: options.offline,
      },
    });
  }

  get isRetryable(): boolean {
    const statusCode = this.context.statusCode as number;
    return !statusCode || statusCode >= 500 || statusCode === 408 || statusCode === 429;
  }

  get isServerError(): boolean {
    const statusCode = this.context.statusCode as number;
    return statusCode >= 500;
  }

  get isClientError(): boolean {
    const statusCode = this.context.statusCode as number;
    return statusCode >= 400 && statusCode < 500;
  }
}

export class TimeoutError extends NetworkError {
  constructor(
    message: string = 'Request timeout',
    options: {
      endpoint?: string;
      timeout?: number;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      ...options,
      statusCode: 408,
      timeout: true,
    });
  }
}

export class ConnectionError extends NetworkError {
  constructor(
    message: string = 'Connection failed',
    options: {
      endpoint?: string;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      ...options,
      offline: true,
    });
  }
}
