/**
 * HTTP Client
 * Main HTTP client implementation with interceptors, retry, and cancellation
 */

import type { HttpClientConfig, RequestConfig, HttpResponse, ApiError } from './types';
import { RequestInterceptorManager, ResponseInterceptorManager, ErrorInterceptorManager } from './interceptors';
import { transformFetchError, transformResponseError, createApiError } from './error';
import { normalizeRetryConfig, shouldRetryError, calculateRetryDelay, sleep } from './retry';
import {
  buildURL,
  buildQueryString,
  mergeConfig,
  createRequestSignature,
  isJSONContentType,
  serializeBody,
} from './utils';

/**
 * HTTP Client class
 */
export class HttpClient {
  private config: HttpClientConfig;
  private pendingRequests: Map<string, Promise<HttpResponse>> = new Map();

  public interceptors = {
    request: new RequestInterceptorManager(),
    response: new ResponseInterceptorManager(),
    error: new ErrorInterceptorManager(),
  };

  constructor(config: HttpClientConfig = {}) {
    this.config = config;
  }

  /**
   * Perform a GET request
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'GET' });
  }

  /**
   * Perform a POST request
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'POST', data });
  }

  /**
   * Perform a PUT request
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PUT', data });
  }

  /**
   * Perform a PATCH request
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'PATCH', data });
  }

  /**
   * Perform a DELETE request
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'DELETE' });
  }

  /**
   * Perform a HEAD request
   */
  head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'HEAD' });
  }

  /**
   * Perform a OPTIONS request
   */
  options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, url, method: 'OPTIONS' });
  }

  /**
   * Main request method
   */
  async request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
    // Merge with default config
    let mergedConfig = mergeConfig(this.config, config);

    // Apply request interceptors
    for (const interceptor of this.interceptors.request.getAll()) {
      mergedConfig = await interceptor(mergedConfig);
    }

    // Check for deduplication
    if (mergedConfig.deduplicate ?? this.config.deduplicate) {
      const signature = createRequestSignature(mergedConfig);
      const pending = this.pendingRequests.get(signature);

      if (pending) {
        return pending as Promise<HttpResponse<T>>;
      }

      const promise = this.executeRequest<T>(mergedConfig);
      this.pendingRequests.set(signature, promise);

      try {
        const response = await promise;
        return response;
      } finally {
        this.pendingRequests.delete(signature);
      }
    }

    return this.executeRequest<T>(mergedConfig);
  }

  /**
   * Execute the actual request with retry logic
   */
  private async executeRequest<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    const retryConfig = normalizeRetryConfig(config.retry ?? this.config.retry);
    let attempt = 0;
    const maxAttempts = retryConfig?.maxRetries ?? 0;

    while (true) {
      try {
        return await this.performRequest<T>(config);
      } catch (error) {
        const apiError = error as ApiError;

        // Apply error interceptors
        let transformedError = apiError;
        for (const interceptor of this.interceptors.error.getAll()) {
          transformedError = await interceptor(transformedError);
        }

        // Check if we should retry
        if (retryConfig && attempt < maxAttempts) {
          const retryDecision = shouldRetryError(transformedError, retryConfig, attempt);
          if (retryDecision.shouldRetry) {
            const delay = calculateRetryDelay(attempt, retryConfig, retryDecision.retryAfter);
            await sleep(delay);
            attempt++;
            continue;
          }
        }

        throw transformedError;
      }
    }
  }

  /**
   * Perform a single request attempt
   */
  private async performRequest<T>(config: RequestConfig): Promise<HttpResponse<T>> {
    // Setup timeout and abort signal
    const controller = new AbortController();
    const signal = config.signal || controller.signal;
    let timeoutId: NodeJS.Timeout | undefined;

    if (config.timeout) {
      timeoutId = setTimeout(() => controller.abort(), config.timeout);
    }

    try {
      // Check mock adapter first
      if (this.config.mockAdapter) {
        // Check for abort signal before making mock call
        if (signal.aborted) {
          throw transformFetchError(new DOMException('The operation was aborted', 'AbortError'), config);
        }

        // Pass the signal to the mock adapter
        const configWithSignal = { ...config, signal };
        const mockResponse = await this.config.mockAdapter.mock(configWithSignal);
        if (mockResponse) {
          // Clear timeout on success
          if (timeoutId) clearTimeout(timeoutId);

          // Check if mock response is an error
          if (mockResponse.status >= 400) {
            throw await transformResponseError(mockResponse.response, config);
          }
          return this.applyResponseInterceptors(mockResponse as HttpResponse<T>);
        }
      }

      // Build URL
      const fullURL = this.buildFullURL(config);

      // Prepare headers
      const headers = { ...config.headers };

      // Serialize body with size validation
      const body = serializeBody(config.data, headers, this.config.maxBodySize, this.config.warnBodySize);

      // Perform fetch
      const response = await fetch(fullURL, {
        method: config.method || 'GET',
        headers,
        body,
        signal,
        credentials: config.credentials,
        mode: config.mode,
      });

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        throw await transformResponseError(response, config);
      }

      // Parse response
      const data = await this.parseResponse<T>(response);

      const httpResponse: HttpResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
        response,
      };

      // Apply response interceptors
      return this.applyResponseInterceptors(httpResponse);
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);

      if ((error as ApiError).name === 'ApiError') {
        throw error;
      }

      throw transformFetchError(error as Error, config);
    }
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let transformedResponse = response;

    for (const interceptor of this.interceptors.response.getAll()) {
      transformedResponse = await interceptor(transformedResponse);
    }

    return transformedResponse;
  }

  /**
   * Build full URL with query parameters
   */
  private buildFullURL(config: RequestConfig): string {
    let url = buildURL(config.baseURL || this.config.baseURL, config.url);

    if (config.params) {
      url += buildQueryString(config.params);
    }

    return url;
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Strict Content-Type validation
    if (this.config.strictContentType !== false) {
      const allowed = this.config.allowedContentTypes || [
        'application/json',
        'text/plain',
        'text/html',
        'text/csv',
        'application/octet-stream',
        'application/pdf',
        'image/',
        'video/',
        'audio/',
      ];

      const isAllowed = !contentType || allowed.some((type) => contentType.includes(type));

      if (!isAllowed) {
        throw await transformResponseError(response, this.config as any);
      }
    }

    // Parse JSON
    if (isJSONContentType(contentType)) {
      try {
        return await response.json();
      } catch (error) {
        throw createApiError(
          'Invalid JSON response',
          this.config as any,
          response.status,
          response.statusText,
          await response.text().catch(() => null),
          error as Error,
        );
      }
    }

    // Parse text
    if (contentType?.includes('text/')) {
      return (await response.text()) as T;
    }

    // Parse blob for binary data
    if (
      contentType?.includes('application/octet-stream') ||
      contentType?.includes('image/') ||
      contentType?.includes('video/') ||
      contentType?.includes('audio/')
    ) {
      return (await response.blob()) as T;
    }

    // Default to JSON with better error handling
    try {
      return await response.json();
    } catch {
      return (await response.text()) as T;
    }
  }
}

/**
 * Create an HTTP client instance
 */
export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
