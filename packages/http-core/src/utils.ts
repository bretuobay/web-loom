/**
 * HTTP Utilities
 * Helper functions for URL building, header merging, etc.
 */

import type { RequestConfig } from './types';

/**
 * Build a full URL from base URL and relative path
 */
export function buildURL(baseURL: string | undefined, url: string | undefined): string {
  if (!url) return baseURL || '';
  if (isAbsoluteURL(url)) return url;
  if (!baseURL) return url;

  // Remove trailing slash from baseURL and leading slash from url
  const normalizedBase = baseURL.replace(/\/+$/, '');
  const normalizedUrl = url.replace(/^\/+/, '');

  return `${normalizedBase}/${normalizedUrl}`;
}

/**
 * Check if a URL is absolute
 */
export function isAbsoluteURL(url: string): boolean {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
    } else {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Merge headers objects
 */
export function mergeHeaders(...headersList: (Record<string, string> | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {};

  headersList.forEach((headers) => {
    if (!headers) return;
    Object.entries(headers).forEach(([key, value]) => {
      merged[key] = value;
    });
  });

  return merged;
}

/**
 * Merge request configurations
 */
export function mergeConfig(defaultConfig: RequestConfig, requestConfig: RequestConfig): RequestConfig {
  return {
    ...defaultConfig,
    ...requestConfig,
    headers: mergeHeaders(defaultConfig.headers, requestConfig.headers),
    metadata: {
      ...defaultConfig.metadata,
      ...requestConfig.metadata,
    },
  };
}

/**
 * Create a request signature for deduplication
 */
export function createRequestSignature(config: RequestConfig): string {
  const { method = 'GET', url = '', params, data } = config;

  const parts = [method.toUpperCase(), url];

  if (params) {
    parts.push(JSON.stringify(params));
  }

  if (data) {
    parts.push(JSON.stringify(data));
  }

  return parts.join('::');
}

/**
 * Check if content type is JSON
 */
export function isJSONContentType(contentType: string | null): boolean {
  return contentType?.includes('application/json') ?? false;
}

/**
 * Serialize request body based on content type
 */
export function serializeBody(
  data: any,
  headers: Record<string, string>,
  maxBodySize?: number,
  warnBodySize?: number,
): BodyInit | undefined {
  if (!data) return undefined;

  const contentType = headers['Content-Type'] || headers['content-type'];

  // FormData, Blob, ArrayBuffer, etc. can be sent directly
  if (
    data instanceof FormData ||
    data instanceof Blob ||
    data instanceof ArrayBuffer ||
    data instanceof URLSearchParams
  ) {
    return data;
  }

  let body: string;

  // JSON serialization
  if (!contentType || isJSONContentType(contentType)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(data);
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    // URL-encoded form data
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      params.append(key, String(value));
    });
    body = params.toString();
  } else {
    // Default to JSON
    body = JSON.stringify(data);
  }

  // Validate body size
  const sizeBytes = new Blob([body]).size;
  validateBodySize(sizeBytes, maxBodySize, warnBodySize);

  return body;
}

/**
 * Validate request body size
 */
export function validateBodySize(sizeBytes: number, maxSize?: number, warnSize?: number): void {
  const sizeMB = sizeBytes / 1024 / 1024;

  // Default: 10MB max, 1MB warn
  const maxSizeMB = maxSize ? maxSize / 1024 / 1024 : 10;
  const warnSizeMB = warnSize ? warnSize / 1024 / 1024 : 1;

  if (maxSize && sizeBytes > maxSize) {
    throw new Error(`Request body too large: ${sizeMB.toFixed(2)}MB exceeds maximum of ${maxSizeMB.toFixed(2)}MB`);
  }

  if (warnSize && sizeBytes > warnSize) {
    console.warn(
      `[http-core] Large request body: ${sizeMB.toFixed(2)}MB exceeds warning threshold of ${warnSizeMB.toFixed(2)}MB`,
    );
  }
}
