# @web-loom/error-core

A comprehensive, framework-agnostic error handling and logging library for TypeScript/JavaScript applications.

## Features

- ✅ **Zero Dependencies** - Pure TypeScript implementation
- ✅ **Framework Agnostic** - Works with React, Angular, Vue, Svelte, or vanilla JS
- ✅ **Type-Safe** - Full TypeScript support with strict typing
- ✅ **Tree-Shakable** - Modular ES exports for optimal bundle size
- ✅ **Composable** - Pick and choose components as needed
- ✅ **Production Ready** - Comprehensive error handling, logging, and monitoring

## Installation

```bash
npm install @web-loom/error-core
```

## Quick Start

```typescript
import { createErrorCore, NetworkError, ValidationError } from '@web-loom/error-core';

// Initialize with default configuration
const errorCore = createErrorCore({
  logLevel: 'info',
  captureUnhandled: true,
});

// Create a logger
const logger = errorCore.createLogger('my-app');

// Handle errors
try {
  await fetchData();
} catch (error) {
  if (error instanceof NetworkError) {
    errorCore.captureError(error, {
      severity: 'warn',
      userFacing: true,
    });
  } else {
    errorCore.captureError(error);
  }
}

// Structured logging
logger.info('Application started', { version: '1.0.0' });
logger.error('Failed to fetch user data', error, { userId: '123' });
```

## Core Components

### Error Classes

#### BaseError

Abstract base class for all error types with enhanced metadata:

```typescript
import { BaseError } from '@web-loom/error-core';

class CustomError extends BaseError {
  constructor(message: string, options?: ErrorConstructorOptions) {
    super(message, {
      name: 'CustomError',
      code: 'CUSTOM_ERROR',
      category: 'business',
      severity: 'error',
      recoverable: true,
      retryable: false,
      userFacing: true,
      ...options,
    });
  }
}
```

#### Built-in Error Types

```typescript
import { NetworkError, ValidationError, BusinessError, CompositeError } from '@web-loom/error-core';

// Network errors with status codes
throw new NetworkError('API request failed', {
  statusCode: 500,
  endpoint: '/api/users',
  method: 'GET',
});

// Validation errors with field information
throw new ValidationError('Invalid email format', {
  field: 'email',
  validationType: 'format',
  value: 'invalid-email',
});

// Business logic errors
throw new BusinessError('Insufficient balance', {
  operation: 'withdrawal',
  domain: 'banking',
});

// Multiple errors aggregation
const errors = [error1, error2, error3];
throw new CompositeError('Multiple validation errors', errors);
```

### Error Handler

Central orchestrator for error capture and processing:

```typescript
import { ErrorHandler } from '@web-loom/error-core';

const errorHandler = ErrorHandler.initialize({
  autoCapture: true,
  captureUnhandled: true,
  captureRejections: true,
  logLevel: 'error',
  maxBreadcrumbs: 50,
});

// Capture errors with context
const errorId = errorHandler.captureError(
  error,
  {
    severity: 'critical',
    userFacing: false,
  },
  {
    userId: 'user123',
    operation: 'data-sync',
  },
);

// Add custom error handler
const unsubscribe = errorHandler.onError((capturedError) => {
  // Send to external monitoring service
  sendToMonitoring(capturedError);
});
```

### Logging System

Structured logging with multiple transports:

```typescript
import { StructuredLogger, ConsoleTransport, HttpTransport, MemoryTransport } from '@web-loom/error-core';

const logger = new StructuredLogger({
  level: 'info',
  format: 'json',
});

// Add transports
logger.addTransport(
  new ConsoleTransport({
    level: 'debug',
    colorEnabled: true,
  }),
);

logger.addTransport(
  new HttpTransport({
    endpoint: 'https://api.example.com/logs',
    batchSize: 10,
    batchTimeout: 5000,
  }),
);

logger.addTransport(
  new MemoryTransport({
    maxSize: 1000,
  }),
);

// Use logger
logger.info('User logged in', { userId: '123' });
logger.error('Database connection failed', error, { retryAttempt: 3 });
```

### Strategy Patterns

#### Retry Strategy

```typescript
import { RetryStrategy, RETRY_STRATEGIES } from '@web-loom/error-core';

// Use predefined strategy
await RETRY_STRATEGIES.STANDARD.execute(
  async () => await apiCall(),
  (error, attempt, delay) => {
    console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
  },
);

// Custom retry strategy
const retryStrategy = new RetryStrategy({
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error, attempt) => {
    return error.name === 'NetworkError' && attempt < 3;
  },
});
```

#### Circuit Breaker

