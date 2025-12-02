/**
 * CSRF Protection Utilities
 * Helpers for Cross-Site Request Forgery protection
 */

import type { RequestInterceptor, HttpMethod } from './types';

/**
 * CSRF configuration options
 */
export interface CsrfConfig {
  /** CSS selector for CSRF token meta tag (default: 'meta[name="csrf-token"]') */
  tokenSelector?: string;
  /** Attribute name containing the token (default: 'content') */
  tokenAttribute?: string;
  /** Header name to send token in (default: 'X-CSRF-Token') */
  headerName?: string;
  /** HTTP methods that require CSRF token (default: ['POST', 'PUT', 'PATCH', 'DELETE']) */
  methods?: HttpMethod[];
  /** Cookie name for cookie-based CSRF (optional) */
  cookieName?: string;
  /** Whether to warn if token is missing (default: true) */
  warnOnMissing?: boolean;
}

/**
 * Create a CSRF protection interceptor
 *
 * @example
 * ```typescript
 * const client = createHttpClient({
 *   baseURL: 'https://api.example.com'
 * });
 *
 * // Add CSRF protection
 * client.interceptors.request.use(createCsrfInterceptor());
 *
 * // Or with custom config
 * client.interceptors.request.use(createCsrfInterceptor({
 *   tokenSelector: 'meta[name="csrf-token"]',
 *   headerName: 'X-CSRF-Token',
 *   methods: ['POST', 'PUT', 'PATCH', 'DELETE']
 * }));
 * ```
 */
export function createCsrfInterceptor(config: CsrfConfig = {}): RequestInterceptor {
  const {
    tokenSelector = 'meta[name="csrf-token"]',
    tokenAttribute = 'content',
    headerName = 'X-CSRF-Token',
    methods = ['POST', 'PUT', 'PATCH', 'DELETE'],
    cookieName,
    warnOnMissing = true,
  } = config;

  return (requestConfig) => {
    // Skip if method doesn't require CSRF protection
    if (!methods.includes(requestConfig.method as HttpMethod)) {
      return requestConfig;
    }

    let token: string | null = null;

    // Try to get token from meta tag
    if (typeof document !== 'undefined') {
      const metaTag = document.querySelector(tokenSelector);
      token = metaTag?.getAttribute(tokenAttribute) || null;
    }

    // Fall back to cookie if configured
    if (!token && cookieName && typeof document !== 'undefined') {
      token = getCookie(cookieName);
    }

    // Warn if token not found
    if (!token && warnOnMissing) {
      console.warn(`[http-core] CSRF token not found. Request to ${requestConfig.url} may be rejected by the server.`);
    }

    // Add token to headers
    if (token) {
      requestConfig.headers = {
        ...requestConfig.headers,
        [headerName]: token,
      };
    }

    return requestConfig;
  };
}

/**
 * Get CSRF token from meta tag
 */
export function getCsrfToken(selector = 'meta[name="csrf-token"]', attribute = 'content'): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const metaTag = document.querySelector(selector);
  return metaTag?.getAttribute(attribute) || null;
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const matches = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`),
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Set CSRF token in meta tag
 * Useful for updating token after refresh
 */
export function setCsrfToken(token: string, selector = 'meta[name="csrf-token"]', attribute = 'content'): void {
  if (typeof document === 'undefined') {
    return;
  }

  let metaTag = document.querySelector(selector);

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'csrf-token');
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute(attribute, token);
}
