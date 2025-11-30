# API Documentation

## Core Classes

### HttpClient

The main HTTP client class that handles all requests.

#### Constructor

```typescript
new HttpClient(config?: HttpClientConfig)
```

#### Methods

##### `get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a GET request.

##### `post<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a POST request with optional data.

##### `put<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a PUT request with optional data.

##### `patch<T>(url: string, data?: any, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a PATCH request with optional data.

##### `delete<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a DELETE request.

##### `head<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform a HEAD request.

##### `options<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>>`
Perform an OPTIONS request.

##### `request<T>(config: RequestConfig): Promise<HttpResponse<T>>`
Perform a request with full configuration control.

#### Properties

##### `interceptors`
Access to interceptor managers:
- `interceptors.request`: Request interceptor manager
- `interceptors.response`: Response interceptor manager
- `interceptors.error`: Error interceptor manager

---

## Factory Functions

### `createHttpClient(config?: HttpClientConfig): HttpClient`
Create a new HTTP client instance with optional configuration.

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retry: true,
});
```

### `createMockAdapter(): SimpleMockAdapter`
Create a mock adapter for testing.

```typescript
const mock = createMockAdapter();
mock.onGet('/users', () => ({ data: [] }));
```

---

## Types

### HttpClientConfig

Configuration for the HTTP client.

```typescript
interface HttpClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  retry?: RetryConfig | boolean;
  deduplicate?: boolean;
  mockAdapter?: MockAdapter;
}
```

### RequestConfig

Configuration for individual requests.

```typescript
interface RequestConfig {
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  retry?: RetryConfig | boolean;
  deduplicate?: boolean;
  metadata?: Record<string, any>;
}
```

### HttpResponse<T>

Response wrapper containing data and metadata.

```typescript
interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
  response: Response;
}
```

### ApiError

Standardized error object.

```typescript
interface ApiError extends Error {
  name: 'ApiError';
  status?: number;
  statusText?: string;
  config?: RequestConfig;
  data?: any;
  originalError?: Error;
  isRetryable?: boolean;
}
```

### RetryConfig

Configuration for retry behavior.

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryableStatuses?: number[];
  shouldRetry?: (error: ApiError, attempt: number) => boolean;
}
```

---

## Interceptors

### Request Interceptors

Transform requests before they are sent.

```typescript
type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;
```

**Usage:**
```typescript
client.interceptors.request.use((config) => {
  config.headers = { ...config.headers, 'X-Token': 'abc' };
  return config;
});
```

### Response Interceptors

Transform responses after they are received.

```typescript
type ResponseInterceptor = <T = any>(
  response: HttpResponse<T>
) => HttpResponse<T> | Promise<HttpResponse<T>>;
```

**Usage:**
```typescript
client.interceptors.response.use((response) => {
  response.data = transformData(response.data);
  return response;
});
```

### Error Interceptors

Handle and transform errors.

```typescript
type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;
```

**Usage:**
```typescript
client.interceptors.error.use((error) => {
  if (error.status === 401) {
    // Handle unauthorized
  }
  return error;
});
```

---

## Mock Adapter

### SimpleMockAdapter

Mock adapter for testing and development.

#### Methods

##### `onGet(url: string | RegExp, handler: MockHandler): this`
Mock GET requests.

##### `onPost(url: string | RegExp, handler: MockHandler): this`
Mock POST requests.

##### `onPut(url: string | RegExp, handler: MockHandler): this`
Mock PUT requests.

##### `onPatch(url: string | RegExp, handler: MockHandler): this`
Mock PATCH requests.

##### `onDelete(url: string | RegExp, handler: MockHandler): this`
Mock DELETE requests.

##### `on(method: string, url: string | RegExp, handler: MockHandler): this`
Mock requests with specific method.

##### `onAny(url: string | RegExp, handler: MockHandler): this`
Mock any request matching the URL pattern.

##### `reset(): void`
Reset all mocks.

#### MockHandler

```typescript
type MockHandler = (config: RequestConfig) => MockResponse | Promise<MockResponse>;
```

#### MockResponse

```typescript
interface MockResponse {
  status?: number;
  data?: any;
  headers?: Record<string, string>;
  delay?: number;
}
```

---

## Utility Functions

### `buildURL(baseURL: string | undefined, url: string | undefined): string`
Build a full URL from base URL and relative path.

### `buildQueryString(params: Record<string, any>): string`
Build query string from params object.

### `mergeHeaders(...headersList: (Record<string, string> | undefined)[]): Record<string, string>`
Merge multiple header objects.

### `createRequestSignature(config: RequestConfig): string`
Create a unique signature for request deduplication.

### `createApiError(...): ApiError`
Create a standardized API error.

### `isRetryableError(status?: number): boolean`
Check if an error is retryable based on status code.

### `normalizeRetryConfig(retry?: RetryConfig | boolean): RetryConfig | null`
Normalize retry configuration.

### `calculateRetryDelay(attempt: number, config: RetryConfig): number`
Calculate retry delay with exponential backoff.

---

## Constants

### `DEFAULT_RETRY_CONFIG`

Default retry configuration:

```typescript
{
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableStatuses: [429, 500, 502, 503, 504],
  shouldRetry: () => true,
}
```
