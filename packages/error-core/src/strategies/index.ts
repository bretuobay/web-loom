// Strategy implementations
export { RetryStrategy, RETRY_STRATEGIES } from './RetryStrategy';
export { CircuitBreaker, CircuitOpenError, CIRCUIT_BREAKER_PRESETS } from './CircuitBreaker';
export {
  FallbackStrategy,
  FallbackManager,
  CacheStrategy,
  DefaultValueStrategy,
  AlternativeServiceStrategy,
  RetryWithDelayStrategy,
  createFallbackChain,
} from './FallbackStrategy';

// Re-export strategy types
export type { RetryOptions, CircuitBreakerOptions, CircuitState } from '../types/config.types';
