/**
 * Basic Usage Examples for @web-loom/http-core
 */

import { createHttpClient, createMockAdapter } from '../src';

// ============================================================================
// Example 1: Basic Client Setup
// ============================================================================

const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: {
    'X-App-Version': '1.0.0',
  },
  timeout: 10000,
  retry: true,
});

// ============================================================================
// Example 2: Making Requests
// ============================================================================

async function basicRequests() {
  // GET request
  const users = await client.get<User[]>('/users');
  console.log(users.data);

  // POST request
  const newUser = await client.post<User>('/users', {
    name: 'John Doe',
    email: 'john@example.com',
  });

  // PUT request
  await client.put(`/users/${newUser.data.id}`, {
    name: 'Jane Doe',
  });

  // DELETE request
  await client.delete(`/users/${newUser.data.id}`);

  // Query parameters
  const filtered = await client.get('/users', {
    params: { role: 'admin', active: true },
  });
}

// ============================================================================
// Example 3: Request Interceptors
// ============================================================================

// Add authentication token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
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
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers = {
      ...config.headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  return config;
});

// ============================================================================
// Example 4: Response Interceptors
// ============================================================================

// Unwrap nested data
client.interceptors.response.use((response) => {
  if (response.data?.data) {
    response.data = response.data.data;
  }
  return response;
});

// Log responses
client.interceptors.response.use((response) => {
  console.log(`${response.config.method} ${response.config.url}`, {
    status: response.status,
    duration: Date.now() - (response.config.metadata?.startTime || 0),
  });
  return response;
});

// ============================================================================
// Example 5: Error Handling
// ============================================================================

client.interceptors.error.use(async (error) => {
  // Handle token refresh on 401
  if (error.status === 401 && error.config) {
    const newToken = await refreshToken();
    localStorage.setItem('auth_token', newToken);

    // Retry the original request
    error.config.headers = {
      ...error.config.headers,
      Authorization: `Bearer ${newToken}`,
    };

    return client.request(error.config);
  }

  // Custom error messages
  if (error.status === 403) {
    error.message = 'You do not have permission to perform this action';
  }

  throw error;
});

// ============================================================================
// Example 6: Request Cancellation
// ============================================================================

async function cancellableRequest() {
  const controller = new AbortController();

  // Start request
  const promise = client.get('/slow-endpoint', {
    signal: controller.signal,
  });

  // Cancel after 2 seconds
  setTimeout(() => controller.abort(), 2000);

  try {
    await promise;
  } catch (error) {
    console.log('Request cancelled');
  }
}

// ============================================================================
// Example 7: Mock Adapter for Testing
// ============================================================================

function setupMocks() {
  const mock = createMockAdapter();

  // Mock GET request
  mock.onGet('/users', () => ({
    data: [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' },
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
    delay: 2000,
  }));

  // Mock error
  mock.onGet('/error', () => ({
    status: 500,
    data: { message: 'Server error' },
  }));

  return mock;
}

// ============================================================================
// Example 8: Custom Retry Configuration
// ============================================================================

const retryClient = createHttpClient({
  baseURL: 'https://api.example.com',
  retry: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    shouldRetry: (error, attempt) => {
      // Always retry rate limits
      if (error.status === 429) return true;

      // Retry server errors up to 3 times
      if (error.status && error.status >= 500) {
        return attempt < 3;
      }

      return false;
    },
  },
});

// ============================================================================
// Example 9: Request Deduplication
// ============================================================================

const dedupeClient = createHttpClient({
  baseURL: 'https://api.example.com',
  deduplicate: true,
});

async function deduplicatedRequests() {
  // These three requests will result in only one network call
  const [r1, r2, r3] = await Promise.all([
    dedupeClient.get('/users'),
    dedupeClient.get('/users'),
    dedupeClient.get('/users'),
  ]);

  console.log(r1.data === r2.data); // true
}

// ============================================================================
// Example 10: API Client Class
// ============================================================================

class ApiClient {
  private client = createHttpClient({
    baseURL: 'https://api.example.com',
    retry: true,
    deduplicate: true,
  });

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async getUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    return response.data;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await this.client.post<User>('/users', data);
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

async function refreshToken(): Promise<string> {
  // Implement token refresh logic
  return 'new-token';
}
