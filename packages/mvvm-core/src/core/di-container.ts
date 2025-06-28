// --- Core Types for DI Container ---

/**
 * Represents a constructor for a type T.
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Represents a factory function that produces an instance of type T.
 * Dependencies are resolved and passed as arguments.
 */
export type Factory<T = any> = (...dependencies: any[]) => T;

/**
 * Defines the structure for registering a service.
 * - resolver: The constructor or factory function.
 * - dependencies: An array of keys for services this service depends on.
 * - isSingleton: Whether to create a single instance or a new one each time.
 * - instance: Stores the singleton instance if created.
 */
interface Registration<T = any> {
  resolver: Constructor<T> | Factory<T>;
  dependencies?: (keyof ServiceRegistry)[];
  isSingleton: boolean;
  instance?: T;
}

/**
 * ServiceRegistry defines a map of service keys (strings or symbols) to their types.
 * This interface should be augmented by the application to include all its services.
 *
 * Example augmentation in an application:
 * ```typescript
 * declare module './di-container' { // Or the actual path to this file
 *   interface ServiceRegistry {
 *     notificationService: NotificationService;
 *     userService: UserService;
 *     userRepository: constructor<IUserRepository>; // For abstract class/interface
 *   }
 * }
 * ```
 */
export interface ServiceRegistry {
  // Example services (can be removed or replaced by actual application services)
  // placeholderService?: any;
}

/**
 * A simple dependency injection container using a registry pattern.
 * It supports registration of services as singletons or transients,
 * and resolves dependencies based on constructor/factory parameters.
 */
export class SimpleDIContainer {
  private static registry = new Map<keyof ServiceRegistry, Registration>();

  /**
   * Registers a service with the DI container.
   * @param key A unique key (string or symbol) for the service from ServiceRegistry.
   * @param resolver The constructor (class) or factory function to create the service.
   * @param options Configuration options for the service registration.
   *                `isSingleton`: true if only one instance should be created (default: false).
   *                `dependencies`: An array of keys for services this service depends on.
   *                                These will be resolved and passed to the constructor/factory.
   */
  public static register<K extends keyof ServiceRegistry>(
    key: K,
    resolver: Constructor<NonNullable<ServiceRegistry[K]>> | Factory<NonNullable<ServiceRegistry[K]>>,
    options: {
      isSingleton?: boolean;
      dependencies?: (keyof ServiceRegistry)[];
    } = {}
  ): void {
    if (this.registry.has(key) && (options.isSingleton ?? false)) {
      // console.warn(`DI Container: Service key "${String(key)}" is already registered as a singleton. Re-registration may occur.`);
      // Allow re-registration, useful for tests or overriding defaults.
      // If strict prevention is needed, an error could be thrown here.
    }

    this.registry.set(key, {
      resolver: resolver as Constructor | Factory, // Cast to base types
      dependencies: options.dependencies ?? [],
      isSingleton: options.isSingleton ?? false,
      instance: undefined, // Ensure instance is undefined initially
    });
  }

  /**
   * Resolves (retrieves or creates) an instance of a registered service.
   * @param key The key of the service to resolve.
   * @returns An instance of the resolved service.
   * @throws Error if the service is not registered or if a circular dependency is detected (basic check).
   */
  public static resolve<K extends keyof ServiceRegistry>(key: K, resolutionPath: (keyof ServiceRegistry)[] = []): NonNullable<ServiceRegistry[K]> {
    const registration = this.registry.get(key);

    if (!registration) {
      throw new Error(`DI Container: Service with key "${String(key)}" not registered.`);
    }

    if (resolutionPath.includes(key)) {
        throw new Error(
            `DI Container: Circular dependency detected for key "${String(key)}". Path: ${resolutionPath.join(' -> ')} -> ${String(key)}`
        );
    }

    if (registration.isSingleton && registration.instance !== undefined) {
      return registration.instance as NonNullable<ServiceRegistry[K]>;
    }

    const currentResolutionPath = [...resolutionPath, key];
    const dependencies = (registration.dependencies || []).map(depKey => {
        if (depKey === key) { // Self-dependency, only allowed if not a direct circular constructor call
             throw new Error(`DI Container: Service "${String(key)}" cannot directly depend on itself in the dependencies array.`);
        }
        return this.resolve(depKey, currentResolutionPath);
    });

    let instance: NonNullable<ServiceRegistry[K]>;
    try {
      if (this.isConstructor(registration.resolver)) {
        // It's a class constructor
        instance = new registration.resolver(...dependencies);
      } else {
        // It's a factory function
        instance = registration.resolver(...dependencies);
      }
    } catch (e: any) {
        throw new Error(`DI Container: Error instantiating service "${String(key)}". Original error: ${e.message}`);
    }


    if (registration.isSingleton) {
      registration.instance = instance;
    }

    return instance;
  }

  /**
   * Clears all registered services and their instances.
   * Useful for testing or resetting the container state.
   */
  public static reset(): void {
    this.registry.clear();
  }

  /**
   * Checks if a given resolver is a class constructor.
   */
  private static isConstructor<T>(resolver: Constructor<T> | Factory<T>): resolver is Constructor<T> {
    // A common check: constructors have a 'prototype' property and are functions.
    // Factories are functions but their prototype property might not be as distinct,
    // or they might be arrow functions without a prototype.
    // This check is heuristic and might not cover all edge cases for complex factory types.
    return typeof resolver === 'function' && resolver.prototype !== undefined && resolver.prototype.constructor === resolver;
  }

  /**
   * Unregisters a service. Primarily for testing or dynamic scenarios.
   * @param key The key of the service to unregister.
   */
  public static unregister<K extends keyof ServiceRegistry>(key: K): void {
    this.registry.delete(key);
  }

  /**
   * Checks if a service is registered.
   * @param key The key of the service.
   */
  public static isRegistered<K extends keyof ServiceRegistry>(key: K): boolean {
    return this.registry.has(key);
  }
}