```typescript
import { CircuitBreaker, CIRCUIT_BREAKER_PRESETS } from '@web-loom/error-core';

// Use preset
const circuitBreaker = CIRCUIT_BREAKER_PRESETS.API;

try {
  const result = await circuitBreaker.execute(() => externalServiceCall(), 'external-service');
} catch (error) {
  if (error instanceof CircuitOpenError) {
    // Handle circuit breaker open state
    console.log('Circuit breaker is open, using fallback');
  }
}

// Custom circuit breaker
const customBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 60000,
  halfOpenMaxAttempts: 2,
});
```

#### Fallback Strategy

```typescript
import { FallbackManager, CacheStrategy, DefaultValueStrategy, AlternativeServiceStrategy } from '@web-loom/error-core';

const fallbackManager = new FallbackManager([
  new CacheStrategy('user-data', cacheProvider, 100),
  new AlternativeServiceStrategy(
    () => backupServiceCall(),
    () => backupServiceAvailable(),
    75,
  ),
  new DefaultValueStrategy({ name: 'Unknown User' }, 10),
]);

const userData = await fallbackManager.executeWithFallback(() => primaryUserService.getUser(userId), {
  onFallback: (strategy, error) => {
    console.log(`Using fallback: ${strategy.name} due to: ${error.message}`);
  },
});
```

### Context Management

Automatic context collection for enhanced error reporting:

```typescript
import {
  ContextManager,
  BrowserContextProvider,
  UserContextProvider,
  ApplicationContextProvider,
} from '@web-loom/error-core';

const contextManager = new ContextManager();

// Add built-in providers
contextManager.addProvider(new BrowserContextProvider());
contextManager.addProvider(
  new ApplicationContextProvider({
    name: 'MyApp',
    version: '1.0.0',
    environment: 'production',
  }),
);

// Add custom user context
const userProvider = new UserContextProvider();
userProvider.setUser({
  id: 'user123',
  email: 'user@example.com',
  role: 'admin',
});
contextManager.addProvider(userProvider);

// Collect all context
const context = contextManager.collectContext();
```

### Utilities

#### Type Guards

```typescript
import { isNetworkError, isValidationError, isRetryableError, hasStatusCode } from '@web-loom/error-core';

if (isNetworkError(error)) {
  // Handle network-specific logic
  console.log('Network error occurred');
}

if (isRetryableError(error)) {
  // Implement retry logic
  await retryOperation();
}

if (hasStatusCode(error)) {
  // Handle HTTP status codes
  console.log(`HTTP ${error.statusCode}: ${error.message}`);
}
```

#### Error Normalization

```typescript
import { normalizeError, getErrorFingerprint } from '@web-loom/error-core';

// Normalize any error-like value
const normalized = normalizeError(unknownError);

// Generate consistent fingerprint for grouping
const fingerprint = getErrorFingerprint(error);
```

#### Debouncing and Throttling

```typescript
import { debounce, throttle, delay, timeout } from '@web-loom/error-core';

// Debounce function calls
const debouncedLog = debounce(console.log, 1000);

// Throttle function calls
const throttledUpdate = throttle(updateUI, 100);

// Add timeout to promises
const result = await timeout(fetchData(), 5000, 'Fetch operation timed out');
```

## Configuration

### Error Handler Configuration

```typescript
interface ErrorHandlerConfig {
  // Core settings
  autoCapture?: boolean; // Auto-capture unhandled errors
  captureUnhandled?: boolean; // Capture uncaught exceptions
  captureRejections?: boolean; // Capture unhandled promise rejections

  // Logging
  logLevel?: LogLevel; // Minimum log level
  defaultTransports?: TransportConfig[];

  // Context
  defaultContext?: Partial<ErrorContext>;

  // Error handling
  maxBreadcrumbs?: number; // Maximum breadcrumbs to keep
  normalizeStackTraces?: boolean; // Normalize stack traces

  // Performance
  batchSize?: number; // Batch size for transports
  batchTimeout?: number; // Batch timeout in ms
  maxQueueSize?: number; // Maximum queue size
}
```

### Logger Configuration

```typescript
interface LoggerConfig {
  level?: LogLevel; // debug | info | warn | error | critical
  format?: 'json' | 'text' | 'simple';
  transports?: TransportConfig[];
  context?: Record<string, unknown>;
}
```

### Transport Configuration

```typescript
// Console Transport
new ConsoleTransport({
  level: 'debug',
  colorEnabled: true,
  format: 'text',
});

// HTTP Transport
new HttpTransport({
  endpoint: 'https://api.logs.com/v1/logs',
  batchSize: 50,
  batchTimeout: 10000,
  headers: {
    Authorization: 'Bearer token',
    'X-API-Key': 'api-key',
  },
});

// Memory Transport
new MemoryTransport({
  maxSize: 1000,
  level: 'error',
});
```

## Framework Integration

