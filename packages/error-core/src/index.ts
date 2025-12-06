// Main Error Handler and Core Components
export { ErrorHandler } from './core/ErrorHandler';
export { ErrorRegistry, type ErrorRegistryEntry } from './core/ErrorRegistry';
export { ErrorClassifier, type ErrorClassification, type ClassificationRule } from './core/ErrorClassifier';

// Error Classes
export {
  BaseError,
  NetworkError,
  TimeoutError,
  ConnectionError,
  ValidationError,
  RequiredFieldError,
  FormatError,
  RangeError,
  BusinessError,
  InsufficientPermissionError,
  ResourceNotFoundError,
  ConflictError,
  CompositeError,
  AggregateError,
} from './errors';

// Logger and Transports
export { StructuredLogger } from './logger';
export type { Logger, Transport } from './logger';
export { ConsoleTransport, MemoryTransport, HttpTransport } from './transports';

// Strategy Patterns
export {
  RetryStrategy,
  RETRY_STRATEGIES,
  CircuitBreaker,
  CircuitOpenError,
  CIRCUIT_BREAKER_PRESETS,
  FallbackManager,
  CacheStrategy,
  DefaultValueStrategy,
  AlternativeServiceStrategy,
  RetryWithDelayStrategy,
  createFallbackChain,
} from './strategies';
export type { FallbackStrategy } from './strategies';

// Context Management
export {
  ContextManager,
  BrowserContextProvider,
  NodeContextProvider,
  ApplicationContextProvider,
  RequestContextProvider,
  UserContextProvider,
  SessionContextProvider,
  PerformanceContextProvider,
  CustomContextProvider,
} from './context';

// Utilities
export {
  parseStackTrace,
  normalizeStackTrace,
  extractRelevantFrames,
  enhanceStackTrace,
  captureStackTrace,
  getCallerInfo,
  normalizeError,
  isErrorRetryable,
  isErrorRecoverable,
  isUserFacingError,
  categorizeError,
  createErrorChain,
  flattenErrorChain,
  getErrorFingerprint,
  debounce,
  throttle,
  createDebouncedFunction,
  delay,
  timeout,
  batchProcessor,
  isError,
  isBaseError,
  isNetworkError,
  isHttpError,
  isValidationError,
  isAuthenticationError,
  isTimeoutError,
  isRetryableError,
  isRecoverableError,
  hasProperty,
  hasMethod,
  hasStatusCode,
  hasErrorCode,
  hasCause,
} from './utils';

// Type Exports
export type {
  ErrorSeverity,
  ErrorCategory,
  ErrorMetadata,
  ErrorContext,
  CapturedError,
  ErrorBreadcrumb,
  NormalizedError,
  ErrorConstructorOptions,
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
} from './types';
export type { StackFrame, ParsedStackTrace } from './utils';

// Factory Functions
export function createErrorCore(config: import('./types').ErrorHandlerConfig = {}) {
  const { ErrorHandler } = require('./core/ErrorHandler');
  const { StructuredLogger } = require('./logger/StructuredLogger');

  const errorHandler = ErrorHandler.initialize(config);
  const logger = new StructuredLogger({
    level: config.logLevel || 'info',
  });

  // Add default console transport if no transports specified
  if (!config.defaultTransports?.length) {
    const { ConsoleTransport } = require('./transports');
    logger.addTransport(new ConsoleTransport());
  }

  return {
    errorHandler,
    logger,
    captureError: errorHandler.captureError.bind(errorHandler),
    createLogger: (name: string) => logger.createChild(name),
  };
}

// Convenience singleton for quick setup
let globalErrorCore: ReturnType<typeof createErrorCore> | null = null;

export function getGlobalErrorCore(config?: import('./types').ErrorHandlerConfig) {
  if (!globalErrorCore) {
    globalErrorCore = createErrorCore(config);
  }
  return globalErrorCore;
}

export function resetGlobalErrorCore() {
  if (globalErrorCore) {
    globalErrorCore.errorHandler.destroy();
    globalErrorCore = null;
  }
}

// Quick setup functions
export function setupErrorCore(config?: import('./types').ErrorHandlerConfig) {
  return getGlobalErrorCore(config);
}

export function captureError(
  error: Error | unknown,
  metadata?: Partial<import('./types').ErrorMetadata>,
  context?: Record<string, unknown>,
) {
  const errorCore = getGlobalErrorCore();
  return errorCore.captureError(error, metadata, context);
}

export function createLogger(name: string) {
  const errorCore = getGlobalErrorCore();
  return errorCore.createLogger(name);
}
