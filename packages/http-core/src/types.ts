/**
 * HTTP Core Types
 * Type definitions for the HTTP client library
 */

/**
 * HTTP methods supported by the client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request configuration options
 */
export interface RequestConfig {
  /** Request URL (relative or absolute) */
  url?: string;
  /** HTTP method */
  method?: HttpMethod;
  /** Base URL to prepend to relative URLs */
  baseURL?: string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, any>;
  /** Request body data */
  data?: any;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Credentials mode */
  credentials?: RequestCredentials;
  /** Request mode */
  mode?: RequestMode;
  /** Retry configuration */
  retry?: RetryConfig | boolean;
  /** Enable request deduplication */
  deduplicate?: boolean;
  /** Custom metadata for interceptors */
  metadata?: Record<string, any>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Add jitter to delays */
  jitter?: boolean;
  /** HTTP status codes that should trigger retry */
  retryableStatuses?: number[];
  /** Custom retry condition function */
  shouldRetry?: (error: ApiError, attempt: number) => boolean;
}

/**
 * HTTP client configuration
 */
export interface HttpClientConfig {
  /** Base URL for all requests */
  baseURL?: string;
  /** Default headers */
  headers?: Record<string, string>;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Default credentials mode */
  credentials?: RequestCredentials;
  /** Default request mode */
  mode?: RequestMode;
  /** Default retry configuration */
  retry?: RetryConfig | boolean;
  /** Enable request deduplication by default */
  deduplicate?: boolean;
  /** Mock adapter for testing */
  mockAdapter?: MockAdapter;
  /** Maximum request body size in bytes (default: 10MB) */
  maxBodySize?: number;
  /** Warn threshold for request body size in bytes (default: 1MB) */
  warnBodySize?: number;
  /** Strict Content-Type validation (default: true) */
  strictContentType?: boolean;
  /** Allowed content types for strict validation */
  allowedContentTypes?: string[];
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = any> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Status text */
  statusText: string;
  /** Response headers */
  headers: Headers;
  /** Original request config */
  config: RequestConfig;
  /** Original fetch Response object */
  response: Response;
}

/**
 * Standardized API error
 */
export interface ApiError extends Error {
  /** Error name */
  name: 'ApiError';
  /** HTTP status code (if available) */
  status?: number;
  /** Status text */
  statusText?: string;
  /** Request configuration */
  config?: RequestConfig;
  /** Response data (if available) */
  data?: any;
  /** Original error */
  originalError?: Error;
  /** Whether the error is retryable */
  isRetryable?: boolean;
}

/**
 * Request interceptor function
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

/**
 * Response interceptor function
 */
export type ResponseInterceptor = <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;

/**
 * Error interceptor function
 */
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;

/**
 * Interceptor manager
 */
export interface InterceptorManager<T> {
  /** Add an interceptor */
  use(interceptor: T): number;
  /** Remove an interceptor by ID */
  eject(id: number): void;
  /** Clear all interceptors */
  clear(): void;
}

/**
 * Mock adapter for testing
 */
export interface MockAdapter {
  /** Mock a request */
  mock(config: RequestConfig): Promise<HttpResponse | null>;
  /** Reset all mocks */
  reset(): void;
}

/**
 * Mock response configuration
 */
export interface MockResponse {
  /** Response status code */
  status?: number;
  /** Response data */
  data?: any;
  /** Response headers */
  headers?: Record<string, string>;
  /** Delay in milliseconds */
  delay?: number;
}
