# @web-loom/http-core

A lightweight, TypeScript-first HTTP client with interceptors, automatic retries, request cancellation, and comprehensive error handling. Built on modern Web Platform standards.

## Features

- 🚀 **Lightweight** - < 10KB gzipped, zero dependencies (except RxJS)
- 🔄 **Automatic Retries** - Exponential backoff with jitter
- 🎯 **Request Interceptors** - Transform requests before sending
- 📥 **Response Interceptors** - Transform responses after receiving
- ❌ **Error Handling** - Standardized error format with transformation
- 🔌 **Request Cancellation** - Built-in AbortController support
- 🔁 **Request Deduplication** - Avoid duplicate in-flight requests
- 🧪 **Mock Adapter** - Easy testing and development
- 📘 **TypeScript** - Full type safety with generics
- 🎨 **Clean API** - Axios-like interface, intuitive and familiar

## Installation

```bash
npm install @web-loom/http-core
```

## Quick Start

```typescript
import { createHttpClient } from '@web-loom/http-core';

// Create a client instance
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'X-App-Version': '1.0.0',
  },
  timeout: 10000,
  retry: true,
});

// Make requests
const response = await client.get<User[]>('/users');
console.log(response.data);

// POST with data
await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});
```

## API Reference

### Creating a Client

```typescript
const client = createHttpClient(config?: HttpClientConfig);
```

**Configuration Options:**

```typescript
interface HttpClientConfig {
  baseURL?: string; // Base URL for all requests
  headers?: Record<string, string>; // Default headers
  timeout?: number; // Request timeout in ms
  credentials?: RequestCredentials; // 'omit' | 'same-origin' | 'include'
  mode?: RequestMode; // 'cors' | 'no-cors' | 'same-origin'
  retry?: RetryConfig | boolean; // Retry configuration
  deduplicate?: boolean; // Enable request deduplication
  mockAdapter?: MockAdapter; // Mock adapter for testing
}
```

### Request Methods

All methods return `Promise<HttpResponse<T>>`:

```typescript
client.get<T>(url: string, config?: RequestConfig)
client.post<T>(url: string, data?: any, config?: RequestConfig)
client.put<T>(url: string, data?: any, config?: RequestConfig)
client.patch<T>(url: string, data?: any, config?: RequestConfig)
client.delete<T>(url: string, config?: RequestConfig)
client.head<T>(url: string, config?: RequestConfig)
client.options<T>(url: string, config?: RequestConfig)
```

### Request Configuration

```typescript
interface RequestConfig {
  url?: string;
  method?: HttpMethod;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>; // Query parameters
  data?: any; // Request body
  timeout?: number;
  signal?: AbortSignal; // For cancellation
  credentials?: RequestCredentials;
  mode?: RequestMode;
  retry?: RetryConfig | boolean;
  deduplicate?: boolean;
  metadata?: Record<string, any>; // Custom metadata
}
```

### Response Object

```typescript
interface HttpResponse<T> {
  data: T; // Parsed response data
  status: number; // HTTP status code
  statusText: string; // Status text
  headers: Headers; // Response headers
  config: RequestConfig; // Original request config
  response: Response; // Original fetch Response
}
```

## Interceptors

### Request Interceptors

Transform requests before they're sent:

```typescript
// Add authentication token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add CSRF token
client.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    'X-CSRF-Token': getCsrfToken(),
  };
  return config;
});
```

### Response Interceptors

Transform responses after they're received:

```typescript
// Transform data format
client.interceptors.response.use((response) => {
  // Unwrap nested data
  if (response.data?.data) {
    response.data = response.data.data;
  }
  return response;
});

// Log responses
client.interceptors.response.use((response) => {
  console.log(`${response.config.method} ${response.config.url}`, response.status);
  return response;
});
```

### Error Interceptors

Handle and transform errors:

```typescript
// Token refresh on 401
client.interceptors.error.use(async (error) => {
  if (error.status === 401) {
    await refreshToken();
    // Optionally retry the request
  }
  return error;
});

// Custom error messages
client.interceptors.error.use((error) => {
  if (error.status === 403) {
    error.message = 'You do not have permission to perform this action';
  }
  return error;
});
```

### Managing Interceptors

```typescript
// Add interceptor and get ID
const id = client.interceptors.request.use(interceptor);

// Remove specific interceptor
client.interceptors.request.eject(id);

// Clear all interceptors
client.interceptors.request.clear();
```

## Retry Logic

### Basic Retry

```typescript
// Enable with defaults
const client = createHttpClient({
  retry: true,
});

// Custom retry configuration
const client = createHttpClient({
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryableStatuses: [429, 500, 502, 503, 504],
  },
});
```

