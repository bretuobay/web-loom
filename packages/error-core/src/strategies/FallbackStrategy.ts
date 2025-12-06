export interface FallbackStrategy<T = unknown> {
  name: string;
  execute(): Promise<T> | T;
  canExecute(): boolean;
  priority: number;
}

export class FallbackManager<T = unknown> {
  private strategies: FallbackStrategy<T>[] = [];

  constructor(strategies: FallbackStrategy<T>[] = []) {
    this.strategies = [...strategies].sort((a, b) => b.priority - a.priority);
  }

  async executeWithFallback(
    primaryOperation: () => Promise<T>,
    options: {
      onFallback?: (strategy: FallbackStrategy<T>, error: Error) => void;
      onAllFallbacksFailed?: (errors: Error[]) => void;
    } = {},
  ): Promise<T> {
    const errors: Error[] = [];

    // Try primary operation first
    try {
      return await primaryOperation();
    } catch (error) {
      errors.push(error as Error);
    }

    // Try fallback strategies in priority order
    for (const strategy of this.strategies) {
      if (!strategy.canExecute()) {
        continue;
      }

      try {
        options.onFallback?.(strategy, errors[errors.length - 1]);
        return await strategy.execute();
      } catch (error) {
        errors.push(error as Error);
      }
    }

    // All strategies failed
    options.onAllFallbacksFailed?.(errors);

    // Throw the original error
    throw errors[0];
  }

  addStrategy(strategy: FallbackStrategy<T>): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  removeStrategy(name: string): boolean {
    const initialLength = this.strategies.length;
    this.strategies = this.strategies.filter((s) => s.name !== name);
    return this.strategies.length < initialLength;
  }

  getStrategies(): FallbackStrategy<T>[] {
    return [...this.strategies];
  }

  clearStrategies(): void {
    this.strategies = [];
  }
}

// Common fallback strategy implementations
export class CacheStrategy<T> implements FallbackStrategy<T> {
  readonly name = 'cache';
  readonly priority: number;

  constructor(
    private cacheKey: string,
    private cacheProvider: {
      get(key: string): Promise<T | null> | T | null;
      set(key: string, value: T, ttl?: number): Promise<void> | void;
    },
    priority: number = 100,
  ) {
    this.priority = priority;
  }

  async execute(): Promise<T> {
    const cachedValue = await this.cacheProvider.get(this.cacheKey);
    if (cachedValue === null) {
      throw new Error(`No cached value found for key: ${this.cacheKey}`);
    }
    return cachedValue;
  }

  canExecute(): boolean {
    return true; // Cache is always available to try
  }
}

export class DefaultValueStrategy<T> implements FallbackStrategy<T> {
  readonly name = 'defaultValue';
  readonly priority: number;

  constructor(
    private defaultValue: T,
    priority: number = 50,
  ) {
    this.priority = priority;
  }

  execute(): T {
    return this.defaultValue;
  }

  canExecute(): boolean {
    return true;
  }
}

export class AlternativeServiceStrategy<T> implements FallbackStrategy<T> {
  readonly name = 'alternativeService';
  readonly priority: number;

  constructor(
    private alternativeOperation: () => Promise<T>,
    private isServiceAvailable: () => boolean,
    priority: number = 75,
  ) {
    this.priority = priority;
  }

  async execute(): Promise<T> {
    return await this.alternativeOperation();
  }

  canExecute(): boolean {
    return this.isServiceAvailable();
  }
}

export class RetryWithDelayStrategy<T> implements FallbackStrategy<T> {
  readonly name = 'retryWithDelay';
  readonly priority: number;

  constructor(
    private operation: () => Promise<T>,
    private delay: number = 1000,
    private maxAttempts: number = 2,
    priority: number = 25,
  ) {
    this.priority = priority;
  }

  async execute(): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          await this.sleep(this.delay);
        }
        return await this.operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === this.maxAttempts) {
          break;
        }
      }
    }

    throw lastError!;
  }

  canExecute(): boolean {
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Utility function to create common fallback patterns
export function createFallbackChain<T>(options: {
  cache?: {
    key: string;
    provider: {
      get(key: string): Promise<T | null> | T | null;
      set(key: string, value: T, ttl?: number): Promise<void> | void;
    };
  };
  alternativeService?: () => Promise<T>;
  defaultValue?: T;
  retryDelay?: number;
  retryAttempts?: number;
}): FallbackManager<T> {
  const strategies: FallbackStrategy<T>[] = [];

  if (options.cache) {
    strategies.push(new CacheStrategy(options.cache.key, options.cache.provider, 100));
  }

  if (options.alternativeService) {
    strategies.push(
      new AlternativeServiceStrategy(
        options.alternativeService,
        () => true, // Assume always available unless specified
        75,
      ),
    );
  }

  if (options.retryDelay !== undefined) {
    // This would need the primary operation, so it's a placeholder
    // In real usage, this would be configured with the actual operation
  }

  if (options.defaultValue !== undefined) {
    strategies.push(new DefaultValueStrategy(options.defaultValue, 10));
  }

  return new FallbackManager(strategies);
}
