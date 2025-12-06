// Error types and interfaces
export type {
  ErrorSeverity,
  ErrorCategory,
  ErrorMetadata,
  ErrorContext,
  CapturedError,
  ErrorBreadcrumb,
  NormalizedError,
  ErrorConstructorOptions,
} from './error.types';

// Configuration types
export type {
  LogLevel,
  ConsoleMethod,
  LogEntry,
  TransportConfig,
  HttpTransportConfig,
  LoggerConfig,
  ErrorHandlerConfig,
  RetryOptions,
  CircuitState,
  CircuitBreakerOptions,
  ContextProvider,
} from './config.types';