### Per-Request Retry

```typescript
// Override for specific request
await client.get('/data', {
  retry: {
    maxRetries: 5,
    initialDelay: 500,
  },
});

// Disable retry for specific request
await client.post('/critical', data, { retry: false });
```

### Custom Retry Logic

```typescript
const client = createHttpClient({
  retry: {
    maxRetries: 3,
    shouldRetry: (error, attempt) => {
      // Custom retry condition
      if (error.status === 429) {
        // Always retry rate limits
        return true;
      }
      if (error.status && error.status >= 500) {
        // Retry server errors up to 2 times
        return attempt < 2;
      }
      return false;
    },
  },
});
```

## Request Cancellation

### Using AbortController

```typescript
const controller = new AbortController();

// Pass signal to request
const promise = client.get('/data', {
  signal: controller.signal,
});

// Cancel the request
controller.abort();

try {
  await promise;
} catch (error) {
  console.log('Request cancelled');
}
```

### Timeout

```typescript
// Global timeout
const client = createHttpClient({
  timeout: 5000, // 5 seconds
});

// Per-request timeout
await client.get('/slow-endpoint', {
  timeout: 30000, // 30 seconds
});
```

## Request Deduplication

Prevent duplicate in-flight requests:

```typescript
const client = createHttpClient({
  deduplicate: true,
});

// These three requests will result in only one network call
const [r1, r2, r3] = await Promise.all([client.get('/users'), client.get('/users'), client.get('/users')]);

// All receive the same response
console.log(r1.data === r2.data); // true
```

## Error Handling

### Error Object

```typescript
interface ApiError extends Error {
  name: 'ApiError';
  status?: number; // HTTP status code
  statusText?: string; // Status text
  config?: RequestConfig; // Request config
  data?: any; // Response data
  originalError?: Error; // Original error
  isRetryable?: boolean; // Whether error is retryable
}
```

### Handling Errors

```typescript
try {
  const response = await client.get('/users');
} catch (error) {
  const apiError = error as ApiError;

  if (apiError.status === 404) {
    console.log('Resource not found');
  } else if (apiError.status === 401) {
    console.log('Unauthorized');
  } else if (apiError.isRetryable) {
    console.log('Temporary error, will retry');
  } else {
    console.log('Error:', apiError.message);
  }
}
```

## Mock Adapter

Perfect for testing and development:

```typescript
import { createHttpClient, createMockAdapter } from '@web-loom/http-core';

const mock = createMockAdapter();

// Mock GET request
mock.onGet('/users', () => ({
  data: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ],
}));

// Mock POST request
mock.onPost('/users', (config) => ({
  status: 201,
  data: { id: 3, ...config.data },
}));

// Mock with delay
mock.onGet('/slow', () => ({
  data: 'result',
  delay: 2000, // 2 second delay
}));

// Mock error
mock.onGet('/error', () => ({
  status: 500,
  data: { message: 'Server error' },
}));

// Use with client
const client = createHttpClient({
  mockAdapter: mock,
});

// Reset mocks
mock.reset();
```

## TypeScript Support

Full type safety with generics:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

// Type-safe requests
const response = await client.get<User[]>('/users');
const users: User[] = response.data; // Typed!

const newUser = await client.post<User>('/users', {
  name: 'John',
  email: 'john@example.com',
} as CreateUserDto);

const user: User = newUser.data; // Typed!
```

## Advanced Examples

### Authentication Flow

```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
});

// Add auth token to all requests
client.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Handle token refresh on 401
client.interceptors.error.use(async (error) => {
  if (error.status === 401 && error.config) {
    const newToken = await refreshAuthToken();

    // Retry original request with new token
    error.config.headers = {
      ...error.config.headers,
      Authorization: `Bearer ${newToken}`,
    };

    return client.request(error.config);
  }
  throw error;
});
```

### Request Logging

```typescript
// Log all requests
client.interceptors.request.use((config) => {
  console.log(`→ ${config.method} ${config.url}`, config.data);
  return config;
});

// Log all responses
client.interceptors.response.use((response) => {
  console.log(`← ${response.status} ${response.config.url}`, response.data);
  return response;
});

// Log all errors
client.interceptors.error.use((error) => {
  console.error(`✗ ${error.status} ${error.config?.url}`, error.message);
  throw error;
});
```

### API Client Class

```typescript
class ApiClient {
  private client: HttpClient;

  constructor(baseURL: string) {
    this.client = createHttpClient({
      baseURL,
      retry: true,
      deduplicate: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      // Add auth
      return config;
    });
  }

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await this.client.post<User>('/users', data);
    return response.data;
  }
}
```

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
