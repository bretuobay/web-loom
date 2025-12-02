/**
 * @web-loom/http-core
 * Unified HTTP client with interceptors, retry logic, and request cancellation
 */

export { HttpClient, createHttpClient } from './client';
export { SimpleMockAdapter, createMockAdapter } from './mock';
export { createApiError, isRetryableError } from './error';
export { RequestInterceptorManager, ResponseInterceptorManager, ErrorInterceptorManager } from './interceptors';
export { normalizeRetryConfig, calculateRetryDelay, DEFAULT_RETRY_CONFIG, type RetryDecision } from './retry';
export { buildURL, buildQueryString, mergeHeaders, createRequestSignature, validateBodySize } from './utils';
export { createCsrfInterceptor, getCsrfToken, setCsrfToken, type CsrfConfig } from './csrf';

export type {
  HttpMethod,
  RequestConfig,
  RetryConfig,
  HttpClientConfig,
  HttpResponse,
  ApiError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorManager,
  MockAdapter,
  MockResponse,
} from './types';
