import type { ContextProvider } from '../types/config.types';

export class ContextManager {
  private providers: Map<string, ContextProvider> = new Map();
  private staticContext: Record<string, unknown> = {};

  addProvider(provider: ContextProvider): void {
    this.providers.set(provider.name, provider);
  }

  removeProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  getProvider(name: string): ContextProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): ContextProvider[] {
    return Array.from(this.providers.values());
  }

  setStaticContext(key: string, value: unknown): void {
    this.staticContext[key] = value;
  }

  removeStaticContext(key: string): void {
    delete this.staticContext[key];
  }

  getStaticContext(): Record<string, unknown> {
    return { ...this.staticContext };
  }

  clearStaticContext(): void {
    this.staticContext = {};
  }

  collectContext(): Record<string, unknown> {
    const context: Record<string, unknown> = {
      ...this.staticContext,
    };

    // Collect from all providers
    this.providers.forEach((provider) => {
      try {
        const providerContext = provider.getContext();
        Object.assign(context, providerContext);
      } catch (error) {
        console.warn(`Context provider '${provider.name}' failed:`, error);
      }
    });

    return context;
  }

  collectContextSafely(): {
    context: Record<string, unknown>;
    errors: Array<{ providerName: string; error: Error }>;
  } {
    const context: Record<string, unknown> = {
      ...this.staticContext,
    };
    const errors: Array<{ providerName: string; error: Error }> = [];

    this.providers.forEach((provider) => {
      try {
        const providerContext = provider.getContext();
        Object.assign(context, providerContext);
      } catch (error) {
        errors.push({
          providerName: provider.name,
          error: error as Error,
        });
      }
    });

    return { context, errors };
  }

  // Utility methods
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  // Validation
  validateProviders(): Array<{ providerName: string; error: string }> {
    const issues: Array<{ providerName: string; error: string }> = [];

    this.providers.forEach((provider, name) => {
      if (!provider.name) {
        issues.push({ providerName: name, error: 'Provider name is missing' });
      }

      if (typeof provider.getContext !== 'function') {
        issues.push({ providerName: name, error: 'Provider getContext method is missing or not a function' });
      }

      // Test if getContext can be called without errors
      try {
        provider.getContext();
      } catch (error) {
        issues.push({
          providerName: name,
          error: `Provider getContext throws error: ${(error as Error).message}`,
        });
      }
    });

    return issues;
  }
}
