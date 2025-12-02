/**
 * Mock Adapter
 * Testing and development mock support
 */

import type { MockAdapter, MockResponse, RequestConfig, HttpResponse } from './types';

/**
 * Mock handler function
 */
type MockHandler = (config: RequestConfig) => MockResponse | Promise<MockResponse>;

/**
 * Mock rule
 */
interface MockRule {
  method?: string;
  url?: string | RegExp;
  handler: MockHandler;
}

/**
 * Simple mock adapter implementation
 */
export class SimpleMockAdapter implements MockAdapter {
  private rules: MockRule[] = [];

  /**
   * Add a mock rule
   */
  onGet(url: string | RegExp, handler: MockHandler): this {
    return this.on('GET', url, handler);
  }

  onPost(url: string | RegExp, handler: MockHandler): this {
    return this.on('POST', url, handler);
  }

  onPut(url: string | RegExp, handler: MockHandler): this {
    return this.on('PUT', url, handler);
  }

  onPatch(url: string | RegExp, handler: MockHandler): this {
    return this.on('PATCH', url, handler);
  }

  onDelete(url: string | RegExp, handler: MockHandler): this {
    return this.on('DELETE', url, handler);
  }

  on(method: string, url: string | RegExp, handler: MockHandler): this {
    this.rules.push({ method: method.toUpperCase(), url, handler });
    return this;
  }

  /**
   * Mock any request matching the pattern
   */
  onAny(url: string | RegExp, handler: MockHandler): this {
    this.rules.push({ url, handler });
    return this;
  }

  /**
   * Mock a request if it matches any rule
   */
  async mock(config: RequestConfig): Promise<HttpResponse | null> {
    const rule = this.findMatchingRule(config);
    if (!rule) return null;

    const mockResponse = await rule.handler(config);

    // Simulate network delay with abort support
    if (mockResponse.delay) {
      await this.sleepWithAbort(mockResponse.delay, config.signal);
    }

    const status = mockResponse.status ?? 200;
    const headers = new Headers(mockResponse.headers || {});

    // Create a mock Response object
    const response = new Response(JSON.stringify(mockResponse.data), {
      status,
      statusText: getStatusText(status),
      headers,
    });

    return {
      data: mockResponse.data,
      status,
      statusText: response.statusText,
      headers: response.headers,
      config,
      response,
    };
  }

  /**
   * Sleep with abort support
   */
  private sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (signal?.aborted) {
        reject(new DOMException('The operation was aborted', 'AbortError'));
        return;
      }

      const timeoutId = setTimeout(resolve, ms);

      // Listen for abort event
      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(new DOMException('The operation was aborted', 'AbortError'));
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      // Clean up listener when done
      setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
      }, ms);
    });
  }

  /**
   * Find a matching rule for the request
   */
  private findMatchingRule(config: RequestConfig): MockRule | null {
    const method = config.method?.toUpperCase() || 'GET';
    const url = config.url || '';

    for (const rule of this.rules) {
      // Check method match
      if (rule.method && rule.method !== method) continue;

      // Check URL match
      if (rule.url) {
        if (typeof rule.url === 'string') {
          if (rule.url !== url) continue;
        } else if (rule.url instanceof RegExp) {
          if (!rule.url.test(url)) continue;
        }
      }

      return rule;
    }

    return null;
  }

  /**
   * Reset all mocks
   */
  reset(): void {
    this.rules = [];
  }
}

/**
 * Get status text for status code
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  };

  return statusTexts[status] || 'Unknown';
}

/**
 * Create a mock adapter
 */
export function createMockAdapter(): SimpleMockAdapter {
  return new SimpleMockAdapter();
}
