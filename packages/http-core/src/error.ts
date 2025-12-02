/**
 * HTTP Error Handling
 * Standardized error creation and transformation
 */

import type { ApiError, RequestConfig } from './types';

/**
 * Create a standardized API error
 */
export function createApiError(
  message: string,
  config?: RequestConfig,
  status?: number,
  statusText?: string,
  data?: any,
  originalError?: Error,
): ApiError {
  const error = new Error(message) as ApiError;
  error.name = 'ApiError';
  error.config = config;
  error.status = status;
  error.statusText = statusText;
  error.data = data;
  error.originalError = originalError;
  error.isRetryable = isRetryableError(status);

  return error;
}

/**
 * Check if an error is retryable based on status code
 */
export function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors are retryable

  // Retry on server errors and rate limiting
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Transform a fetch error into an ApiError
 */
export function transformFetchError(error: Error, config: RequestConfig): ApiError {
  if (error.name === 'AbortError') {
    return createApiError('Request was cancelled', config, undefined, undefined, undefined, error);
  }

  if (error.name === 'TimeoutError') {
    return createApiError('Request timeout', config, undefined, undefined, undefined, error);
  }

  return createApiError(error.message || 'Network error', config, undefined, undefined, undefined, error);
}

/**
 * Transform a response error into an ApiError
 */
export async function transformResponseError(response: Response, config: RequestConfig): Promise<ApiError> {
  let data: any;
  const contentType = response.headers.get('content-type');

  try {
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }

  // Capture Retry-After header for rate limiting
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    // Store in data for retry logic to access
    if (typeof data === 'object' && data !== null) {
      data._retryAfter = retryAfter;
    } else {
      data = { _retryAfter: retryAfter, _originalData: data };
    }
  }

  const message = extractErrorMessage(data, response.status);

  return createApiError(message, config, response.status, response.statusText, data);
}

/**
 * Extract a user-friendly error message from response data
 */
function extractErrorMessage(data: any, status: number): string {
  if (typeof data === 'string') return data;

  if (data && typeof data === 'object') {
    // Common error message fields
    const message = data.message || data.error || data.errorMessage || data.detail || data.title;
    if (message) return message;
  }

  // Fallback to status-based messages
  return getStatusMessage(status);
}

/**
 * Get a user-friendly message for HTTP status codes
 */
function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };

  return messages[status] || `Request failed with status ${status}`;
}