### React Integration

```typescript
import React from 'react';
import { ErrorHandler, BaseError } from '@web-loom/error-core';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    ErrorHandler.getInstance().captureError(error, {
      category: 'runtime',
      severity: 'error',
    }, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Vue Integration

```typescript
import { createApp } from 'vue';
import { ErrorHandler } from '@web-loom/error-core';

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  ErrorHandler.getInstance().captureError(
    err,
    {
      category: 'runtime',
      severity: 'error',
    },
    {
      componentInfo: info,
      component: instance?.$options.name,
    },
  );
};
```

### Node.js Integration

```typescript
import { ErrorHandler } from '@web-loom/error-core';

const errorHandler = ErrorHandler.initialize({
  captureUnhandled: true,
  captureRejections: true,
});

// Express middleware
app.use((err, req, res, next) => {
  const errorId = errorHandler.captureError(
    err,
    {
      severity: 'error',
    },
    {
      requestId: req.id,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    },
  );

  res.status(500).json({
    error: 'Internal Server Error',
    errorId,
  });
});
```

## Advanced Usage

### Custom Error Classes

```typescript
import { BaseError } from '@web-loom/error-core';

export class PaymentError extends BaseError {
  constructor(
    message: string,
    options: {
      paymentId?: string;
      amount?: number;
      provider?: string;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      name: 'PaymentError',
      code: 'PAYMENT_FAILED',
      category: 'business',
      severity: 'error',
      recoverable: true,
      retryable: true,
      userFacing: false,
      cause: options.cause,
      context: {
        paymentId: options.paymentId,
        amount: options.amount,
        provider: options.provider,
      },
    });
  }
}
```

### Custom Context Provider

```typescript
import { ContextProvider } from '@web-loom/error-core';

class DatabaseContextProvider implements ContextProvider {
  readonly name = 'database';

  constructor(private connectionPool: any) {}

  getContext(): Record<string, unknown> {
    return {
      activeConnections: this.connectionPool.getActiveCount(),
      totalConnections: this.connectionPool.getTotalCount(),
      waitingConnections: this.connectionPool.getWaitingCount(),
      lastQueryTime: this.connectionPool.getLastQueryTime(),
    };
  }
}
```

### Custom Transport

```typescript
import { Transport, LogEntry } from '@web-loom/error-core';

class SlackTransport implements Transport {
  readonly name = 'slack';

  constructor(private webhookUrl: string) {}

  async log(entry: LogEntry): Promise<void> {
    if (entry.level === 'critical' || entry.level === 'error') {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 ${entry.level.toUpperCase()}: ${entry.message}`,
          attachments: [
            {
              color: entry.level === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Error', value: entry.error?.message, short: false },
                { title: 'Timestamp', value: entry.timestamp.toISOString(), short: true },
              ],
            },
          ],
        }),
      });
    }
  }

  configure(config: any): void {
    // Configure transport
  }
}
```

## Performance Considerations

### Memory Management

- **Automatic Cleanup**: Old logs and breadcrumbs are automatically cleaned up
- **Configurable Limits**: Set `maxBreadcrumbs`, `maxQueueSize` for memory control
- **Efficient Transports**: Use batching and debouncing for optimal performance

### Bundle Size Optimization

```typescript
// Import only what you need for optimal bundle size
import { BaseError } from '@web-loom/error-core/dist/errors';
import { ConsoleTransport } from '@web-loom/error-core/dist/transports';
import { debounce } from '@web-loom/error-core/dist/utils';
```

## Testing

### Mock Transport for Testing

```typescript
import { MockTransport } from '@web-loom/error-core/dist/test-utils';

const mockTransport = new MockTransport();
logger.addTransport(mockTransport);

// In tests
expect(mockTransport.getLogsByLevel('error')).toHaveLength(1);
expect(mockTransport.logs[0].message).toContain('Expected error message');
```

### Test Utilities

```typescript
import { createTestErrorHandler } from '@web-loom/error-core/dist/test-utils';

const { handler, transport } = createTestErrorHandler();

handler.captureError(new Error('test error'));

expect(transport.logs).toHaveLength(1);
expect(transport.logs[0].level).toBe('error');
```

## API Reference

### Types

```typescript
type ErrorSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type ErrorCategory =
  | 'network'
  | 'validation'
  | 'authentication'
  | 'authorization'
  | 'business'
  | 'runtime'
  | 'third_party'
  | 'unknown';
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  userFacing: boolean;
}

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  appVersion?: string;
  environment?: string;
  requestId?: string;
  correlationId?: string;
  endpoint?: string;
  userAgent?: string;
  url?: string;
  [key: string]: unknown;
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [Festus Yeboah](mailto:festus.yeboah@hotmail.com)
