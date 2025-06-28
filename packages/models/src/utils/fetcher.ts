// src/utils/nativeFetcher.ts

// import { Fetcher } from "mvvm-core"; // Assuming RestfulApiModel.ts defines Fetcher type

/**
 * Interface for a single cache entry.
 * @template T The type of the data being cached.
 */
export interface CacheEntry<T = any> {
  timestamp: number;
  data: T;
}

/**
 * Interface for the structure of the API cache.
 * Keys are URLs (string), values are CacheEntry objects.
 * @template T The type of the data being cached.
 */
export interface ApiCache<T = any> {
  [url: string]: CacheEntry<T>;
}

/**
 * Custom error class for API responses that are not OK (status 2xx).
 * This allows for specific error handling based on HTTP status codes.
 */
export class HttpError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly responseBody: any; // Can be JSON object, string, or undefined

  constructor(message: string, status: number, statusText: string, responseBody?: any) {
    super(message);
    this.name = 'HttpError'; // Set the name for easier identification
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

/**
 * A comprehensive fetcher function using the native `fetch` API.
 * It handles:
 * - Default JSON `Content-Type` and `Accept` headers.
 * - Merging of custom headers.
 * - HTTP error responses (non-2xx status codes) by throwing `HttpError`.
 * - Parsing of error bodies (JSON or text).
 * - Network errors and other unexpected `fetch` rejections.
 * - Optional request timeout using `AbortController`.
 *
 * @param url The URL to fetch.
 * @param options Standard `RequestInit` options for `fetch`.
 * @param timeoutMs Optional timeout in milliseconds. If the request takes longer, it will throw an `AbortError`. Default is 30 seconds.
 * @returns A Promise that resolves to the `Response` object. The `RestfulApiModel` will then handle parsing the successful response body.
 * @throws `HttpError` for non-2xx HTTP responses, containing status and parsed body.
 * @throws `Error` with `name: 'AbortError'` if the request times out.
 * @throws other `Error` types for network issues or unexpected problems.
 * TDOO: typing by any is not ideal, but it allows for flexibility in the fetcher function.
 */
export const nativeFetcher: any = async (
  url: string,
  options?: RequestInit,
  timeoutMs: number = 30000, // Default timeout of 30 seconds
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // Set up the timeout

  // Default headers for JSON communication
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Merge provided headers with defaults.
  // If a 'Content-Type' is explicitly set in options.headers, it will override the default.
  const mergedHeaders = {
    ...defaultHeaders,
    ...options?.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal, // Attach the abort signal to the fetch request
    });

    clearTimeout(timeoutId); // Clear the timeout if the fetch completes in time

    // Check if the HTTP response status is not in the 2xx range
    if (!response.ok) {
      let errorBody: any;
      const contentType = response.headers.get('content-type');

      // Attempt to parse the response body, prioritizing JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          errorBody = await response.json();
        } catch (e) {
          // If JSON parsing fails, fall back to text
          errorBody = await response.text();
        }
      } else {
        // If not JSON, get the body as text
        errorBody = await response.text();
      }

      // Throw a custom HttpError for easier handling upstream
      throw new HttpError(
        `HTTP error: ${response.status} ${response.statusText || 'Unknown'}`,
        response.status,
        response.statusText || 'Unknown',
        errorBody,
      );
    }

    // Return the raw Response object. The RestfulApiModel's `executeApiRequest`
    // method is responsible for parsing the successful response body (e.g., `response.json()`)
    // and then validating it with Zod.
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId); // Ensure timeout is cleared even if fetch itself throws (e.g., network error)

    // Handle specific error types
    if (error.name === 'AbortError') {
      // This error occurs if `controller.abort()` was called (due to timeout or explicit cancellation)
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms or was explicitly aborted.`);
    } else if (error instanceof HttpError) {
      // Re-throw our custom HttpError, as it already contains detailed information
      throw error;
    } else {
      // Catch any other unexpected errors (e.g., network issues, DNS resolution failures)
      throw new Error(`Network or unexpected error for ${url}: ${error.message || 'An unknown error occurred.'}`);
    }
  }
};

const DEFAULT_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const persistentApiResponseCacheKey = 'persistentApiResponseCache';
const apiResponseCache: Map<string, CacheEntry> = new Map();

/**
 * Fetches data from a URL with caching capabilities.
 *
 * @template T The expected type of the JSON response data.
 * @param {string} url The URL to fetch.
 * @param {RequestInit} [options] Standard fetch options. Only GET requests are cached unless overridden.
 * @param {number} [cacheDurationMs=300000] How long to cache the response in milliseconds (default: 5 minutes).
 * @param {boolean} [forceRefresh=false] If true, bypasses the cache and fetches a fresh response.
 * @returns {Promise<T>} A promise that resolves to the fetched data.
 * @throws {HttpError} For non-2xx HTTP responses.
 * @throws {Error} For network issues, timeouts, or other unexpected problems.
 */
export async function fetchWithCache<T = any>(
  url: string,
  options?: RequestInit,
  cacheDurationMs: number = DEFAULT_CACHE_DURATION_MS,
  forceRefresh: boolean = false,
): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';

  // Only cache GET requests
  if (method !== 'GET') {
    const response = await nativeFetcher(url, options);
    return response.json() as Promise<T>;
  }

  // 1. Check in-memory cache
  if (!forceRefresh && apiResponseCache.has(url)) {
    const cachedEntry = apiResponseCache.get(url)!;
    if (Date.now() - cachedEntry.timestamp < cacheDurationMs) {
      return Promise.resolve(cachedEntry.data as T);
    }
  }

  // 2. Try persistent cache (localStorage)
  if (!forceRefresh) {
    try {
      const storedCache = localStorage.getItem(persistentApiResponseCacheKey);
      if (storedCache) {
        const persistentCache: ApiCache<T> = JSON.parse(storedCache);
        const cachedEntry = persistentCache[url];
        if (cachedEntry && Date.now() - cachedEntry.timestamp < cacheDurationMs) {
          apiResponseCache.set(url, cachedEntry); // Update in-memory cache
          return Promise.resolve(cachedEntry.data);
        }
      }
    } catch (error) {
      console.warn('Failed to read or parse persistent cache:', error);
      // Clear corrupted cache
      localStorage.removeItem(persistentApiResponseCacheKey);
    }
  }

  // 3. Fetch from network
  try {
    const response = await nativeFetcher(url, options);
    const data = (await response.json()) as T;

    // 4. Update caches
    const newCacheEntry: CacheEntry<T> = {
      timestamp: Date.now(),
      data,
    };
    apiResponseCache.set(url, newCacheEntry);

    try {
      const storedCache = localStorage.getItem(persistentApiResponseCacheKey);
      const persistentCache: ApiCache<T> = storedCache ? JSON.parse(storedCache) : {};
      persistentCache[url] = newCacheEntry;
      localStorage.setItem(persistentApiResponseCacheKey, JSON.stringify(persistentCache));
    } catch (error) {
      console.warn('Failed to update persistent cache:', error);
    }

    return data;
  } catch (error) {
    // If fetch fails, remove potentially stale entry from in-memory cache to avoid returning it on next try.
    // Persistent cache will be overwritten on next successful fetch.
    apiResponseCache.delete(url);
    throw error; // Re-throw the error from nativeFetcher
  }
}
